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
    private listOfAgents: Map<string, {
        origin: any,
        anyone: Anyone
    }> = new Map();

    constructor(port: number) {
        Logger.info(`Iniciando servidor WebSocket na porta ${port}...`);
        this.iaraAgent = new BuilderAnyone()
            .withRole(Incarnations.iara.role)
            .withBrain(BrainType.OPEN_AI)
            .withName(Incarnations.iara.name)
            .withAllTool(this.toolStore.forIara())
            .withThisIncarnation(Incarnations.iara.description)
            .build();

        this.webSocketServer = new WebSocketServer({port}, () => {
            Logger.success(`Servidor WebSocket iniciado com sucesso na porta ${port}!`);
        });

        this.attachListeners();
        this.rabbitUtil.consume('WHATSAPP_IN', async (msg) => {
            try {
                console.log('WHATSAPP_IN', msg.content.toString())
                await this.notifyWhatsapp(msg.content.toString())
            } catch (err: any) {
                console.error(err)
            }
        })
        this.rabbitUtil.consume('WHATSAPP_READY', async (msg) => {
            try {
                Logger.info(`WHATSAPP_READY  ${msg}`);
                await this.sendInformation('Whatsapp está pronto')

            } catch (err: any) {
            }
        })


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
        // await this.updateAgent()
    }

    private async onConnection(ws: any) {

        const clientId = uuidv4();
        Logger.info(`Novo cliente conectado (ID: ${clientId}).`);
        ws.on(EVENTS_WS.MESSAGE, this.onMessage.bind(this, ws, clientId));
        ws.on(EVENTS_WS.CLOSE, () => {
            Logger.info(`Cliente desconectado (ID: ${clientId}).`);
        });
        ws.on(EVENTS_WS.ERROR, (error: any) => {
            Logger.error(`Erro na conexão do cliente (ID: ${clientId}): ${error}`);
        });
    }

    private async onMessage(client: WebSocket, clientId: string, message: string) {
        Logger.debug(`Mensagem recebida do cliente (ID: ${clientId}): ${message}`);
        try {
            const data: any = JSON.parse(message);
            if (data.type === 'GIVE_ME_TOOLS') {
                const mapTools = this.toolStore.forIara().map((t) => {
                    return {
                        uuid: t.uuid,
                        name: t.name,
                        description: t.description
                    }
                })
                const broadcastData = {
                    type: 'GIVE_ME_TOOLS_RESPONSE',
                    tools: mapTools
                };
                Logger.debug(`Enviando resposta para o cliente (ID: ${clientId}): ${JSON.stringify(broadcastData)}`);
                client.send(JSON.stringify(broadcastData));
            }
            if (data.type === 'NEW_MESSAGE') {
                Logger.info(`Processando mensagem do cliente (ID: ${clientId})...`);
                const resp = await this.processMessage(data.message);
                await this.sendNewMessage(clientId, 'me', this.iaraAgent.getName().toLowerCase(), 'iara.png', resp, this.iaraAgent.getName(), client, false)
            }
            if (data.type === 'NEW_MESSAGE_HUMAN') {
                Logger.info(`Processando mensagem do cliente (ID: ${clientId})...`);
                const agent = this.listOfAgents.get(data.to)
                if (agent) {
                    agent.anyone.addChatAssistant(data.message)
                    const message = JSON.stringify({
                        origin: agent.origin,
                        response: data.message
                    })
                    await this.rabbitUtil.publish('WHATSAPP_OUT', message)

                }
                // const resp = await this.processMessage(data.message);
                //await this.sendNewMessage(clientId, 'me', this.iaraAgent.getName().toLowerCase(), 'iara.png', resp, this.iaraAgent.getName(), client, false)
            }
        } catch (error) {
            Logger.error(`Erro ao processar a mensagem do cliente (ID: ${clientId}): ${error}`);
        }
    }

    private async sendNewMessage(id: any, to: any, from: any, avatarUrl: any, message: any, username: any, client: WebSocket, toChat: boolean) {
        const timelineEvent = {
            type: 'NEW_MESSAGE',
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
            type: 'TIMELINE_EVENT',
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
        Logger.debug(`Enviando mensagem para o agente Iara: ${message}`);
        const response = await this.iaraAgent.solveThat(message, this.callBackLog.bind(this));
        Logger.debug(`Resposta do agente Iara: ${JSON.stringify(response)}`);
        return response.bill.answer.content || '';
    };

    private async processMessageClient(args: any) {
        const indexName = Math.floor(Math.random() * NAMES.length);
        const indexAvatar = Math.floor(Math.random() * AVATARS.length);
        if (!this.listOfAgents.has(args.from)) {
            let profile;
            try{
                 profile = await getActiveProfile()
            }catch (err){}

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
        await this.rabbitUtil.publish('WHATSAPP_OUT', message)

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
