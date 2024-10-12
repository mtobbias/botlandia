import * as dotenv from "dotenv";
import WebSocket, {WebSocketServer} from 'ws';
import {Anyone} from "botlandia/core/anyone";
import {Logger} from "botlandia/utils/logger";
import {BuilderAnyone} from "botlandia/core/builders/builder.anyone";
import {BrainType} from "botlandia/core/enums";
import {v4 as uuidv4} from 'uuid';
import {ToolStore} from "botlandia/tool-store";
import {Incarnations} from "botlandia/core/soul/incarnations";
import {RabbitUtil} from "botlandia/utils/rabbit.util";
import {AVATARS, NAMES} from "botlandia/utils/names";
import {getActiveProfile} from "botlandia/utils/agentUtils";
import {WS_STATUS} from "botlandia/index";
import {ToolsMemory} from "botlandia/utils/tools.memory";
import {BrainFactory} from "botlandia/core/factory";

dotenv.config();

export enum EVENTS_WS {
    CLOSE = 'close',
    ERROR = 'error',
    CONNECTION = 'connection',
    MESSAGE = 'message',
}

export class IaraWebSocket {
    private readonly webSocketServer: WebSocketServer;
    private readonly iaraAgent: Anyone;
    private readonly toolStore = new ToolStore()
    private readonly rabbitUtil = new RabbitUtil()
    private readonly toolsMemory = new ToolsMemory()
    private listOfAgents: Map<string, {
        origin: any,
        anyone: Anyone
    }> = new Map();
    private listOfTools: any[] | undefined;

    constructor(port: number) {
        this.updateTools();
        Logger.info(`Iniciando servidor WebSocket na porta ${port}...`);
        this.webSocketServer = new WebSocketServer({port}, () => {
            Logger.success(`Servidor WebSocket iniciado com sucesso na porta ${port}!`);
        });

        this.attachListeners();
        this.rabbitUtil.consume(RabbitUtil.WHATSAPP_IN, async (msg) => {
            try {
                await this.notifyWhatsapp(msg.content.toString())
            } catch (err: any) {
                console.error(err)
            }
        })


        this.rabbitUtil.consume(RabbitUtil.WHATSAPP_READY, async (msg) => {
            try {
                Logger.info(`WHATSAPP_READY  ${msg}`);
                await this.sendInformation('Whatsapp está pronto')

            } catch (err: any) {
            }
        })
        this.iaraAgent = new BuilderAnyone()
            .withRole(Incarnations.iara.role)
            .withBrain(BrainType.OPEN_AI)
            .withName(Incarnations.iara.name)
            .withThisIncarnation(Incarnations.iara.description)
            .build();

    }

    private async updateTools() {
        let dataTools
        try {
            dataTools = await this.toolsMemory.getAllItems();
        } catch (err) {
        }

        this.listOfTools = dataTools ? dataTools : this.toolStore.forAnyone().map((t) => {
            const item = {
                uuid: t?.uuid,
                name: t?.name,
                description: t?.description,
                enable: false,
            }
            return item;
        })
        if (!dataTools) {
            for (const item of this.listOfTools) {
                await this.toolsMemory.addItem(item.uuid, item.name, item.description);
            }
        }
    }

