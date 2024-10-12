import * as dotenv from "dotenv";
import WebSocket, {WebSocketServer} from "ws";
import {Anyone} from "botlandia/core/anyone";
import {Logger} from "botlandia/utils/logger";
import {BuilderAnyone} from "botlandia/core/builders/builder.anyone";
import {BrainType} from "botlandia/core/enums";
import {v4 as uuidv4} from "uuid";
import {ToolStore} from "botlandia/tool-store";
import {Incarnations} from "botlandia/core/soul/incarnations";
import {RabbitUtil} from "botlandia/utils/rabbit.util";
import {AVATARS, NAMES} from "botlandia/utils/names";
import {getActiveProfile} from "botlandia/utils/agentUtils";
import {ToolsMemory} from "botlandia/utils/tools.memory";
import {EVENTS_WS, IToolData, IWhatsappMessage, WS_STATUS} from "botlandia/core/interfaces";
import {BrainFactory} from "botlandia/core/factory";

dotenv.config();

export class IaraWebSocket {
    private readonly webSocketServer: WebSocketServer;
    private readonly iaraAgent: Anyone;
    private readonly toolStore = new ToolStore();
    private readonly rabbitUtil = new RabbitUtil();
    private readonly toolsMemory = new ToolsMemory();
    private listOfAgents: Map<string, { origin: string; anyone: Anyone }> = new Map();
    private listOfTools: IToolData[] | undefined;

    constructor(port: number) {
        this.updateTools();
        Logger.info(`Iniciando servidor WebSocket na porta ${port}...`);
        this.webSocketServer = new WebSocketServer({port}, () => {
            Logger.success(
                `Servidor WebSocket iniciado com sucesso na porta ${port}!`
            );
        });

        this.attachListeners();

        this.rabbitUtil.consume(
            RabbitUtil.WHATSAPP_IN,
            async (message) => {
                try {
                    const whatsappMessage: IWhatsappMessage = JSON.parse(
                        message.content.toString()
                    );
                    await this.processWhatsappMessage(whatsappMessage);
                } catch (error) {
                    Logger.error(
                        `Erro ao processar mensagem do RabbitMQ: ${error}`
                    );
                }
            }
        );

        this.rabbitUtil.consume(
            RabbitUtil.WHATSAPP_READY,
            async () => {
                try {
                    Logger.info(`WHATSAPP_READY recebido`);
                    await this.broadcastInformation("Whatsapp está pronto");
                } catch (error) {
                    Logger.error(
                        `Erro ao processar WHATSAPP_READY: ${error}`
                    );
                }
            }
        );

        const getBrain = () => {
            return BrainFactory.giveMeThis(process.env.BOTLANDIA_IARA_BRAIN)
        }

        this.iaraAgent = new BuilderAnyone()
            .withRole(Incarnations.iara.role)
            .withBrain(getBrain())
            .withName(Incarnations.iara.name)
            .withThisIncarnation(Incarnations.iara.description)
            .build();
    }

    private async updateTools(): Promise<void> {
        try {
            this.listOfTools = await this.toolsMemory.getAllItems();
        } catch (error) {
            Logger.error(`Erro ao obter ferramentas: ${error}`);
        }

        if (!this.listOfTools || this.listOfTools?.length === 0) {
            this.listOfTools = this.toolStore.forAnyone().map((tool) => ({
                uuid: tool.uuid,
                name: tool.name,
                description: tool.description,
                enable: false,
            }));

            for (const tool of this.listOfTools) {
                try {
                    await this.toolsMemory.addItem(
                        tool.uuid,
                        tool.name,
                        tool.description
                    );
                } catch (error) {
                    Logger.error(`Erro ao salvar ferramenta: ${error}`);
                }
            }
        }
    }

