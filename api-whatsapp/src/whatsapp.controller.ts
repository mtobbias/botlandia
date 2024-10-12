import {Request, Response} from "express";
import {WhatsAppService} from "botlandia/api/whatsapp/whatsapp.service";
import {Logger} from "botlandia/lib/logger";

export class WhatsAppController {
    constructor(private whatsappService: WhatsAppService) {
    }

    public async sendMessage(req: Request, res: Response): Promise<any> {
        const {to, message} = req.body;
        try {
            await this.whatsappService.sendMessage(to, message);
            return res.status(200).json({success: true, message: "Mensagem enviada com sucesso!"});
        } catch (error: any) {
            Logger.error("Erro ao enviar mensagem:", error);
            return res.status(500).json({success: false, error: error?.message || 'Erro ao enviar mensagem.'});
        }
    }

    public async sendMessageWithAttachment(req: Request, res: Response): Promise<Response> {
        const {to, message, attachmentPath} = req.body;
        try {
            await this.whatsappService.sendMessageWithAttachment(to, message, attachmentPath);
            return res.status(200).json({success: true, message: "Mensagem com anexo enviada com sucesso!"});
        } catch (error: any) {
            Logger.error("Erro ao enviar mensagem com anexo:", error);
            return res.status(500).json({
                success: false,
                error: error?.message || "Erro ao enviar mensagem com anexo."
            });
        }
    }

    public async getGroups(req: Request, res: Response): Promise<Response> {
        try {
            const groups = await this.whatsappService.getGroups();
            return res.status(200).json({success: true, groups});
        } catch (error: any) {
            Logger.error("Erro ao buscar grupos:", error);
            return res.status(500).json({success: false, error: error?.message || "Erro ao buscar grupos."});
        }
    }

    public async getContacts(req: Request, res: Response): Promise<Response> {
        try {
            const contacts = await this.whatsappService.getContacts();
            return res.status(200).json({success: true, contacts});
        } catch (error: any) {
            Logger.error("Erro ao buscar contatos:", error);
            return res.status(500).json({success: false, error: error?.message || "Erro ao buscar contatos."});
        }
    }

    public async sendMessageObj(msgObj: any) {
        const {origin, response} = msgObj
        const {remote} = origin
        await this.whatsappService.sendMessage(remote, response)
    }

    public async sendMessageGroup(req: Request, res: Response): Promise<Response> {
        const {groupId, message, mentions} = req.body;
        try {
            await this.whatsappService.sendMessageGroup(groupId, message, mentions);
            return res.status(200).json({success: true, message: "Mensagem enviada para o grupo com sucesso!"});
        } catch (error: any) {
            Logger.error("Erro ao enviar mensagem para o grupo:", error);
            return res.status(500).json({
                success: false,
                error: error?.message || "Erro ao enviar mensagem para o grupo."
            });
        }
    }
}
