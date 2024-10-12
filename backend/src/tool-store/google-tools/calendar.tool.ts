import {google} from "googleapis";
import fs from "fs";
import path from "path";
import readline from 'readline';
import dotenv from 'dotenv';
import {Tool} from "botlandia/core/tools";
import {Logger} from "botlandia/utils/logger";

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

interface CalendarEvent {
    summary: string;
    description?: string;
    start: {
        dateTime: string;
        timeZone?: string;
    };
    end: {
        dateTime: string;
        timeZone?: string;
    };
}

export class GoogleCalendarTool extends Tool {
    private oAuth2Client: any;
    static UUID = "b09cf429-4cbb-43c5-8e6b-efeaadbe2d71";

    constructor() {
        super(
            GoogleCalendarTool.UUID,
            "GoogleCalendarTool",
            `
                Esta ferramenta interage com o seu Google Calendar. 
                Você pode criar, ler, atualizar e deletar eventos.
                Além disso, permite atualizar o token de autenticação OAuth2.
            `,
        );
        this.addField({
            name: "action",
            type: "string",
            description: "Ação a ser realizada (create, read, update, delete, updateToken)"
        });
        this.addField({
            name: "event",
            type: "string",
            description: "Detalhes do evento (necessário para ações create e update)"
        });
        this.addField({
            name: "eventId",
            type: "string",
            description: "ID do evento (necessário para ações update e delete)"
        });
    }

    /**
     * Executa a ferramenta com os argumentos fornecidos.
     * @param arg String JSON contendo 'action', 'event' e/ou 'eventId'.
     * @returns Uma promessa que resolve com o resultado da operação ou rejeita com um erro.
     */
    async run(arg: string): Promise<any> {
        Logger.toolSaid(this.name, ` Ferramenta chamada com estes argumentos: ${arg}`);
        const {action, event, eventId} = JSON.parse(arg);

        if (!action) {
            Logger.error("[GoogleCalendarTool] Argumento obrigatório ausente: 'action'.");
            throw new Error("Faltando argumento obrigatório: 'action'.");
        }

        switch (action) {
            case "updateToken":
                return await this.updateToken();
            default:
                // Para ações que requerem autorização, realiza a autorização antes
                await this.authorize();
                const calendar = google.calendar({version: "v3", auth: this.oAuth2Client});

                switch (action) {
                    case "create":
                        if (!event) {
                            Logger.error("[GoogleCalendarTool] Argumento obrigatório ausente: 'event'.");
                            throw new Error("Faltando argumento obrigatório: 'event'.");
                        }
                        return await this.createEvent(calendar, event);
                    case "read":
                        return await this.readEvents(calendar);
                    case "update":
                        if (!event || !eventId) {
                            Logger.error("[GoogleCalendarTool] Argumentos obrigatórios ausentes: 'event' e 'eventId'.");
                            throw new Error("Faltando argumentos obrigatórios: 'event' e 'eventId'.");
                        }
                        return await this.updateEvent(calendar, eventId, event);
                    case "delete":
                        if (!eventId) {
                            Logger.error("[GoogleCalendarTool] Argumento obrigatório ausente: 'eventId'.");
                            throw new Error("Faltando argumento obrigatório: 'eventId'.");
                        }
                        return await this.deleteEvent(calendar, eventId);
                    default:
                        Logger.error(`[GoogleCalendarTool] Ação inválida: ${action}`);
                        throw new Error(`Ação inválida: ${action}`);
                }
        }
    }

