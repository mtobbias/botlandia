import fs from "fs";
import path from "path";
import axios from "axios";
import { Tool } from "botlandia/core/tools";
import {Logger} from "botlandia/lib/logger";

interface ImageDescriptionToolArgs {
    path: string;
    question: string;
}

export class ImageDescriptionTool extends Tool {
    static UUID = "e1167ce3-4b59-40fd-ab00-d9d56cb89673";

    constructor() {
        super(
            ImageDescriptionTool.UUID,
            'ImageDescriptionTool',
            `
                Esta ferramenta descreve o conteúdo de uma imagem utilizando uma API de reconhecimento de imagem baseada em IA.
                Ela recebe o caminho para um arquivo de imagem como entrada e retorna
                uma descrição textual gerada pela API.
            `
        );
        this.addField({
            name: "path",
            type: "string",
            description: "Caminho para o arquivo de imagem",
        });
        this.addField({
            name: "question",
            type: "string",
            description: "Descreva sua pergunta",
        });
    }

    async run(arg: string): Promise<any> {
        Logger.toolSaid(this.name, `Ferramenta chamada com estes argumentos: ${arg}`);

        let obj: ImageDescriptionToolArgs;
        try {
            obj = JSON.parse(arg);
        } catch (error) {
            Logger.error("[ImageDescriptionTool] Entrada JSON inválida.");
            throw new Error("Formato de entrada inválido. Esperado uma string JSON.");
        }

        const { path: imagePath, question } = obj;

        if (imagePath && question) {
            return await this.describeImage(imagePath, question);
        } else {
            Logger.error(
                "[ImageDescriptionTool] Argumentos obrigatórios ausentes 'path' ou 'question'."
            );
            throw new Error("Faltando argumentos obrigatórios 'path' ou 'question'.");
        }
    }

    private async describeImage(
        imagePath: string,
        question: string
    ): Promise<string> {
        try {
            // Verifica se a imagem existe
            if (!fs.existsSync(imagePath)) {
                throw new Error(`Arquivo de imagem não encontrado no caminho: ${imagePath}`);
            }

            // Verifica o tamanho e o formato da imagem
            const imageStats = fs.statSync(imagePath);
            const fileSizeInBytes = imageStats.size;
            const allowedFormats = [".png", ".jpeg", ".jpg", ".gif", ".webp"];

            if (fileSizeInBytes > 20 * 1024 * 1024) {
                // 20 MB
                throw new Error("O tamanho da imagem excede o limite de 20 MB.");
            }

            const ext = path.extname(imagePath).toLowerCase();
            if (!allowedFormats.includes(ext)) {
                throw new Error(
                    `Formato de imagem não suportado. Formatos permitidos são: ${allowedFormats.join(
                        ", "
                    )}.`
                );
            }

            // Lê o arquivo de imagem
            const imageBuffer = fs.readFileSync(imagePath);

            // Codifica a imagem em Base64
            const base64Image = imageBuffer.toString("base64");

            // Prepara o payload da requisição
            const payload = {
                question: question,
                image: `data:image/${ext.replace(".", "")};base64,${base64Image}`,
            };

            // Substitua pelo endpoint e chave de API reais da sua API de reconhecimento de imagem
            const apiEndpoint = "https://api.exemplo.com/descrever-imagem";
            const apiKey = process.env.YOUR_API_KEY;
            if (!apiKey) {
                throw new Error("Chave de API ausente.");
            }

            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            };

            // Faz a requisição para a API
            const response = await axios.post(apiEndpoint, payload, { headers });

            // Extrai a descrição da resposta
            const description = response.data.description;
            if (!description) {
                throw new Error("Nenhuma descrição retornada pela API.");
            }

            Logger.toolSaid(this.name, `Descrição da imagem obtida com sucesso.`);
            return description;
        } catch (error: any) {
            Logger.error(
                `[ImageDescriptionTool] Erro ao descrever a imagem: ${error.message}`
            );
            throw new Error(`Erro ao descrever a imagem: ${error.message}`);
        }
    }
}
