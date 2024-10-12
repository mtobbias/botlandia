import * as dotenv from "dotenv";
import {
    GoogleGenerativeAI,
} from "@google/generative-ai";
import {Brain} from "botlandia/core/brain";
import {Answer, FieldTool, ITool} from "botlandia/core/interfaces";
import {Logger} from "botlandia/lib/logger";

export class GoogleBrain extends Brain {
    genAI?: GoogleGenerativeAI;
    model?: any;
    chatSession?: any;

    private initializeLLM = (): GoogleGenerativeAI => {
        dotenv.config();
        const apiKey = process.env.BOTLANDIA_BACKEND_GOOGLE_GEMINI_KEY;
        if (!apiKey) {
            throw new Error(
                "Variável de ambiente BOTLANDIA_BACKEND_GOOGLE_GEMINI_KEY não está definida."
            );
        }
        return new GoogleGenerativeAI(apiKey);
    };

    private getGoogleAI(tools: any[]) {
        if (this.genAI === undefined) {
            this.genAI = this.initializeLLM();
            this.model = this.genAI.getGenerativeModel({
                tools: [
                    {
                        functionDeclarations: this.getFunctions(tools)
                    }
                ],
                systemInstruction: this.chatHistory.filter((chat) => chat.role === 'system').map((chat) => chat.content).join("\n").toString(),
                model: process?.env?.BOTLANDIA_BACKEND_GOOGLE_GEMINI_MODEL_NAME || '', // ou outro modelo Gemini desejado
            });
        }
        return this.genAI;
    }

    private startChatSession() {
        if (this.chatSession === undefined) {
            const generationConfig = {
                temperature: 1,
                topP: 0.95,
                topK: 64,
                maxOutputTokens: 8192,
                responseMimeType: "text/plain",
            };
            this.chatSession = this.model.startChat({
                generationConfig,
                history: [],
            });
        }
        return this.chatSession;
    }

    getFields = (listOfFields?: FieldTool[]) => {
        if (listOfFields) {
            let obj: any = {};
            for (const field of listOfFields) {
                obj[field.name] = {
                    type: field.type,
                    description: field.description,
                };
            }
            return obj;
        }
        return {answer: {type: "string", description: "your answer"}};
    };

    protected getFunctions(resources: any[]) {
        Logger.debug("Obtendo funções disponíveis para o agente.");
        const list: any = [];
        resources.forEach((tool: ITool) => {
            list.push({
                name: `_${tool.uuid.toString().replace(/-/g, "_")}`,
                description: tool.description,
                parameters: {
                    type: "object",
                    properties: this.getFields(tool.fields),
                },
            });
        });
        return list.length > 0 ? list : undefined;
    }

    thinkAbout = async (
        about: string, tools: any[]
    ): Promise<any> => {
        // this.addChatUser(about);
        this.getGoogleAI(tools);
        const chatSession = this.startChatSession();
        const result = await chatSession.sendMessage(about);
        const response = result.response.text();
        // return {content: response};
        const candidates = result.response?.candidates;
        const callFn = candidates ? candidates[0].content?.parts[0] : undefined

        return {
            tokens: result.response.usageMetadata.totalTokenCount,
            answer: {
                function_call: callFn.functionCall === undefined ? undefined : {
                    name: callFn.functionCall.name.slice(1).toString().replace(/_/g, "-"),
                    arguments: JSON.stringify(callFn.functionCall.args)
                },
                content: response || ''
            } as Answer
        };
    };
}