import {google} from "googleapis";
import fs from "fs";
import path from "path";
import readline from 'readline';
import dotenv from 'dotenv';
import {Tool} from "botlandia/core/tools";
import {Logger} from "botlandia/utils/logger";

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

interface EmailOptions {
    to: string;
    subject: string;
    body: string;
}

export class GmailTool extends Tool {
    private oAuth2Client: any;
    static UUID = "e8dafb83-d5fd-4cb6-880a-cf6a6350c380";

    constructor() {
        super(
            GmailTool.UUID,
            "GmailSendTool",
            `
                Esta ferramenta envia um e-mail usando sua conta do Gmail.
                Ela requer um arquivo 'credentials.json' obtido no Google Cloud Console.
                Além disso, permite atualizar o token de autenticação OAuth2 manualmente.
            `,
        );
        this.addField({
            name: "action",
            type: "string",
            description: "Ação a ser realizada ('send' para enviar e-mail, 'updateToken' para atualizar o token)"
        });
        this.addField({
            name: "to",
            type: "string",
            description: "Endereço de e-mail do destinatário"
        });
        this.addField({
            name: "subject",
            type: "string",
            description: "Assunto do e-mail"
        });
        this.addField({
            name: "body",
            type: "string",
            description: "Corpo do e-mail"
        });
        // Adicione mais campos para outras opções, se necessário
    }

    /**
     * Executa a ferramenta com os argumentos fornecidos.
     * @param arg String JSON contendo 'action', 'to', 'subject' e/ou 'body'.
     * @returns Uma promessa que resolve com o resultado da operação ou rejeita com um erro.
     */
    async run(arg: string): Promise<any> {
        Logger.toolSaid(this.name, ` Ferramenta chamada com estes argumentos: ${arg}`);
        const {action, to, subject, body} = JSON.parse(arg);

        if (!action) {
            Logger.error("[GmailSendTool] Argumento obrigatório ausente: 'action'.");
            throw new Error("Faltando argumento obrigatório: 'action'.");
        }

        switch (action) {
            case "updateToken":
                return await this.updateToken();
            case "send":
                if (!to || !subject || !body) {
                    Logger.error("[GmailSendTool] Argumentos obrigatórios ausentes: 'to', 'subject' e 'body'.");
                    throw new Error("Faltando argumentos obrigatórios: 'to', 'subject' e 'body'.");
                }
                await this.authorize();
                return await this.sendEmail({to, subject, body});
            default:
                Logger.error(`[GmailSendTool] Ação inválida: ${action}`);
                throw new Error(`Ação inválida: ${action}`);
        }
    }

    /**
     * Autoriza o cliente OAuth2 para acessar a API do Gmail.
     * @returns Uma promessa que resolve quando a autorização é concluída.
     */
    private async authorize(): Promise<void> {
        // Obtém os caminhos dos arquivos JSON do ambiente
        const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.resolve(__dirname, "../../../credentials.json");
        const tokenPath = process.env.GOOGLE_GMAIL_TOKEN_PATH || path.resolve(__dirname, "../../../token_gmail.json");

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
            scope: ["https://www.googleapis.com/auth/gmail.send"],
        });
        Logger.toolSaid(this.name, `Autorize este aplicativo visitando esta URL: ${authUrl}`);
        const code = await this.promptForCode();
        const {tokens} = await this.oAuth2Client.getToken(code);
        this.oAuth2Client.setCredentials(tokens);

        // Obtém o caminho do arquivo de token do ambiente
        const tokenPath = process.env.GOOGLE_GMAIL_TOKEN_PATH || path.resolve(__dirname, "../../../token_gmail.json");
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
     * Atualiza manualmente o token de autenticação OAuth2.
     * @returns Uma promessa que resolve com uma mensagem de sucesso ou rejeita com um erro.
     */
    private async updateToken(): Promise<string> {
        try {
            await this.getNewToken();
            Logger.toolSaid(this.name, `Token atualizado com sucesso.`);
            return "Token atualizado com sucesso.";
        } catch (error: any) {
            Logger.error(`[GmailSendTool] Erro ao atualizar o token: ${error.message}`);
            throw new Error(`Erro ao atualizar o token: ${error.message}`);
        }
    }

    /**
     * Envia um e-mail usando a API do Gmail.
     * @param options Detalhes do e-mail a ser enviado.
     * @returns Uma promessa que resolve com uma mensagem de sucesso ou rejeita com um erro.
     */
    private async sendEmail(options: EmailOptions): Promise<string> {
        const gmail = google.gmail({version: "v1", auth: this.oAuth2Client});
        const raw = this.makeBody(options);

        try {
            const res = await gmail.users.messages.send({
                userId: "me",
                requestBody: {raw},
            });
            Logger.toolSaid(this.name, `E-mail enviado: ${res.data.id}`);
            return `E-mail enviado: ${res.data.id}`;
        } catch (error: any) {
            Logger.error(`[GmailSendTool] Erro ao enviar e-mail: ${error.message}`);
            throw error;
        }
    }

    /**
     * Cria o corpo do e-mail em formato base64.
     * @param options Detalhes do e-mail a ser enviado.
     * @returns Uma string codificada em base64 representando o e-mail.
     */
    private makeBody(options: EmailOptions): string {
        const str = [
            'Content-Type: text/plain; charset="UTF-8"\n',
            "MIME-Version: 1.0\n",
            "Content-Transfer-Encoding: 7bit\n",
            `to: ${options.to}\n`,
            `from: me\n`, // Você pode configurar o remetente aqui
            `subject: ${options.subject}\n\n`,
            options.body,
        ].join("");

        return Buffer.from(str)
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");
    }
}
