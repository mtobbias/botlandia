import axios from "axios";
// @ts-ignore
import * as dotenv from "dotenv";
import {Answer, IBill, IBrain, ITool} from "botlandia/core/interfaces";
import {Brain} from "botlandia/core/brain";
import {Logger} from "botlandia/utils/logger";

export class OllamaBrain extends Brain implements IBrain {
    private ollamaUrl: string;

    constructor() {
        super();
        dotenv.config();
        this.ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
    }

    private getFields = (listOfFields?: any[]) => {
        if (listOfFields) {
            Logger.debug("Obtendo campos personalizados para a resposta.");
            let obj: any = {};
            for (const field of listOfFields) {
                obj[field.name] = {type: field.type, description: field.description};
            }
            return obj;
        }
        Logger.debug("Utilizando campos padrão para a resposta.");
        return {answer: {type: "string", description: "sua resposta"}};
    };

    protected getFunctions(resources: any[]) {
        Logger.debug("Obtendo funções disponíveis para o agente.");
        const list: any = [];
        resources.forEach((tool: ITool) => {
            list.push({
                name: tool.uuid,
                description: tool.description,
                parameters: {
                    type: "object",
                    properties: this.getFields(tool.fields),
                },
            });
        });
        return list.length > 0 ? list : undefined;
    }

    thinkAbout = async (about: string, tools: any[]): Promise<IBill> => {
        Logger.info(`Pensando sobre: ${about}`);
        this.addChatUser(about);

        try {
            const getBody = () => {
                const funcs = this.getFunctions(tools);
                const body: any = {
                    prompt: this.buildPrompt(),
                    stream: false,
                    model: process.env.OLLAMA_MODEL_NAME,
                    options: {
                        functions: funcs,
                        function_call: "auto",
                    },
                };
                return body;
            };

            const response = await this.callOllamaAPI(getBody());
            Logger.debug("Resposta do Ollama recebida.");

            const tokensUsed = response?.usage?.total_tokens || 0;
            await this.updateCoast(tokensUsed, "OLLAMA", about);
            Logger.info(`Tokens utilizados: ${tokensUsed}`);

            return {
                tokens: tokensUsed,
                answer: response.response || response.choices[0].message as Answer,
            };
        } catch (error) {
            Logger.error("Erro ao chamar a API do Ollama:", error);
            throw error;
        }
    };

    private buildPrompt(): string {
        const messages = this.chatHistory.map((message) => {
            return `${message.role}: ${message.content}`;
        });
        return messages.join("\n");
    }

    private async callOllamaAPI(body: any): Promise<any> {
        try {
            const response = await axios.post(`${this.ollamaUrl}/api/generate`, body);
            return response.data;
        } catch (error) {
            Logger.error("Erro ao chamar a API do Ollama:", error);
            throw error;
        }
    }
}
