import { Tool } from "botlandia/core/tools";
import { SerperServices } from "botlandia/tool-store/serper-tool/serper-services";
import {Logger} from "../../../../api-whatsapp/src/logger";

interface SerperScrapeWebToolArgs {
    url: string;
}

export class SerperScrapeTool extends Tool {
    static UUID = "231dc873-1c78-4bf2-8cf3-89ed469464dc";
    private serperDev: SerperServices = new SerperServices();

    constructor() {
        super(
            SerperScrapeTool.UUID,
            "SerperScrapeTool",
            `
                Especializada em extrair dados de websites.
                Forneça a URL do site como argumento para extrair seu conteúdo.
                Esta ferramenta utiliza a API Serper.dev para extração de dados web.
                Esta ferramenta usa https://scrape.serper.dev
            `
        );

        this.addField({
            name: "url",
            type: "string",
            description: "A URL do site a ser extraído.",
        });
    }

    /**
     * Executa a ferramenta com os argumentos fornecidos.
     * @param arg String JSON contendo 'url'.
     * @returns Uma promessa que resolve com o resultado da operação ou rejeita com um erro.
     */
    async run(arg: string): Promise<any> {
        Logger.toolSaid(this.name, `Executando com os argumentos: ${arg}`);
        const obj: SerperScrapeWebToolArgs = JSON.parse(arg);

        const { url } = obj;

        if (!url) {
            Logger.error("[SerperScrapeTool] Argumento 'url' ausente.");
            throw new Error("Argumento 'url' ausente.");
        }

        try {
            const response = await this.serperDev.scrape(url);
            Logger.toolSaid(this.name, `Extração de ${url} concluída com sucesso.`);
            return JSON.stringify(response);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message;
            Logger.toolSaid(this.name, `Erro durante a extração de ${url}: ${errorMessage}`);
            throw new Error(`Erro durante a extração: ${errorMessage}`);
        }
    }
}
