import {Request, Response} from "express";
import {IClientWhatsApp} from "botlandia/api/whatsapp/whatsapp.interface";
import {RabbitUtil} from "botlandia/api/whatsapp/rabbit.util";
import {ClientWhatsapp} from "botlandia/api/whatsapp/whatsapp.client";
import {Logger} from "botlandia/api/whatsapp/logger";
import {WhatsAppController} from "botlandia/api/whatsapp/whatsapp.controller";

export class WhatsAppService implements IClientWhatsApp {
    private rabbitUtil: RabbitUtil;
    private qrCode: string | null;
    private clientWhatsapp: ClientWhatsapp;

    constructor() {
        this.rabbitUtil = new RabbitUtil();
        this.qrCode = null;
        this.clientWhatsapp = new ClientWhatsapp(this, "botlandia");
    }

    public async onQrcode(qr: string): Promise<void> {
        this.qrCode = qr;
        Logger.whatslog("QR Code atualizado.");
    }

    public async onReady(): Promise<void> {
        try {
            await this.rabbitUtil.publish('WHATSAPP_READY', 'WHATSAPP_READY');
            Logger.whatslog("WhatsApp está pronto e mensagem publicada no RabbitMQ.");
        } catch (err: any) {
            Logger.error("Erro ao publicar WHATSAPP_READY:", err);
        }
    }

    public async onMessage(msg: any): Promise<void> {
        const {to, from, body, type, author, deviceType, id} = msg;
        const chat = await msg.getChat();
        try {
            const contact = await msg.getContact();
            const avatarUrl = await contact.getProfilePicUrl();
            const response = {
                to,
                from: contact.number,
                isGroup: chat.isGroup,
                groupName: chat.name,
                mention: msg.mentionedIds.filter((m:string)=>m===to).length>0,
                body,
                type,
                author,
                deviceType,
                id,
                username: contact.pushname,
                avatarUrl,
            };
            await this.rabbitUtil.publish(chat.isGroup ? (response.mention? 'WHATSAPP_GROUP_ME' : 'WHATSAPP_GROUP') : 'WHATSAPP_IN', JSON.stringify(response));
            Logger.whatslog("Mensagem recebida e publicada no WHATSAPP_IN:", response);
        } catch (err: any) {
            Logger.error("Erro ao tratar mensagem recebida:", err);
        }
    }

    public onJoinGroup(opts: any): void {
        Logger.whatslog("Entrou em um grupo:", opts);
        // Implementar lógica adicional se necessário
    }

    public onLeaveGroup(opts: any): void {
        Logger.whatslog("Saiu de um grupo:", opts);
        // Implementar lógica adicional se necessário
    }

    public getQrCode(req: Request, res: Response): void {
        if (this.qrCode) {
            res.send(this.qrCode);
        } else {
            res.send('');
        }
    }

    public async initializeRabbitMQ(controller: WhatsAppController): Promise<void> {
        try {
            await this.rabbitUtil.consume('WHATSAPP_OUT', async (msg) => {
                try {
                    const msgObj = JSON.parse(msg.content.toString());
                    await controller.sendMessageObj(msgObj);
                    Logger.whatslog("Mensagem consumida do WHATSAPP_OUT e enviada:", msgObj);
                } catch (err: any) {
                    Logger.error("Erro ao consumir mensagem WHATSAPP_OUT:", err);
                }
            });
            Logger.whatslog("Consumo do RabbitMQ inicializado para WHATSAPP_OUT.");
        } catch (err: any) {
            Logger.error("Erro ao inicializar consumo do RabbitMQ:", err);
        }
    }

    // Métodos para o WhatsAppController utilizarem o ClientWhatsapp

    public async sendMessage(to: string, message: string): Promise<void> {
        await this.clientWhatsapp.sendMessage(to, message);
    }

    public async sendMessageWithAttachment(to: string, message: string, attachmentPath: string): Promise<void> {
        await this.clientWhatsapp.sendMessageWithAttachment(to, message, attachmentPath);
    }

    public async getGroups(): Promise<{ id: string; name: string }[]> {
        return await this.clientWhatsapp.getGroups();
    }

    public async getContacts(): Promise<any[]> {
        return await this.clientWhatsapp.getContacts();
    }

    public async sendMessageGroup(groupId: string, message: string, mentions?: string[]): Promise<void> {
        await this.clientWhatsapp.sendMessageGroup(groupId, message, mentions);
    }
}
