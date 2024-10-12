import express, {Application} from "express";
import bodyParser from "body-parser";
import {WhatsAppService} from "botlandia/api/whatsapp/whatsapp.service";
import {WhatsAppController} from "botlandia/api/whatsapp/whatsapp.controller";
import {Logger} from "botlandia/api/whatsapp/logger";

class WhatsappApplication {
    public app: Application;
    private readonly port: number;
    private readonly whatsappService: WhatsAppService;
    private readonly whatsappController: WhatsAppController;

    constructor() {
        this.app = express();
        this.port = parseInt(process.env.PORT || "3002", 10);
        this.configMiddleware();
        this.whatsappService = new WhatsAppService();
        this.whatsappController = new WhatsAppController(this.whatsappService);
        this.setupRoutes();
    }

    private configMiddleware(): void {
        this.app.use(bodyParser.json());
    }


    private setupRoutes(): void {
        // @ts-ignore
        this.app.post("/send-message", (req: Request, res: Response) => this.whatsappController.sendMessage(req, res));
        // @ts-ignore
        this.app.post("/send-message-with-attachment", (req: Request, res: Response) => this.whatsappController.sendMessageWithAttachment(req, res));
        // @ts-ignore
        this.app.get("/groups", (req: Request, res: Response) => this.whatsappController.getGroups(req, res));
        // @ts-ignore
        this.app.get("/contacts", (req: Request, res: Response) => this.whatsappController.getContacts(req, res));
        // @ts-ignore
        this.app.post("/send-message-group", (req: Request, res: Response) => this.whatsappController.sendMessageGroup(req, res));
        // @ts-ignore
        this.app.get("/qrcode", (req: Request, res: Response) => this.whatsappService.getQrCode(req, res));
    }

    public start(): void {
        this.app.listen(this.port, () => {
            Logger.whatslog(`Server running on http://localhost:${this.port}`)
            this.whatsappService.initializeRabbitMQ(this.whatsappController);
        });
    }

}

export default WhatsappApplication;
