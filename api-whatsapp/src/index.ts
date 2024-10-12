import dotenv from "dotenv";
import WhatsappApplication from "botlandia/api/whatsapp/whatsapp.application";
import {Logger} from "botlandia/api/whatsapp/logger";
dotenv.config();
const whatsappApplication = new WhatsappApplication();
whatsappApplication.start();
