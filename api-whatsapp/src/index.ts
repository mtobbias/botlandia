import dotenv from "dotenv";
import WhatsappApplication from "botlandia/api/whatsapp/whatsapp.application";
dotenv.config();
const whatsappApplication = new WhatsappApplication();
whatsappApplication.start();
