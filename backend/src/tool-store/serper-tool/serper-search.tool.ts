import { Tool } from "botlandia/core/tools";
import { SerperServices } from "botlandia/tool-store/serper-tool/serper-services";
import {Logger} from "../../../../api-whatsapp/src/logger";

interface SerperSearchWebToolArgs {
    query: string;
}

export class SerperSearchTool extends Tool {
    static UUID = "3bfe0aeb-43ba-4f45-ba5b-8eff38ab7349";
    private serperDev: SerperServices = new SerperServices();

    constructor() {
        super(
            SerperSearchTool.UUID,
            "SerperSearchTool",
            `
                Uma ferramenta especializada para realizar buscas na web.
                Forneça uma consulta de pesquisa como argumento para recuperar resultados de busca na internet.
                Esta ferramenta utiliza a API Serper.dev para funcionalidade de busca.
            `
        );

        this.addField({
            name: "query",
            type: "string",
            description: "O termo ou frase a ser pesquisado na web.",
        });
    }

    /**
     * Executa a ferramenta com os argumentos fornecidos.
     * @param arg String JSON contendo 'query'.
     * @returns Uma promessa que resolve com o resultado da operação ou rejeita com um erro.
     */
    async run(arg: string): Promise<any> {
        Logger.toolSaid(this.name, `Executando com os argumentos: ${arg}`);
        const obj: SerperSearchWebToolArgs = JSON.parse(arg);

        const { query } = obj;

        if (!query) {
            Logger.error("[SerperSearchTool] Argumento 'query' ausente.");
            throw new Error("Argumento 'query' ausente.");
        }

        try {
            const response = await this.serperDev.search(query);
            Logger.toolSaid(this.name, `[SerperSearchTool] Busca pela consulta "${query}" concluída com sucesso.`);
            return JSON.stringify(response);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message;
            Logger.error(
                `[SerperSearchTool] Erro durante a busca pela consulta "${query}": ${errorMessage}`
            );
            throw new Error(`Erro durante a busca: ${errorMessage}`);
        }
    }
}
