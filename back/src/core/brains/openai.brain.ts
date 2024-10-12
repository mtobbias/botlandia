import OpenAI from "openai";
// @ts-ignore
import * as dotenv from "dotenv";
import {Brain} from "botlandia/core/brain";
import {Logger} from "botlandia/lib/logger";
import {Answer, IBill, IBrain, ITool} from "botlandia/core/interfaces";

export class OpenaiBrain extends Brain implements IBrain {
    openai?: OpenAI;

    private initializeLLM = (): OpenAI => {
        dotenv.config();
        const apiKey = process.env.OPENAI_API_KEY;
        const model = process.env.OPENAI_MODEL_NAME;
        if (!apiKey || !model) {
            const errorMessage = "Variáveis de ambiente OPENAI_API_KEY ou OPENAI_MODEL_NAME não estão definidas.";
            Logger.error(errorMessage);
            throw new Error(errorMessage);
        }
        return new OpenAI({apiKey});
    };

    private getOpenAI() {
        if (this.openai === undefined) {
            Logger.debug("Inicializando OpenAI...");
            this.openai = this.initializeLLM();
            Logger.debug("OpenAI inicializado com sucesso.");
        }
        return this.openai;
    }

    getFields = (listOfFields?: any[]) => {
        if (listOfFields) {
            Logger.debug("Obtendo campos personalizados para a resposta.");
            let obj: any = {};
            for (const field of listOfFields) {
                obj[field.name] = {type: field.type, description: field.description};
                Logger.debug(`...field name ${field.name}`);
            }
            return obj;
        }
        Logger.debug("Utilizando campos padrão para a resposta.");
        return {answer: {type: "string", description: "your answer"}};
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
                const funcs = this.getFunctions(tools)
                if (funcs) {
                    return {
                        model: process.env.OPENAI_MODEL_NAME!,
                        messages: this.chatHistory as any,
                        functions: funcs,
                        function_call: "auto",
                    }
                }
                return {
                    model: process.env.OPENAI_MODEL_NAME!,
                    messages: this.chatHistory as any,
                }
            }

            const response = await this.getOpenAI().chat.completions.create(getBody() as any);
            Logger.debug("Resposta da OpenAI recebida.");
            await this.updateCoast(response.usage?.total_tokens, 'OPEN_AI', about)
            Logger.info(`Tokens utilizados: ${response.usage?.total_tokens}`);
            return {
                tokens: response.usage?.total_tokens || 0,
                answer: response.choices[0].message as Answer
            };
        } catch (error) {
            Logger.error("Erro ao chamar a API da OpenAI:", error);
            throw error;
        }
    };
}