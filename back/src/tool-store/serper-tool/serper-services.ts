import axios, {AxiosRequestConfig} from "axios";
import {Logger} from "botlandia/utils/logger";

export class SerperServices {
    private readonly apiKey = process.env.SERPER_API_KEY;

    async scrape(urlToScrape: string): Promise<any> {
        Logger.debug( `[SerperServices] Initiating scraping of ${urlToScrape}`);

        const config: AxiosRequestConfig = {
            method: "post",
            url: "https://scrape.serper.dev",
            headers: {
                "X-API-KEY": this.apiKey,
                "Content-Type": "application/json",
            },
            data: {
                url: urlToScrape,
            },
        };

        try {
            const response = await axios(config);
            Logger.debug( `[SerperServices] Scraping of ${urlToScrape} completed successfully.`);
            return response.data;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message;
            Logger.error(`[SerperServices] Error during scraping of ${urlToScrape}: ${errorMessage}`);
            throw new Error(`Error during scraping: ${errorMessage}`);
        }
    }

    async search(query: string, gl = "br", hl = "pt-br"): Promise<any> {
        Logger.debug( `[SerperServices] Initiating search for query: ${query}`);

        const data = {
            q: query,
            gl,
            hl,
        };

        const config: AxiosRequestConfig = {
            method: "post",
            url: "https://google.serper.dev/search",
            headers: {
                "X-API-KEY": this.apiKey,
                "Content-Type": "application/json",
            },
            data,
        };

        try {
            const response = await axios(config);
            Logger.debug( `[SerperServices] Search for query "${query}" completed successfully.`);
            return response.data;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message;
            Logger.error(`[SerperServices] Error during search for query "${query}": ${errorMessage}`);
            throw new Error(`Error during search: ${errorMessage}`);
        }
    }
}
