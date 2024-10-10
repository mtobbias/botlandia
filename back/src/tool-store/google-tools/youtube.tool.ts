import { google, youtube_v3 } from "googleapis";
import { Tool } from "botlandia/core/tools";
import { Logger } from "botlandia/utils/logger";

interface YouTubeToolArgs {
    action: "searchVideos" | "getVideoDetails";
    query?: string;
    videoId?: string;
    maxResults?: number;
    pageToken?: string;
    order?: string;
    videoDuration?: string;
    videoDefinition?: string;
    videoEmbeddable?: boolean;
}

export class YouTubeTool extends Tool {
    static UUID = "d957c2c8-9758-4142-af9d-d6941040f9b5";
    private youtube: youtube_v3.Youtube;

    constructor() {
        super(
            YouTubeTool.UUID,
            "YouTubeTool",
            `
                Realiza buscas de vídeos no YouTube e recupera detalhes específicos de vídeos.
                Permite que usuários pesquisem vídeos no YouTube com base em uma string de consulta,
                parâmetros avançados e recuperem uma lista de resultados relevantes ou detalhes de um vídeo específico.
            `
        );

        this.addField({
            name: "action",
            type: "string",
            description: "Ação a ser realizada ('searchVideos' ou 'getVideoDetails')."
        });
        this.addField({
            name: "query",
            type: "string",
            description: "A string de consulta para encontrar vídeos relevantes no YouTube. Necessária para 'searchVideos'."
        });
        this.addField({
            name: "videoId",
            type: "string",
            description: "ID do vídeo para recuperar detalhes específicos. Necessário para 'getVideoDetails'."
        });
        this.addField({
            name: "maxResults",
            type: "number",
            description: "O número máximo de resultados de vídeos a serem retornados. Padrão para 5 se não especificado (opcional)."
        });
        this.addField({
            name: "pageToken",
            type: "string",
            description: "Token de página para recuperar a próxima página de resultados (opcional)."
        });
        this.addField({
            name: "order",
            type: "string",
            description: "Ordem dos resultados ('relevance', 'date', 'viewCount', 'rating'). Padrão para 'relevance' (opcional)."
        });
        this.addField({
            name: "videoDuration",
            type: "string",
            description: "Duração do vídeo ('any', 'short', 'medium', 'long'). Padrão para 'any' (opcional)."
        });
        this.addField({
            name: "videoDefinition",
            type: "string",
            description: "Definição do vídeo ('any', 'standard', 'high'). Padrão para 'any' (opcional)."
        });
        this.addField({
            name: "videoEmbeddable",
            type: "boolean",
            description: "Filtrar vídeos que podem ser incorporados ('true' ou 'false'). Padrão para 'true' (opcional)."
        });

        // Inicializa o cliente do YouTube
        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) {
            throw new Error(
                "Chave de API do YouTube ausente. Por favor, defina YOUTUBE_API_KEY nas variáveis de ambiente."
            );
        }

