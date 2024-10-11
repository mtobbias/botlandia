import dotenv from "dotenv";
import WhatsappApplication from "@whatsapp/whatsapp.application";
dotenv.config();

const appInstance = new WhatsappApplication();
appInstance.start();
