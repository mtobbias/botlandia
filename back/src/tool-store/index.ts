import {DateTimeTool} from "botlandia/tool-store/utils-tools/date-time.tool";
import {MemoryTool} from "botlandia/tool-store/iara-tools/memory.tool";
import {SerperSearchTool} from "botlandia/tool-store/serper-tool/serper-search.tool";
import {YouTubeTool} from "botlandia/tool-store/google-tools/youtube.tool";
import {GmailTool} from "botlandia/tool-store/google-tools/gmail.tool";
import {GoogleCalendarTool} from "botlandia/tool-store/google-tools/calendar.tool";
import {ElevenLabsSpeakTool} from "botlandia/tool-store/elevenlabs-tools/eleven-labs-speak.tool";
import {RabbitMQTool} from "botlandia/tool-store/communications/rabbit-mq.tool";
import {WhatsAppTool} from "botlandia/tool-store/communications/whatsapp.tool";
import {ImageCreationTool} from "botlandia/tool-store/openai-tools/image-generation.tool";
import {ImageDescriptionTool} from "botlandia/tool-store/openai-tools/image-description.tool";
import {PuppeteerTool} from "botlandia/tool-store/puppeteer-tools/puppeteer.tool ";
import {RobotJSTool} from "botlandia/tool-store/robotojs-tools/robotojs.tool";
import {MongoAdminTool} from "botlandia/tool-store/database/mongo-admin.tool";
import {SqliteTool} from "botlandia/tool-store/database/sqllite.tool";
import {DownloadTool} from "botlandia/tool-store/basic/download.tool";
import {ExecuteCommandTool} from "botlandia/tool-store/basic/execute-command.tool";
import {ReadFileTool} from "botlandia/tool-store/basic/read-file.tool";
import {SearchDirectoryTool} from "botlandia/tool-store/basic/search-directory.tool";
import {WriteFileTool} from "botlandia/tool-store/basic/write-file.tool";
import {IncarnationsTool} from "botlandia/tool-store/iara-tools/incarnation.tool";

export class ToolStore {
    readonly memory = new MemoryTool();
    readonly gmailTool = new GmailTool()
    readonly robotJSTool = new RobotJSTool()
    readonly sqliteTool = new SqliteTool()
    readonly youTubeTool = new YouTubeTool()
    readonly dateTimeTool = new DateTimeTool()
    readonly whatsAppTool = new WhatsAppTool()
    readonly rabbitMQTool = new RabbitMQTool(process.env.RABBITMQ_URL || '')
    readonly downloadTool = new DownloadTool()
    readonly readFileTool = new ReadFileTool()
    readonly puppeteerTool = new PuppeteerTool()
    readonly writeFileTool = new WriteFileTool()
    readonly mongoAdminTool = new MongoAdminTool(process.env.MONGO_URI || '')
    readonly incarnationsTool = new IncarnationsTool()
    readonly serperSearchTool = new SerperSearchTool()
    readonly imageCreationTool = new ImageCreationTool()
    readonly googleCalendarTool = new GoogleCalendarTool()
    readonly executeCommandTool = new ExecuteCommandTool()
    readonly elevenLabsSpeakTool = new ElevenLabsSpeakTool()
    readonly searchDirectoryTool = new SearchDirectoryTool()
    readonly imageDescriptionTool = new ImageDescriptionTool()

    forAnyone = () => {
        return [
            this.imageDescriptionTool,
            this.googleCalendarTool,
            this.searchDirectoryTool,
            this.executeCommandTool,
            this.imageCreationTool,
            this.serperSearchTool,
            this.mongoAdminTool,
            this.puppeteerTool,
            this.writeFileTool,
            this.downloadTool,
            this.rabbitMQTool,
            this.readFileTool,
            this.whatsAppTool,
            this.dateTimeTool,
            this.youTubeTool,
            this.robotJSTool,
            this.sqliteTool,
            this.gmailTool,
            this.memory,
        ]
    }
    forIara = () => {
        return [
            this.imageDescriptionTool,
            this.googleCalendarTool,
            this.searchDirectoryTool,
            this.executeCommandTool,
            this.imageCreationTool,
            this.serperSearchTool,
            this.mongoAdminTool,
            this.puppeteerTool,
            this.writeFileTool,
            this.downloadTool,
            this.rabbitMQTool,
            this.readFileTool,
            this.whatsAppTool,
            this.dateTimeTool,
            this.youTubeTool,
            this.robotJSTool,
            this.sqliteTool,
            this.gmailTool,
            this.memory,
            this.elevenLabsSpeakTool,
            this.incarnationsTool
        ]
    }
}