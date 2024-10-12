import ollama, {Ollama} from 'ollama'

// @ts-ignore
import * as dotenv from "dotenv";
import {Brain} from "botlandia/core/brain";
import {Logger} from "botlandia/utils/logger";
import {Answer, IBill, IBrain, ITool} from "botlandia/core/interfaces";

export class OllamaBrain extends Brain implements IBrain {
    ollamaClient?: any;

    private initializeLLM = (): any => {
        dotenv.config();
        return new Ollama({host: process.env.BOTLANDIA_OLLAMA_URL});
    };

    private getOllamaClient(): Ollama {
        if (this.ollamaClient === undefined) {
            Logger.debug("Inicializando Ollama...");
            this.ollamaClient = this.initializeLLM();
            Logger.debug("Ollama inicializado com sucesso.");
        }
        return this.ollamaClient;
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
                type: 'function',
                function: {
                    name: tool.uuid,
                    description: tool.description,
                    parameters: {
                        type: "object",
                        properties: this.getFields(tool.fields),
                    },
                }
            });
        });
        return list.length > 0 ? list : undefined;
    }

    thinkAbout = async (about: string, tools: any[]): Promise<IBill> => {
        const tools2 = [
            {
                type: 'function',
                function: {
                    name: 'get_flight_times',
                    description: 'Get the flight times between two cities',
                    parameters: {
                        type: 'object',
                        properties: {
                            departure: {
                                type: 'string',
                                description: 'The departure city (airport code)',
                            },
                            arrival: {
                                type: 'string',
                                description: 'The arrival city (airport code)',
                            },
                        },
                        required: ['departure', 'arrival'],
                    },
                },
            },
        ];
        Logger.info(`Pensando sobre: ${about}`);
        this.addChatUser(about);
        try {

            const getBody = () => {
                const funcs = this.getFunctions(tools)
                if (funcs) {
                    return {
                        model: process.env.BOTLANDIA_OLLAMA_MODEL_NAME!,
                        messages: this.chatHistory as any,
                        tools: funcs,

                    }
                }
                return {
                    model: process.env.BOTLANDIA_OLLAMA_MODEL_NAME!,
                    stream: false,
                    messages: this.chatHistory as any,
                }
            }
            const o = await this.getOllamaClient()
            const bodyPro = getBody() as any
            const response = await o.chat(bodyPro) as any;
            Logger.debug("Resposta do Ollama recebida.", response);
            const callFn = response?.message?.tool_calls? response?.message?.tool_calls[0] : undefined;

            return {
                tokens: 0,
                answer: {
                    function_call: callFn===undefined ? undefined :{
                        name: response?.message?.tool_calls?.length > 0 ? callFn.function.name || undefined : undefined,
                        arguments: response?.message?.tool_calls?.length > 0 ? JSON.stringify(callFn.function.arguments) || undefined : undefined
                    },
                    content: response?.message.content || ''
                } as Answer
            };
        } catch (error) {
            Logger.error("Erro ao chamar a API do Ollama:", error);
            throw error;
        }
    };
}
