import {Request, Response} from "express";
import {ClientWhatsapp} from "@whatsapp/whatsapp.client";
import {IClientWhatsApp} from "@whatsapp/whatsapp.interface";

export class WhatsAppController {
    private clientWhatsapp: ClientWhatsapp;

    constructor(iClientWhatsApp: IClientWhatsApp, clientId: string) {
        this.clientWhatsapp = new ClientWhatsapp(iClientWhatsApp, clientId);
    }

    public async sendMessage(req: Request, res: Response) {
        const {to, message} = req.body;
        try {
            await this.clientWhatsapp.sendMessage(to, message);
            return res.status(200).json({success: true, message: "Message sent!"});
        } catch (error: any) {
            console.error("Error sending message:", error);
            return res.status(500).json({success: false, error: error?.message || 'error to send'});
        }
    }

    public async sendMessageWithAttachment(req: Request, res: Response) {
        const {to, message, attachmentPath} = req.body;
        try {
            await this.clientWhatsapp.sendMessageWithAttachment(to, message, attachmentPath);
            return res.status(200).json({success: true, message: "Message with attachment sent!"});
        } catch (error) {
            console.error("Error sending message with attachment:", error);
            return res.status(500).json({success: false, error: "Error sending message with attachment."});
        }
    }

    public async getGroups(req: Request, res: Response) {
        try {
            const groups = await this.clientWhatsapp.getGroups();
            return res.status(200).json({success: true, groups});
        } catch (error) {
            console.error("Error fetching groups:", error);
            return res.status(500).json({success: false, error: "Error fetching groups."});
        }
    }

    public async getContacts(req: Request, res: Response) {
        try {
            const contacts = await this.clientWhatsapp.getContacts();
            return res.status(200).json({success: true, contacts});
        } catch (error) {
            console.error("Error fetching contacts:", error);
            return res.status(500).json({success: false, error: "Error fetching contacts."});
        }
    }

    public async sendMessageGroup(req: Request, res: Response) {
        const {groupId, message, mentions} = req.body;
        try {
            await this.clientWhatsapp.sendMessageGroup(groupId, message, mentions);
            return res.status(200).json({success: true, message: "Message sent to group!"});
        } catch (error) {
            console.error("Error sending message to group:", error);
            return res.status(500).json({success: false, error: "Error sending message to group."});
        }
    }

    async sendMessageObj(msgObj: any) {
        const {origin,response} =  msgObj
        const {remote} =origin
        await this.clientWhatsapp.sendMessage(remote,response)
        console.log(msgObj)
    }
}
