import {Client, LocalAuth, MessageMedia} from "whatsapp-web.js";
import fs from "fs";
import mime from "mime-types";
import axios from "axios";
import os from "os";
import {Logger} from "botlandia/lib/logger";
import {IClientWhatsApp} from "botlandia/api/whatsapp/whatsapp.interface";

export class ClientWhatsapp {
    private client: Client | undefined;

    constructor(
        private readonly iClientWhatsApp: IClientWhatsApp,
        private readonly clientId: string
    ) {
        Logger.whatslog(`[${this.clientId}] Initializing WhatsApp client...`);
        this.init();
    }

    private async init() {
        Logger.whatslog('Sistema Operacional:', os.type());

        try {
            Logger.whatslog(`[${this.clientId}] Initializing client...`);
            this.client = new Client({
                puppeteer: {
                    headless: true,
                    args: ["--no-sandbox"]
                },
                authStrategy: new LocalAuth({
                    dataPath: `./wwebjs_auth/${this.clientId}`,
                    clientId: this.clientId
                })
            });
            this.registerEvents();
            await this.client.initialize();
        } catch (error) {
            Logger.error(`[${this.clientId}] Initialization error:`, error);
        }
    }

    private registerEvents() {
        if (this.client) {
            this.client.on("qr", (qr) => {
                Logger.whatslog(`[${this.clientId}] New QR Code generated.`);
                this.iClientWhatsApp.onQrcode(qr);
            });

            this.client.on("ready", () => {
                Logger.whatslog(`[${this.clientId}] WhatsApp client is ready!`);
                this.iClientWhatsApp.onReady();
            });

            this.client.on("message", async (msg) => {
                Logger.whatslog(`[${this.clientId}] New message received:`, msg.body);
                this.iClientWhatsApp.onMessage(msg);
            });

            this.client.on("remote_session_saved", () => {
                Logger.whatslog(`[${this.clientId}] Remote session saved.`);
            });

            this.client.on("group_join", (opts) => {
                Logger.whatslog(`[${this.clientId}] Joined group:`, opts);
                this.iClientWhatsApp.onJoinGroup(opts);
            });

            this.client.on("group_leave", (opts) => {
                Logger.whatslog(`[${this.clientId}] Left group:`, opts);
                this.iClientWhatsApp.onLeaveGroup(opts);
            });

            this.client.on("group_update", (opts) => {
                Logger.whatslog(`[${this.clientId}] Group updated:`, opts);
            });
        }
    }

    private preNumber = (number: string): string => {
        if (number.length === 13) {
            return `${number.substring(0, 4)}${number.substring(5, number.length)}@c.us`;
        }
        return `${number}@c.us`;
    }

    public async sendMessage(toNumber: string, msg: string): Promise<void> {
        if (!this.client) {
            throw new Error("client not found");
        }
        try {
            const newNumber = toNumber.toString().replace(/\D/g, '');
            if (newNumber.length < 12 || newNumber.length > 13) {
                throw new Error('Número completo inválido, DDI+PHONE');
            }

            Logger.whatslog(`[${this.clientId}] Sending message to ${newNumber}: ${msg}`);
            await this.client.sendMessage(this.preNumber(newNumber), msg);
        } catch (error) {
            Logger.error(`[${this.clientId}] Error sending message:`, error);
            throw new Error('Número completo inválido, DDI+PHONE');
        }
    }

    public async sendMessageWithAttachment(
        toNumber: string,
        message: string,
        attachment: string
    ): Promise<void> {
        if (!this.client) {
            throw new Error("client not found");
        }

        try {
            let newNumber = toNumber.toString().replace(/\D/g, '');
            if (newNumber.length < 12 && !newNumber.startsWith("55")) {
                newNumber = `55${newNumber}`;
            }
            if (newNumber.length < 12 || newNumber.length > 13) {
                throw new Error('Número completo inválido, DDI+PHONE');
            }

            let dataMime: { data: string; mimeType: string };
            if (attachment.includes('http')) {
                dataMime = await this.downloadFileAsBase64(attachment);
            } else {
                dataMime = await this.fileToBase64WithMime(attachment);
            }

            Logger.whatslog(`[${this.clientId}] Sending message with attachment to ${newNumber}: ${message}`);
            const media = new MessageMedia(dataMime.mimeType, dataMime.data, attachment);

            if (dataMime.mimeType.toString().includes("octet-stream")) {
                await this.client.sendMessage(this.preNumber(newNumber), `${attachment}\n${message}`);
                return;
            }

            await this.client.sendMessage(this.preNumber(newNumber), media, {caption: message});

        } catch (error) {
            Logger.error(`[${this.clientId}] Error sending message with attachment:`, error);
            throw new Error('Erro ao enviar mensagem com anexo.');
        }
    }

    private fileToBase64WithMime(filePath: string): Promise<{ data: string; mimeType: string }> {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    return reject(err);
                }
                const base64Data = data.toString('base64');
                const mimeType = mime.lookup(filePath) || 'application/octet-stream';
                resolve({data: base64Data, mimeType});
            });
        });
    }

    private async downloadFileAsBase64(url: string): Promise<{ data: string; mimeType: string }> {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'arraybuffer',
        });

        const base64Data = Buffer.from(response.data, 'binary').toString('base64');
        const mimeType = mime.lookup(url) || 'application/octet-stream';

        return {data: base64Data, mimeType};
    }

    public async getGroups(): Promise<{ id: string; name: string }[]> {
        if (!this.client) {
            throw new Error("client not found");
        }
        try {
            Logger.whatslog(`[${this.clientId}] Fetching groups...`);
            const chats = await this.client.getChats();
            return chats.filter(chat => chat.isGroup).map(chat => ({
                id: chat.id._serialized,
                name: chat.name
            }));
        } catch (error) {
            Logger.error(`[${this.clientId}] Error fetching groups:`, error);
            return [];
        }
    }

    public async getContacts(): Promise<any[]> {
        if (!this.client) {
            throw new Error("client not found");
        }
        try {
            Logger.whatslog(`[${this.clientId}] Fetching contacts...`);
            const wContacts = await this.client.getContacts();
            return wContacts.filter((c) => c.id.server === 'c.us').map((c) => ({
                name: c.name,
                typeContact: c.type,
                isMyContact: c.isMyContact,
                isBlocked: c.isBlocked,
                isBusiness: c.isBusiness,
                number: c.number,
                shortName: c.shortName,
                verifiedLevel: c.verifiedLevel,
                verifiedName: c.verifiedName
            }));
        } catch (error) {
            Logger.error(`[${this.clientId}] Error fetching contacts:`, error);
            return [];
        }
    }

    public async sendMessageGroup(
        groupId: string,
        msg: string,
        listOfMentions?: string[]
    ): Promise<void> {
        if (!this.client) {
            throw new Error("client not found");
        }
        try {
            Logger.whatslog(`[${this.clientId}] Sending message to group ${groupId}: ${msg}`);
            const groupID = `${groupId}@g.us`;
            const contacts = await this.client.getContacts();
            const mentions = contacts.filter(contact => listOfMentions?.includes(contact.id.user)) as any;
            const mentionsMessage = mentions.map((contact: any) => `@${contact.id.user || ""}`).join(" ");

            await this.client.sendMessage(groupID, `${msg} ${mentionsMessage}`, {mentions});
        } catch (error) {
            Logger.error(`[${this.clientId}] Error sending message to group:`, error);
            throw new Error('Erro ao enviar mensagem para o grupo.');
        }
    }
}
