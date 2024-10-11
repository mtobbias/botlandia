import axios from "axios";
import fs from "fs";
import path from "path";
import { Tool } from "botlandia/core/tools";
import { Logger } from "botlandia/utils/logger";

interface DownloadToolArgs {
    url: string;
    filePath: string;
}

export class DownloadTool extends Tool {
    static UUID = "da5610a0-24a5-43fd-a452-56426a10af47";
    private readonly baseDirectory: string;

    constructor(baseDirectory: string) {
        super(
            DownloadTool.UUID,
            "DownloadTool",
            `
            Baixa um arquivo da URL especificada e salva no caminho de arquivo fornecido.
            Suporta vários tipos de arquivos, incluindo JSON.
            Garante que os arquivos sejam salvos dentro do diretório base para prevenir acessos não autorizados.
          `
        );
        this.baseDirectory = baseDirectory;

        this.addField({
            name: "url",
            type: "string",
            description: "A URL do arquivo a ser baixado.",
        });
    }

    /**
     * Executa a operação de download com os argumentos fornecidos.
     * @returns Uma promessa que resolve com uma mensagem de sucesso ou rejeita com um erro.
     */
    async run(arg: any): Promise<string> {
        Logger.info(`[DownloadTool] Iniciando download com os argumentos: ${arg}`);

        let obj: DownloadToolArgs;
        try {
            obj = typeof arg === "string" ? JSON.parse(arg) : arg;
        } catch (parseError: any) {
            Logger.error(
                `[DownloadTool] Falha ao analisar os argumentos. Certifique-se de que a entrada é um JSON válido. Erro: ${parseError.message}`
            );
            throw new Error("Formato de argumento inválido. Esperado uma string JSON.");
        }

        const { url } = obj;

        if (!url ) {
            Logger.error(
                "[DownloadTool] Argumentos obrigatórios ausentes. 'url' ."
            );
            throw new Error("Faltando argumentos obrigatórios: 'url' .");
        }

        try {
            const result = await this.downloadFile(url);
            Logger.info(`[DownloadTool] Download bem-sucedido: ${result}`);
            return result;
        } catch (error: any) {
            Logger.error(`[DownloadTool] Download falhou: ${error.message}`);
            throw new Error(`Download falhou: ${error.message}`);
        }
    }

    /**
     * Baixa um arquivo da URL especificada e salva no caminho de arquivo designado.
     * @param url A URL do arquivo a ser baixado.
     * @returns Uma promessa que resolve com o caminho do arquivo após o download bem-sucedido.
     */
    private async downloadFile(url: string): Promise<string> {

        try {


            // Inicia a requisição HTTP GET com streaming
            const response = await axios.get(url, { responseType: "stream" });

            // Trata respostas HTTP com status diferente de 200
            if (response.status !== 200) {
                throw new Error(
                    `Falha ao baixar o arquivo. Código de status HTTP: ${response.status}`
                );
            }

            const directory = path.dirname(path.resolve(this.baseDirectory));
            await fs.promises.mkdir(directory, { recursive: true });
            Logger.debug(`[DownloadTool] Diretório garantido que existe: ${directory}`);

            const writer = fs.createWriteStream(path.resolve(this.baseDirectory));

            // Encaminha os dados da resposta para o arquivo
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on("finish", () => {
                    Logger.info(`[DownloadTool] Arquivo baixado com sucesso para: ${path.resolve(this.baseDirectory)}`);
                    resolve(`Arquivo baixado com sucesso para: ${path.resolve(this.baseDirectory)}`);
                });
                writer.on("error", (writeError) => {
                    Logger.error(
                        `[DownloadTool] Erro ao escrever o arquivo no disco: ${writeError.message}`
                    );
                    reject(new Error(`Erro ao escrever o arquivo no disco: ${writeError.message}`));
                });
            });
        } catch (error: any) {
            Logger.error(
                `[DownloadTool] Falha ao baixar de ${url}. Erro: ${error.message}`
            );
            throw new Error(`Falha ao baixar de ${url}. Erro: ${error.message}`);
        }
    }
}
