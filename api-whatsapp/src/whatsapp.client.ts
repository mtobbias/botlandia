import {Client, LocalAuth, MessageMedia} from "whatsapp-web.js";
import {IClientWhatsApp} from "@whatsapp/whatsapp.interface";
import fs from "fs";
//@ts-ignore
import * as mime from 'mime-types';
import axios from 'axios';

export class ClientWhatsapp {
    // @ts-ignore
    private client: Client;

    constructor(
        private readonly iClientWhatsApp: IClientWhatsApp,
        private readonly clientId: string
    ) {
        console.info(`[${this.clientId}] Initializing WhatsApp client...`);

        this.init();
    }

    private async init() {

        try {
            console.info(`[${this.clientId}] Initializing client...`);
            this.client = new Client({
                puppeteer: {
                    executablePath: '/usr/bin/google-chrome',
                    headless: true,
                    args: ["--no-sandbox"]
                },
                webVersionCache: {
                    type: "remote",
                    remotePath: "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2407.3.html"
                },
                authStrategy: new LocalAuth({
                    dataPath: `./wwebjs_auth/${this.clientId}`,
                    clientId: this.clientId
                })
            });
            this.registerEvents();
            await this.client.initialize();
        } catch (error) {
            console.error(`[${this.clientId}] Initialization error:`, error);
        }

    }

    private registerEvents() {
        this.client.on("qr", (qr) => {
            console.info(`[${this.clientId}] New QR Code generated.`);
            this.iClientWhatsApp.onQrcode(qr);
        });

        this.client.on("ready", () => {
            console.info(`[${this.clientId}] WhatsApp client is ready!`);
            this.iClientWhatsApp.onReady();
        });

        this.client.on("message", async (msg) => {
            console.info(`[${this.clientId}] New message received:`, msg.body);
            this.iClientWhatsApp.onMessage(msg);
        });

        this.client.on("remote_session_saved", () => {
            console.info(`[${this.clientId}] Remote session saved.`);
        });

        this.client.on("group_join", (opts) => {
            console.info(`[${this.clientId}] Joined group:`, opts);
            this.iClientWhatsApp.onJoinGroup(opts);
        });

        this.client.on("group_leave", (opts) => {
            console.info(`[${this.clientId}] Left group:`, opts);
            this.iClientWhatsApp.onLeaveGroup(opts);
        });

        this.client.on("group_update", (opts) => {
            console.info(`[${this.clientId}] Group updated:`, opts);
        });
    }

    preNumber = (number: string) => {
        if (number.length === 13) {
            return `${number.substring(0, 4)}${number.substring(5, number.length)}@c.us`
        }
        return `${number}@c.us`
    }

    public async sendMessage(toNumber: any, msg: string): Promise<void> {
        try {
            const newNumber = toNumber.toString().replace(/\D/g, '');
            if (newNumber.length < 12 || newNumber.length > 13) {
                throw new Error('invalid full number, DDI+PHONE')
            }


            console.info(`[${this.clientId}] Sending message to ${newNumber}: ${msg}`);
            await this.client.sendMessage(this.preNumber(newNumber), msg);
        } catch (error) {
            console.error(`[${this.clientId}] Error sending message:`, error);
            throw new Error('invalid full number, DDI+PHONE')
        }
    }

    fileToBase64WithMime(filePath: string): Promise<{ data: string; mimeType: string }> {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    return reject(err);
                }
                const base64Data = data.toString('base64');
                const mimeType = mime.lookup(filePath) || 'application/octet-stream'; // Default MIME type if unknown
                resolve({data: base64Data, mimeType});
            });
        });
    }

    async downloadFileAsBase64(url: string): Promise<{ data: string; mimeType: string }> {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'arraybuffer', // Use arraybuffer to handle binary data
        });

        // Convert the response data to Base64
        const base64Data = Buffer.from(response.data, 'binary').toString('base64');

        // Determine the MIME type from the URL or use a default
        const mimeType = mime.lookup(url) || 'image/png';

        return {data: base64Data, mimeType};
    }

    public async sendMessageWithAttachment(
        toNumber: string,
        message: string,
        attachment: string
    ): Promise<void> {
        try {
            let newNumber = toNumber.toString().replace(/\D/g, '');
            if (newNumber.length < 12 && !newNumber.startsWith("55")) {
                newNumber = `55${newNumber}`
            }
            if (newNumber.length < 12 || newNumber.length > 13) {
                throw new Error('invalid full number, DDI+PHONE')
            }
            let dataMime: any;
            if (attachment.includes('http')) {
                dataMime = await this.downloadFileAsBase64(attachment)
            } else {
                dataMime = await this.fileToBase64WithMime(attachment)
            }

            console.info(`[${this.clientId}] Sending message with attachment to ${newNumber}: ${message}`);
            const media = new MessageMedia(dataMime.mimeType, dataMime.data, attachment);

            if (dataMime.mimeType.toString().includes("octet-stream")) {
                // await this.convertToPNG(attachment,'C:/botlandia/environment/tmp/aaaa.png')

                await this.client.sendMessage(this.preNumber(newNumber), `${attachment}
                ${message}`);
                return
            }

            await this.client.sendMessage(this.preNumber(newNumber), media, {caption: message});

        } catch (error) {
            console.error(`[${this.clientId}] Error sending message with attachment:`, error);
        }
    }

    public async getGroups(): Promise<{ id: string; name: string }[]> {
        try {
            console.info(`[${this.clientId}] Fetching groups...`);
            const chats = await this.client.getChats();
            return chats.filter(chat => chat.isGroup).map(chat => ({
                id: chat.id._serialized,
                name: chat.name
            }));
        } catch (error) {
            console.error(`[${this.clientId}] Error fetching groups:`, error);
            return [];
        }
    }

    public async getContacts(): Promise<any[]> {
        try {
            console.info(`[${this.clientId}] Fetching contacts...`);
            const wContacts = await this.client.getContacts();
            const listOfContact = wContacts.filter((c) => c.name?.toLowerCase().includes('satler'))
            return wContacts.filter((c) => c.id.server === 'c.us').map((c) => {
                return {
                    name: c.name,
                    typeContact: c.type,
                    isMyContact: c.isMyContact,
                    isBlocked: c.isBlocked,
                    isBusiness: c.isBusiness,
                    number: c.number,
                    shortName: c.shortName,
                    verifiedLevel: c.verifiedLevel,
                    verifiedName: c.verifiedName
                }
            })


        } catch (error) {
            console.error(`[${this.clientId}] Error fetching contacts:`, error);
            return [];
        }
    }

    public async sendMessageGroup(
        groupId: string,
        msg: string,
        listOfMentions?: string[]
    ): Promise<void> {
        try {
            console.info(`[${this.clientId}] Sending message to group ${groupId}: ${msg}`);
            const groupID = `${groupId}@g.us`;
            const contacts = await this.client.getContacts();
            const mentions = contacts.filter(contact => listOfMentions?.includes(contact.id.user)) as any;
            const mentionsMessage = mentions.map((contact: any) => `@${contact.id.user || ""}`).join(" ");

            await this.client.sendMessage(groupID, `${msg} ${mentionsMessage}`, {mentions});
        } catch (error) {
            console.error(`[${this.clientId}] Error sending message to group:`, error);
        }
    }
}
