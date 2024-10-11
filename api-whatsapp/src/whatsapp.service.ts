// src/services/WhatsAppService.ts
import {Request, Response} from "express";
import {IClientWhatsApp} from "@whatsapp/whatsapp.interface";
import {RabbitUtil} from "@whatsapp/rabbit.util";
import {ClientWhatsapp} from "@whatsapp/whatsapp.client";
import {WhatsAppController} from "@whatsapp/whatsapp.controller";

export class WhatsAppService implements IClientWhatsApp {
    private rabbitUtil: RabbitUtil;
    private qrCode: string | null;
    private clientWhatsapp: ClientWhatsapp;

    constructor() {
        this.rabbitUtil = new RabbitUtil();
        this.qrCode = null;

        // Instanciar o ClientWhatsapp com os handlers definidos na interface
        this.clientWhatsapp = new ClientWhatsapp(this, "botland");
    }

    // Implementação dos métodos da interface IClientWhatsApp

    public async onQrcode(qr: string): Promise<void> {
        this.qrCode = qr;
        console.log("QR Code atualizado.");
    }

    public async onReady(): Promise<void> {
        try {
            await this.rabbitUtil.publish('WHATSAPP_READY', 'WHATSAPP_READY');
            console.log("WhatsApp está pronto e mensagem publicada no RabbitMQ.");
        } catch (err: any) {
            console.error("Erro ao publicar WHATSAPP_READY:", err);
        }
    }

    public async onMessage(msg: any): Promise<void> {
        const {to, from, body, type, author, deviceType, id} = msg;
        try {
            const contact = await msg.getContact();
            const avatarUrl = await contact.getProfilePicUrl();
            const response = {
                to,
                from: contact.number,
                body,
                type,
                author,
                deviceType,
                id,
                username: contact.pushname,
                avatarUrl,
            };
            await this.rabbitUtil.publish('WHATSAPP_IN', JSON.stringify(response));
            console.log("Mensagem recebida e publicada no WHATSAPP_IN:", response);
        } catch (err: any) {
            console.error("Erro ao tratar mensagem recebida:", err);
        }
    }

    public onJoinGroup(opts: any): void {
        console.log("Entrou em um grupo:", opts);
        // Implementar lógica adicional se necessário
    }

    public onLeaveGroup(opts: any): void {
        console.log("Saiu de um grupo:", opts);
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
                    console.log("Mensagem consumida do WHATSAPP_OUT e enviada:", msgObj);
                } catch (err: any) {
                    console.error("Erro ao consumir mensagem WHATSAPP_OUT:", err);
                }
            });
            console.log("Consumo do RabbitMQ inicializado para WHATSAPP_OUT.");
        } catch (err: any) {
            console.error("Erro ao inicializar consumo do RabbitMQ:", err);
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