    private async sendInformation(message: string) {
        this.webSocketServer.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                this.sendNewMessage('WHATSAPP_READY', 'me', this.iaraAgent.getName().toLowerCase(), 'iara.png', message, this.iaraAgent.getName(), client, false)
            }
        });
    }

    private async attachListeners() {
        this.webSocketServer.on(EVENTS_WS.CONNECTION, this.onConnection.bind(this));
        this.webSocketServer.on(EVENTS_WS.ERROR, (error) => {
            Logger.error(`Erro no servidor WebSocket: ${error}`);
        });
        this.webSocketServer.on(EVENTS_WS.CLOSE, () => {
            Logger.warn(`Servidor WebSocket encerrado.`);
        });
    }

    private async onConnection(ws: any) {
        const clientId = uuidv4();
        ws.on(EVENTS_WS.MESSAGE, this.onMessage.bind(this, ws, clientId));
        ws.on(EVENTS_WS.CLOSE, () => {
            Logger.info(`Cliente desconectado (ID: ${clientId}).`);
        });
        ws.on(EVENTS_WS.ERROR, (error: any) => {
            Logger.error(`Erro na conexão do cliente (ID: ${clientId}): ${error}`);
        });
    }

    private async onMessage(client: WebSocket, clientId: string, message: string) {
        try {
            const data: any = JSON.parse(message);

            if (data.type === WS_STATUS.GIVE_ME_TOOLS && this.listOfTools && this.listOfTools.length > 0) {
                const broadcastData = {
                    type: WS_STATUS.GIVE_ME_TOOLS_RESPONSE,
                    tools: this.listOfTools
                };
                client.send(JSON.stringify(broadcastData));
            }
            if (data.type === WS_STATUS.NEW_MESSAGE) {
                const resp = await this.processMessage(data.message);
                await this.sendNewMessage(clientId, 'me', this.iaraAgent.getName().toLowerCase(), 'iara.png', resp, this.iaraAgent.getName(), client, false)
            }
            if (data.type === WS_STATUS.TOOL_CHANGE && this.listOfTools) {
                const tool = this.listOfTools.filter((t: any) => t.uuid === data.idTool)[0]
                const newList = this.listOfTools.filter((t: any) => t.uuid !== data.idTool)
                if (tool) {
                    tool.enable = data.value
                    this.listOfTools = [...newList, tool]
                    await this.toolsMemory.updateItem(tool.uuid, tool)
                }
                const broadcastData = {
                    type: WS_STATUS.GIVE_ME_TOOLS_RESPONSE,
                    tools: this.listOfTools
                };
                client.send(JSON.stringify(broadcastData));
            }
            if (data.type === WS_STATUS.NEW_MESSAGE_HUMAN) {
                const agent = this.listOfAgents.get(data.to)
                if (agent) {
                    agent.anyone.addChatAssistant(data.message)
                    const message = JSON.stringify({
                        origin: agent.origin,
                        response: data.message
                    })
                    await this.rabbitUtil.publish(RabbitUtil.WHATSAPP_OUT, message)

                }
            }
        } catch (error) {
            Logger.error(`Erro ao processar a mensagem do cliente (ID: ${clientId}): ${error}`);
        }
    }

    private async sendNewMessage(id: any, to: any, from: any, avatarUrl: any, message: any, username: any, client: WebSocket, toChat: boolean) {
        const timelineEvent = {
            type: WS_STATUS.NEW_MESSAGE,
            id: id,
            to: to,
            from: from,
            avatarUrl: avatarUrl,
            message: message,
            username: username,
            toChat: toChat,
            timestamp: new Date().toLocaleTimeString(),

        };
        client.send(JSON.stringify(timelineEvent));
    }

    private async notifyWhatsapp(message: any) {
        const args = JSON.parse(message)
        await this.processMessageClient(args)

    };

    private callBackLog(log: any) {
        const {agent, tool, said, squad} = log;
        if (!said) {
            return
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
    };

    private async processMessage(message: any): Promise<string> {
        if (this.listOfTools) {
            const idTools = this.listOfTools.filter((t: any) => t.enable).map((t: any) => t.uuid);
            const toolsToNow = this.toolStore.forAnyone().filter((f) => idTools.includes(f.uuid));
            this.iaraAgent.useTools(toolsToNow)
        }
        const response = await this.iaraAgent.solveThat(message, this.callBackLog.bind(this));
        return response.bill.answer.content || '';
    };

    private async processMessageClient(args: any) {
        const indexName = Math.floor(Math.random() * NAMES.length);
        const indexAvatar = Math.floor(Math.random() * AVATARS.length);
        if (!this.listOfAgents.has(args.from)) {
            let profile;
            try {
                profile = await getActiveProfile()
            } catch (err) {
            }

            if (!profile) {
                await this.sendInformation('Não existe perfil criado para responder no whatsapp, o perfil "Iara" está sendo usado, crie um perfil')
            }
            const newAnyone = new BuilderAnyone()
                .withRole(profile?.role || Incarnations.iara.role)
                .withBrain(BrainType.OPEN_AI)
                .withName(profile?.name || NAMES[indexName])
                .withAvatarUrl(AVATARS[indexAvatar])
                .withAllTool(this.toolStore.forIara())
                .withThisIncarnation(`
                ${profile?.description || Incarnations.iara.description}
                SEU NOME É : ${profile?.name || NAMES[indexName]}
                ESTÁ FALANDO COM : ${args?.username}
                `)
                .build();
            this.listOfAgents.set(args.from, {
                anyone: newAnyone,
                origin: args.id
            })
        }

        const agent = this.listOfAgents.get(args.from)
        const agentResponse = await agent?.anyone.solveThat(args.body)
        const responseBody = agentResponse?.bill?.answer?.content || 'sem resposta';
        const message = JSON.stringify({
            origin: args.id,
            response: responseBody
        })
        await this.rabbitUtil.publish(RabbitUtil.WHATSAPP_OUT, message)

        this.webSocketServer.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                this.sendNewMessage(args.id, agent?.anyone.getName(), args.from, args.avatarUrl, args.body, args.username, client, true)
            }
        });

        this.webSocketServer.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                this.sendNewMessage(args.id, args.from, agent?.anyone.getName(), agent?.anyone.getAvatar() || 'avatar1.webp', responseBody, args.username, client, false)
            }
        });

    }
}
