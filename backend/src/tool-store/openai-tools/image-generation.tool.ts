import axios from "axios";
import * as dotenv from "dotenv";
import {Tool} from "botlandia/core/tools";
import {Logger} from "../../../../api-whatsapp/src/logger";

dotenv.config();

interface ImageCreationToolArgs {
    prompt: string;
    n?: number;
    size?: "256x256" | "512x512" | "1024x1024";
    response_format?: "url" | "b64_json";
}

export class ImageCreationTool extends Tool {
    static UUID = "012bede4-8fbe-409f-8984-b7943b24f2ae";

    constructor() {
        super(
            ImageCreationTool.UUID,
            "ImageCreationTool",
            `
                Esta ferramenta cria imagens com base em um prompt de texto usando a API OpenAI DALL·E.
                Forneça um prompt descrevendo a imagem desejada.
            `
        );
        this.addField({
            name: "prompt",
            type: "string",
            description: "Prompt de texto descrevendo a imagem desejada",
        });
        this.addField({
            name: "n",
            type: "number",
            description: "Número de imagens a serem geradas (opcional, padrão é 1)",
        });
        this.addField({
            name: "size",
            type: "string",
            description: "Tamanho da imagem gerada ('256x256', '512x512', '1024x1024')",
        });
        this.addField({
            name: "response_format",
            type: "string",
            description: "Formato da resposta ('url' ou 'b64_json')",
        });
    }

    /**
     * Executa a ferramenta com os argumentos fornecidos.
     * @param arg String JSON contendo 'prompt', 'n', 'size' e/ou 'response_format'.
     * @returns Uma promessa que resolve com o resultado da operação ou rejeita com um erro.
     */
    async run(arg: string): Promise<any> {
        Logger.toolSaid(this.name, `Ferramenta chamada com estes argumentos: ${arg}`);

        let obj: ImageCreationToolArgs;
        try {
            obj = JSON.parse(arg);
        } catch (error) {
            Logger.error("[ImageCreationTool] Entrada JSON inválida.");
            throw new Error("Formato de entrada inválido. Esperado uma string JSON.");
        }

        const {prompt, n = 1, size = "512x512", response_format = "url"} = obj;

        if (!prompt) {
            Logger.error("[ImageCreationTool] Argumento obrigatório ausente 'prompt'.");
            throw new Error("Faltando argumento obrigatório 'prompt'.");
        }

        const response = await this.createImage(prompt, n, size, response_format);
        return response;
    }

    /**
     * Cria uma imagem utilizando a API OpenAI DALL·E com base no prompt fornecido.
     * @param prompt Prompt de texto descrevendo a imagem desejada.
     * @param n Número de imagens a serem geradas.
     * @param size Tamanho da imagem gerada.
     * @param response_format Formato da resposta desejada.
     * @returns Uma promessa que resolve com as URLs ou dados Base64 das imagens geradas.
     */
    private async createImage(
        prompt: string,
        n: number,
        size: string,
        response_format: "url" | "b64_json"
    ): Promise<string[]> {
        try {
            const apiKey = process.env.BOTLANDIA_BACKEND_OPENAI_KEY;
            if (!apiKey) {
                throw new Error("Chave da API OpenAI ausente.");
            }

            const endpoint = "https://api.openai.com/v1/images/generations";

            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            };

            const payload = {
                prompt,
                n,
                size,
                response_format,
            };

            const response = await axios.post(endpoint, payload, {headers});

            const images = response.data.data.map((item: any) => {
                if (response_format === "url") {
                    return item.url;
                } else {
                    return item.b64_json;
                }
            });

            Logger.toolSaid(this.name, `Imagem(ns) criada(s) com sucesso.`);
            return images;
        } catch (error: any) {
            Logger.error(`[ImageCreationTool] Erro ao criar imagem: ${error.message}`);
            throw new Error(`Erro ao criar imagem: ${error.message}`);
        }
    }
}
