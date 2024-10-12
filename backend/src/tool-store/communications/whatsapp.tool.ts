import axios from "axios";
import dotenv from "dotenv";
import {Tool} from "botlandia/core/tools";
import {Logger} from "botlandia/lib/logger";

// Carregando variáveis de ambiente
dotenv.config();

// Criando uma instância personalizada do Axios
const whatsappApi = axios.create({
    baseURL: process.env.BOTLANDIA_BACKEND_WHATSAPP_API, // Obtendo a URL da API do WhatsApp do ambiente
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
        // Adicione outros cabeçalhos se necessário
    },
});

interface SendMessageArgs {
    to: string; // Número do destinatário
    message: string; // Mensagem a ser enviada
}

interface sendMessageWithAttachmentArgs {
    to: string; // Número do destinatário
    message: string; // Mensagem a ser enviada
    attachmentPath: string; // URL do anexo
}

export class WhatsAppTool extends Tool {
    static UUID = "d2e3f7b8-b1e0-4a5d-a55e-facfd03444dc";

    constructor() {
        super(
            WhatsAppTool.UUID,
            "WhatsAppTool",
            `
            Ferramenta para enviar mensagens e anexos no WhatsApp. 
            Comandos :
                sendMessage - envio de mensagem simples, argumentos (to,message) 
                sendMessageAttachment - envio de mensagem simples, argumentos (to,message,attachmentPath)
                getGroups - recupera grupos ( sem argumentos ) - necessário para recuperar idGrupo
                sendMessageToGroup - envio de mensagem simples, argumentos (idGrupo, message) 
                getQRCode - 
                        * ATENÇÃO *
                            - ENVIE O QRCODE COMO RECEBER (<qrcode>...</qrcode>)
                            - NAVEGADOR É CAPAZ DE RENDERIZAR
                
            `
        );

        // Adicionando campos ao tool
        this.addField({
            name: "action",
            type: "string",
            description: "A ação a ser realizada. ex: sendMessage,sendMessageAttachment,getContacts,getGroups,getQRCode",
        });
        this.addField({
            name: "to",
            type: "string",
            description: "O número do telefone do destinatário.",
        });
        this.addField({
            name: "message",
            type: "string",
            description: "A mensagem a ser enviada.",
        });
        this.addField({
            name: "attachmentPath",
            type: "string",
            description: "URL do anexo a ser enviado.",
        });
        this.addField({
            name: "groupId",
            type: "string",
            description: "ID do grupo para envio de mensagens.",
        });
        this.addField({
            name: "caption",
            type: "string",
            description: "Legenda para a mídia enviada.",
        });
    }

    async run(argsAny: any): Promise<string> {
        const args = JSON.parse(argsAny)
        const {action} = args;
        Logger.info(`CONEXAO WHATSAPP : ${process.env.BOTLANDIA_BACKEND_WHATSAPP_API}`)
        switch (action) {
            case 'sendMessage':
                return await this.sendMessage(args);
            case 'sendMessageAttachment':
                return await this.sendMessageWithAttachment(args);
            case 'getGroups':
                return await this.getGroups();
            case 'getContacts':
                return await this.getContacts();
            case 'sendMediaToGroup':
                return await this.sendMessageWithAttachment(args);
            case 'getQRCode':
                return await this.getQRCode();
            default:
                Logger.error(`[WhatsAppTool] Ação desconhecida: ${action}`);
                throw new Error(`Ação desconhecida: ${action}`);
        }
    }

    async sendMessage(args: SendMessageArgs): Promise<string> {
        try {
            const {message, to} = args
            if (!message || !to) {
                throw new Error('arguments not found [to,message]')
            }
            const response = await whatsappApi.post("/send-message", args);
            Logger.toolSaid(this.name, `Mensagem enviada: ${JSON.stringify(response.data)}`);
            return `Mensagem enviada com sucesso`;
        } catch (error: any) {
            Logger.error(`[WhatsAppTool] Erro ao enviar mensagem: ${error.message}`);
            throw new Error(`Erro ao enviar mensagem: ${error.message}`);
        }
    }

    async sendMessageWithAttachment(args: sendMessageWithAttachmentArgs): Promise<string> {
        try {
            const {message, to, attachmentPath} = args
            if (!message || !to || !attachmentPath) {
                throw new Error('arguments not found [to,message]')
            }
            const response = await whatsappApi.post("/send-message-with-attachment", args);
            Logger.toolSaid(this.name, `Mensagem com anexo enviada: ${JSON.stringify(response.data)}`);
            return `Mensagem com anexo enviada com sucesso`;
        } catch (error: any) {
            Logger.error(`[WhatsAppTool] Erro ao enviar mensagem com anexo: ${error.message}`);
            throw new Error(`Erro ao enviar mensagem com anexo: ${error.message}`);
        }
    }

    async getGroups(): Promise<string> {
        try {
            const response = await whatsappApi.get("/groups");
            Logger.toolSaid(this.name, `Grupos recuperados: ${JSON.stringify(response.data)}`);
            return `Grupos: ${JSON.stringify(response.data)}`;
        } catch (error: any) {
            Logger.error(`[WhatsAppTool] Erro ao recuperar grupos: ${error.message}`);
            throw new Error(`Erro ao recuperar grupos: ${error.message}`);
        }
    }

    async getContacts(): Promise<string> {
        try {
            const response = await whatsappApi.get("/contacts");
            Logger.toolSaid(this.name, `Contatos recuperados: ${JSON.stringify(response.data)}`);
            return `Contatos: ${JSON.stringify(response.data)}`;
        } catch (error: any) {
            Logger.error(`[WhatsAppTool] Erro ao recuperar contatos: ${error.message}`);
            throw new Error(`Erro ao recuperar contatos: ${error.message}`);
        }
    }

    async getQRCode(): Promise<any> {
        try {
            const response = await whatsappApi.get("/qrcode");
            return `<qrcode>${response.data}<qrcode>`;
        } catch (error: any) {
            Logger.error(`[WhatsAppTool] Erro ao gerar QR Code: ${error.message}`);
            throw new Error(`Erro ao gerar QR Code: ${error.message}`);
        }
    }
}