    private async broadcastInformation(message: string): Promise<void> {
        this.webSocketServer.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                this.sendNewMessage(
                    "WHATSAPP_READY",
                    "me",
                    this.iaraAgent.getName().toLowerCase(),
                    "iara.png",
                    message,
                    this.iaraAgent.getName(),
                    client,
                    false
                );
            }
        });
    }

    private attachListeners(): void {
        this.webSocketServer.on(
            EVENTS_WS.CONNECTION,
            this.onConnection.bind(this)
        );
        this.webSocketServer.on(EVENTS_WS.ERROR, (error) => {
            Logger.error(`Erro no servidor WebSocket: ${error}`);
        });
        this.webSocketServer.on(EVENTS_WS.CLOSE, () => {
            Logger.warn(`Servidor WebSocket encerrado.`);
        });
    }

    private onConnection(ws: WebSocket): void {
        const clientId = uuidv4();
        Logger.info(`Cliente conectado (ID: ${clientId}).`);

        ws.on(
            EVENTS_WS.MESSAGE,
            this.onMessage.bind(this, ws, clientId)
        );
        ws.on(EVENTS_WS.CLOSE, () => {
            Logger.info(`Cliente desconectado (ID: ${clientId}).`);
        });
        ws.on(EVENTS_WS.ERROR, (error: any) => {
            Logger.error(
                `Erro na conexão do cliente (ID: ${clientId}): ${error}`
            );
        });
    }

    private async onMessage(
        client: WebSocket,
        clientId: string,
        message: string
    ): Promise<void> {
        try {
            const data = JSON.parse(message);

            switch (data.type) {
                case WS_STATUS.GIVE_ME_TOOLS:
                    this.sendToolsToClient(client);
                    break;
                case WS_STATUS.NEW_MESSAGE:
                    await this.processNewMessage(data.message, client);
                    break;
                case WS_STATUS.TOOL_CHANGE:
                    await this.handleToolChange(data, client);
                    break;
                case WS_STATUS.NEW_MESSAGE_HUMAN:
                    await this.processHumanMessage(data);
                    break;
                default:
                    Logger.warn(
                        `Tipo de mensagem desconhecido: ${data.type}`
                    );
            }
        } catch (error) {
            Logger.error(
                `Erro ao processar a mensagem do cliente (ID: ${clientId}): ${error}`
            );
        }
    }

    private sendToolsToClient(client: WebSocket): void {
        if (this.listOfTools && this.listOfTools.length > 0) {
            const broadcastData = {
                type: WS_STATUS.GIVE_ME_TOOLS_RESPONSE,
                tools: this.listOfTools,
            };
            client.send(JSON.stringify(broadcastData));
        }
    }

    private async processNewMessage(
        message: string,
        client: WebSocket
    ): Promise<void> {
        const response = await this.processMessage(message);
        await this.sendNewMessage(
            uuidv4(),
            "me",
            this.iaraAgent.getName().toLowerCase(),
            "iara.png",
            response,
            this.iaraAgent.getName(),
            client,
            false
        );
    }

    private async handleToolChange(
        data: { idTool: string; value: boolean },
        client: WebSocket
    ): Promise<void> {
        const toolIndex = this.listOfTools?.findIndex(
            (t) => t.uuid === data.idTool
        );
        if (toolIndex !== undefined && toolIndex !== -1) {
            this.listOfTools![toolIndex].enable = data.value;
            await this.toolsMemory.updateItem(
                this.listOfTools![toolIndex].uuid,
                this.listOfTools![toolIndex]
            );
        }
        this.sendToolsToClient(client);
    }

    private async processHumanMessage(data: {
        to: string;
        message: string;
    }): Promise<void> {
        const agentData = this.listOfAgents.get(data.to);
        if (agentData) {
            agentData.anyone.addChatAssistant(data.message);

            const messageData = {
                origin: agentData.origin,
                response: data.message,
            };

            try {
                await this.rabbitUtil.publish(
                    RabbitUtil.WHATSAPP_OUT,
                    JSON.stringify(messageData)
                );
            } catch (error) {
                Logger.error(
                    `Erro ao enviar mensagem para o RabbitMQ: ${error}`
                );
            }
        }
    }

    private sendNewMessage(
        id: string,
        to: string,
        from: string,
        avatarUrl: string,
        message: string,
        username: string,
        client: WebSocket,
        toChat: boolean
    ): void {
        const timelineEvent = {
            type: WS_STATUS.NEW_MESSAGE,
            id: id,
            to: to,
            from: from,
            avatarUrl: avatarUrl,
            message: `${message}`,
            username: username,
            toChat: toChat,
            timestamp: new Date().toLocaleTimeString(),
        };
        client.send(JSON.stringify(timelineEvent));
    }

    private async processWhatsappMessage(
        message: IWhatsappMessage
    ): Promise<void> {

        if (!this.listOfAgents.has(message.from)) {
            const newAnyone = await this.createAnyoneForWhatsapp(message)
            this.listOfAgents.set(message.from, {
                anyone: newAnyone,
                origin: message.id
            })
        }
        let agentData = this.listOfAgents.get(message.from);

        if (!agentData) {
            Logger.warn(
                `Agente não encontrado para o contato: ${message.from}`
            );
            return ;
        }
        await this.processIncomingMessageFromClient({
            to: agentData.anyone.getName(),
            from: message.from,
            avatarUrl: message.avatarUrl,
            id: message.id,
            body: message.body,
            username: message.username,
        });

        const agentResponse = await agentData.anyone.solveThat(
            message.body
        );
        const responseBody =
            agentResponse?.bill?.answer?.content || "Sem resposta";

        const responseMessage = {
            origin: message.id,
            response: responseBody,
        };

        try {
            await this.rabbitUtil.publish(
                RabbitUtil.WHATSAPP_OUT,
                JSON.stringify(responseMessage)
            );
        } catch (error) {
            Logger.error(
                `Erro ao enviar mensagem para o RabbitMQ: ${error}`
            );
        }

        this.broadcastMessageFromAgent(
            message,
            agentData.anyone.getName(),
            agentData.anyone.getAvatar() || "avatar1.webp",
            responseBody
        );
    }

    private callBackLog(log: any): void {
        const {agent, tool, said, squad} = log;
        if (!said) {
            return;
        }
        const timelineEvent = {
            type: WS_STATUS.NEW_MESSAGE,
            id: uuidv4(),
            content: said.toString(),
            squad: squad,
            agent: agent,
            tool: tool,
            timestamp: new Date().toLocaleTimeString(),
        };
        this.webSocketServer.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(timelineEvent));
            }
        });
    }

    private async processMessage(message: string): Promise<string> {
        if (this.listOfTools) {
            const idTools = this.listOfTools
                .filter((t) => t.enable)
                .map((t) => t.uuid);
            const toolsToNow = this.toolStore
                .forAnyone()
                .filter((f) => idTools.includes(f.uuid));
            this.iaraAgent.useTools(toolsToNow);
        }
        const response = await this.iaraAgent.solveThat(
            message,
            this.callBackLog.bind(this)
        );
        return response.bill.answer.content || "";
    }

    private async processIncomingMessageFromClient(
        message: IWhatsappMessage
    ): Promise<void> {
        this.webSocketServer.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                this.sendNewMessage(
                    message.id,
                    message.to,
                    message.from,
                    message.avatarUrl,
                    message.body,
                    message.username,
                    client,
                    true
                );
            }
        });
    }

    private broadcastMessageFromAgent(
        message: IWhatsappMessage,
        agentName: string,
        agentAvatar: string,
        responseBody: string
    ): void {
        this.webSocketServer.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                this.sendNewMessage(
                    message.id,
                    message.from,
                    agentName,
                    agentAvatar,
                    responseBody,
                    message.username,
                    client,
                    false
                );
            }
        });
    }

    private async createAnyoneForWhatsapp(
        message: IWhatsappMessage
    ): Promise<Anyone> {
        let profile;
        try {
            profile = await getActiveProfile();
        } catch (error) {
            Logger.error(`Erro ao obter perfil ativo: ${error}`);
        }

        if (!profile) {
            await this.broadcastInformation(
                'Não existe perfil criado para responder no whatsapp, o perfil "Iara" está sendo usado, crie um perfil'
            );
        }

        const indexName = Math.floor(Math.random() * NAMES.length);
        const indexAvatar = Math.floor(Math.random() * AVATARS.length);

        return new BuilderAnyone()
            .withRole(profile?.role || Incarnations.iara.role)
            .withBrain(BrainType.OPEN_AI)
            .withName(profile?.name || NAMES[indexName])
            .withAvatarUrl(AVATARS[indexAvatar])
            .withAllTool(this.toolStore.forIara())
            .withThisIncarnation(
                `
                ${
                    profile?.description || Incarnations.iara.description
                }
                SEU NOME É : ${profile?.name || NAMES[indexName]}
                ESTÁ FALANDO COM : ${message?.username}
                `
            )
            .build();
    }
}