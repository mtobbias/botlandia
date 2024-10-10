import express from "express";
import bodyParser from "body-parser";
import {IClientWhatsApp} from "@whatsapp/whatsapp.interface";
import {WhatsAppController} from "@whatsapp/whatsapp.controller";
import {RabbitUtil} from "@whatsapp/rabbit.util";

const app = express();
const port = process.env.PORT || 3002;
const rabbitUtil = new RabbitUtil()
app.use(bodyParser.json());
let qrCode: any;

const iClientWhatsApp: IClientWhatsApp = {
    onQrcode: async (qr) => {
        qrCode = qr;
    },
    onReady: async() => {
        try {
            await rabbitUtil.publish('WHATSAPP_READY', 'WHATSAPP_READY')
        } catch (err: any) {
        }
    },
    onMessage: async (msg) => {
        const {to, from, body, type, author, deviceType, id} = msg;
        const contact = await msg.getContact();
        const avatarUrl = await contact.getProfilePicUrl()
        const response = {
            to: to,
            from: contact.number,
            body: body,
            type: type,
            author: author,
            deviceType: deviceType,
            id: id,
            username: contact.pushname,
            avatarUrl: avatarUrl
        }
        try {
            await rabbitUtil.publish('WHATSAPP_IN', JSON.stringify(response))
        } catch (err: any) {
        }

    },
    onJoinGroup: (opts) => {
        // Handle group join
    },
    onLeaveGroup: (opts) => {
        // Handle group leave
    }
};

const whatsappController = new WhatsAppController(iClientWhatsApp, "botland");

// @ts-ignore
app.post("/send-message", (req, res) => whatsappController.sendMessage(req, res));
// @ts-ignore
app.post("/send-message-with-attachment", (req, res) => whatsappController.sendMessageWithAttachment(req, res));
// @ts-ignore
app.get("/groups", (req, res) => whatsappController.getGroups(req, res));
// @ts-ignore
app.get("/contacts", (req, res) => whatsappController.getContacts(req, res));
// @ts-ignore
app.post("/send-message-group", (req, res) => whatsappController.sendMessageGroup(req, res));
app.get("/qrcode", (req, res) => {
    if (qrCode) {
        res.send(qrCode);
    } else {
         res.send('');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    try {
        rabbitUtil.consume('WHATSAPP_OUT', async (msg) => {
            try {
                const msgObj = JSON.parse(msg.content.toString())
                await whatsappController.sendMessageObj(msgObj)
            } catch (errr: any) {
                console.log(errr)
            }
        })
    } catch (err: any) {
    }
});