    /**
     * Autoriza o cliente OAuth2 para acessar a API do Google Calendar.
     * @returns Uma promessa que resolve quando a autorização é concluída.
     */
    private async authorize(): Promise<void> {
        const credentialsPath = process.env.BOTLANDIA_BACKEND_GOOGLE_APPLICATION_CREDENTIALS || path.resolve(__dirname, "../../../credentials.json");
        const tokenPath = process.env.BOTLANDIA_BACKEND_GOOGLE_CALENDAR_TOKEN_PATH || path.resolve(__dirname, "../../../token_cal.json");

        const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));
        const {client_secret, client_id, redirect_uris} = credentials.installed;
        this.oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

        try {
            const token = JSON.parse(fs.readFileSync(tokenPath, "utf-8"));
            this.oAuth2Client.setCredentials(token);
        } catch (error) {
            await this.getNewToken();
        }
    }

    /**
     * Obtém um novo token de acesso interagindo com o usuário.
     * @returns Uma promessa que resolve quando o token é obtido e salvo.
     */
    private async getNewToken(): Promise<void> {
        const authUrl = this.oAuth2Client.generateAuthUrl({
            access_type: "offline",
            scope: ["https://www.googleapis.com/auth/calendar"],
        });
        Logger.toolSaid(this.name, `Autorize este aplicativo visitando esta URL: ${authUrl}`);
        const code = await this.promptForCode();
        const {tokens} = await this.oAuth2Client.getToken(code);
        this.oAuth2Client.setCredentials(tokens);

        const tokenPath = process.env.BOTLANDIA_BACKEND_GOOGLE_CALENDAR_TOKEN_PATH || path.resolve(__dirname, "../../../token_cal.json");
        fs.writeFileSync(tokenPath, JSON.stringify(tokens));
        Logger.toolSaid(this.name, `Novo token salvo em: ${tokenPath}`);
    }

    /**
     * Solicita ao usuário que insira o código de autorização.
     * @returns Uma promessa que resolve com o código inserido pelo usuário.
     */
    private async promptForCode(): Promise<string> {
        const rl = readline.createInterface({input: process.stdin, output: process.stdout});
        return new Promise((resolve) => {
            rl.question('Digite o código da página aqui: ', (code) => {
                rl.close();
                resolve(code);
            });
        });
    }

    /**
     * Atualiza o token de autenticação OAuth2 manualmente.
     * @returns Uma promessa que resolve com uma mensagem de sucesso ou rejeita com um erro.
     */
    private async updateToken(): Promise<string> {
        try {
            await this.getNewToken();
            Logger.toolSaid(this.name, `Token atualizado com sucesso.`);
            return "Token atualizado com sucesso.";
        } catch (error: any) {
            Logger.error(`[GoogleCalendarTool] Erro ao atualizar o token: ${error.message}`);
            throw new Error(`Erro ao atualizar o token: ${error.message}`);
        }
    }

    /**
     * Cria um evento no Google Calendar.
     * @param calendar Instância da API do Google Calendar.
     * @param event Detalhes do evento a ser criado.
     * @returns Uma promessa que resolve com uma mensagem de sucesso ou rejeita com um erro.
     */
    private async createEvent(calendar: any, event: CalendarEvent): Promise<string> {
        try {
            const res = await calendar.events.insert({
                calendarId: "primary",
                requestBody: event,
            });
            Logger.toolSaid(this.name, ` Evento criado: ${res.data.id}`);
            return `Evento ['${event.summary}'] criado: ${event.start.dateTime} - ${event.end.dateTime}`;
        } catch (error: any) {
            Logger.error(`[GoogleCalendarTool] Erro ao criar evento: ${error.message}`);
            throw error;
        }
    }

    /**
     * Lê eventos futuros do Google Calendar.
     * @param calendar Instância da API do Google Calendar.
     * @returns Uma promessa que resolve com uma lista de eventos ou rejeita com um erro.
     */
    private async readEvents(calendar: any): Promise<any[]> {
        try {
            const res = await calendar.events.list({
                calendarId: "primary",
                timeMin: (new Date()).toISOString(), // Eventos a partir de agora
                maxResults: 10, // Máximo de 10 eventos
                singleEvents: true,
                orderBy: "startTime",
            });
            const events = res.data.items;
            if (events?.length) {
                Logger.toolSaid(this.name, `Próximos eventos:`);
                events.map((event: any) => {
                    const start = event.start.dateTime || event.start.date;
                    const end = event.end.dateTime || event.end.date;
                    Logger.toolSaid(this.name, ` ${event.summary} (${start} - ${end})`);
                });
            } else {
                Logger.toolSaid(this.name, `Nenhum evento futuro encontrado.`);
            }

            return events;

        } catch (error: any) {
            Logger.error(`[GoogleCalendarTool] Erro ao ler eventos: ${error.message}`);
            throw error;
        }
    }


    /**
     * Atualiza um evento existente no Google Calendar.
     * @param calendar Instância da API do Google Calendar.
     * @param eventId ID do evento a ser atualizado.
     * @param event Novos detalhes do evento.
     * @returns Uma promessa que resolve com uma mensagem de sucesso ou rejeita com um erro.
     */
    private async updateEvent(calendar: any, eventId: string, event: CalendarEvent): Promise<string> {
        try {
            const res = await calendar.events.update({
                calendarId: "primary",
                eventId: eventId,
                requestBody: event,
            });
            Logger.toolSaid(this.name, ` Evento atualizado: ${res.data.id}`);
            return `Evento ['${event.summary}'] atualizado`;
        } catch (error: any) {
            Logger.error(`[GoogleCalendarTool] Erro ao atualizar evento: ${error.message}`);
            throw error;
        }
    }

    /**
     * Deleta um evento do Google Calendar.
     * @param calendar Instância da API do Google Calendar.
     * @param eventId ID do evento a ser deletado.
     * @returns Uma promessa que resolve com uma mensagem de sucesso ou rejeita com um erro.
     */
    private async deleteEvent(calendar: any, eventId: string): Promise<string> {
        try {
            await calendar.events.delete({
                calendarId: "primary",
                eventId: eventId,
            });
            Logger.toolSaid(this.name, ` Evento deletado: ${eventId}`);
            return `Evento deletado`;
        } catch (error: any) {
            Logger.error(`[GoogleCalendarTool] Erro ao deletar evento: ${error.message}`);
            throw error;
        }
    }
}