        this.youtube = google.youtube({ version: "v3", auth: apiKey });
    }

    /**
     * Executa a ferramenta com os argumentos fornecidos.
     * @param arg String JSON contendo 'action', 'query', 'videoId' e outros parâmetros opcionais.
     * @returns Uma promessa que resolve com o resultado da operação ou rejeita com um erro.
     */
    async run(arg: string): Promise<any> {
        Logger.toolSaid(this.name, `Executando com os argumentos: ${arg}`);
        let objArgs: YouTubeToolArgs;
        try {
            objArgs = JSON.parse(arg);
        } catch (error) {
            Logger.error("[YouTubeTool] Entrada JSON inválida.");
            throw new Error("Formato de entrada inválido. Esperado uma string JSON.");
        }

        const { action, query, videoId, maxResults, pageToken, order, videoDuration, videoDefinition, videoEmbeddable } = objArgs;

        if (!action) {
            Logger.error("[YouTubeTool] Argumento obrigatório ausente: 'action'.");
            throw new Error("Faltando argumento obrigatório: 'action'.");
        }

        try {
            switch (action) {
                case "searchVideos":
                    if (!query) {
                        Logger.error("[YouTubeTool] Argumento 'query' ausente para ação 'searchVideos'.");
                        throw new Error("Argumento 'query' é obrigatório para a ação 'searchVideos'.");
                    }
                    const videos = await this.searchVideos(query, maxResults, pageToken, order, videoDuration, videoDefinition, videoEmbeddable);
                    Logger.toolSaid(this.name, `Lista de vídeos recuperada para a consulta: ${query}.`);
                    return JSON.stringify(videos);
                case "getVideoDetails":
                    if (!videoId) {
                        Logger.error("[YouTubeTool] Argumento 'videoId' ausente para ação 'getVideoDetails'.");
                        throw new Error("Argumento 'videoId' é obrigatório para a ação 'getVideoDetails'.");
                    }
                    const videoDetails = await this.getVideoDetails(videoId);
                    Logger.toolSaid(this.name, `Detalhes do vídeo recuperados para o ID: ${videoId}.`);
                    return JSON.stringify(videoDetails);
                default:
                    Logger.error(`[YouTubeTool] Ação inválida: ${action}`);
                    throw new Error(`Ação inválida: ${action}`);
            }
        } catch (error: any) {
            Logger.error(`[YouTubeTool] Erro: ${error.message}`);
            throw new Error(`Erro no YouTubeTool: ${error.message}`);
        }
    }

    /**
     * Realiza uma busca de vídeos no YouTube com base na consulta fornecida e parâmetros avançados.
     * @param query A string de consulta para buscar vídeos.
     * @param maxResults O número máximo de resultados a serem retornados (opcional, padrão para 5).
     * @param pageToken Token de página para recuperar a próxima página de resultados (opcional).
     * @param order Ordem dos resultados (opcional, padrão para 'relevance').
     * @param videoDuration Duração do vídeo (opcional, padrão para 'any').
     * @param videoDefinition Definição do vídeo (opcional, padrão para 'any').
     * @param videoEmbeddable Filtrar vídeos que podem ser incorporados (opcional, padrão para 'true').
     * @returns Uma promessa que resolve com uma lista de resultados de vídeos ou rejeita com um erro.
     */
    private async searchVideos(
        query: string,
        maxResults?: number,
        pageToken?: string,
        order?: string,
        videoDuration?: string,
        videoDefinition?: string,
        videoEmbeddable?: boolean
    ): Promise<youtube_v3.Schema$SearchResult[]> {
        try {
            const res = await this.youtube.search.list({
                part: "snippet",
                q: query,
                maxResults: maxResults || 5, // Padrão para 5 resultados se não especificado
                type: "video",
                pageToken: pageToken,
                order: order || "relevance",
                videoDuration: videoDuration || "any",
                videoDefinition: videoDefinition || "any",
                videoEmbeddable: videoEmbeddable !== undefined ? videoEmbeddable : true,
            } as any) as any;

            return res.data.items || [];
        } catch (error: any) {
            if (error.response) {
                Logger.error(`[YouTubeTool] Erro na resposta da API: ${error.response.status} - ${error.response.data.error.message}`);
                throw new Error(`Erro na resposta da API: ${error.response.data.error.message}`);
            } else if (error.request) {
                Logger.error(`[YouTubeTool] Nenhuma resposta recebida da API: ${error.message}`);
                throw new Error(`Nenhuma resposta recebida da API: ${error.message}`);
            } else {
                Logger.error(`[YouTubeTool] Erro ao configurar a requisição: ${error.message}`);
                throw new Error(`Erro ao configurar a requisição: ${error.message}`);
            }
        }
    }

    /**
     * Recupera detalhes específicos de um vídeo no YouTube com base no ID fornecido.
     * @param videoId ID do vídeo para recuperar detalhes.
     * @returns Uma promessa que resolve com os detalhes do vídeo ou rejeita com um erro.
     */
    private async getVideoDetails(videoId: string): Promise<youtube_v3.Schema$Video[]> {
        try {
            const res = await this.youtube.videos.list({
                part: "snippet,contentDetails,statistics",
                id: videoId,
            } as any) as any;

            return res.data.items || [];
        } catch (error: any) {
            if (error.response) {
                Logger.error(`[YouTubeTool] Erro na resposta da API: ${error.response.status} - ${error.response.data.error.message}`);
                throw new Error(`Erro na resposta da API: ${error.response.data.error.message}`);
            } else if (error.request) {
                Logger.error(`[YouTubeTool] Nenhuma resposta recebida da API: ${error.message}`);
                throw new Error(`Nenhuma resposta recebida da API: ${error.message}`);
            } else {
                Logger.error(`[YouTubeTool] Erro ao configurar a requisição: ${error.message}`);
                throw new Error(`Erro ao configurar a requisição: ${error.message}`);
            }
        }
    }
}
