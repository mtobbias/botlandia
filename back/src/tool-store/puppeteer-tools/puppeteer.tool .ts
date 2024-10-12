import puppeteer, {Browser, Page} from "puppeteer";
import fs from "fs/promises";
import path from "path";
import os from "os";
import {Tool} from "botlandia/core/tools";
import {Logger} from "botlandia/lib/logger";

interface PuppeteerToolArgs {
    action:
        | "goto"
        | "click"
        | "type"
        | "screenshot"
        | "evaluate"
        | "getContent"
        | "getTitle"
        | "getUrl"
        | "scrape"
        | "saveSession"
        | "loadSession"
        | "waitForSelector";
    url?: string;
    selector?: string;
    text?: string;
    filePath?: string;
    script?: string;
    scrapeFormat?: "json" | "csv";
    scrapeSelectors?: { [key: string]: string };
    sessionName?: string;
    timeout?: number;
}

export class PuppeteerTool extends Tool {
    static UUID = "c4faf43a-7954-494c-ba0e-daeb1871d0e3";
    private static browser: Browser | null = null;
    private static page: Page | null = null;
    private static isBrowserLaunching = false;

    constructor() {
        super(
            PuppeteerTool.UUID,
            "PuppeteerTool",
            `
        Uma ferramenta versátil para interagir com páginas web usando o Puppeteer.
        Permite navegar para URLs, clicar em elementos, digitar texto,
        tirar screenshots, avaliar código JavaScript, obter conteúdo,
        obter o título da página, a URL atual, raspar dados,
        aguardar elementos aparecerem e gerenciar sessões do navegador
        (salvar e carregar cookies). A instância do navegador é mantida aberta
        para ações subsequentes, melhorando o desempenho e mantendo a sessão.
      `
        );

        this.addField({
            name: "action",
            type: "string",
            description:
                "A ação a ser executada (goto, click, type, screenshot, evaluate, getContent, getTitle, getUrl, scrape, saveSession, loadSession, waitForSelector)",
        });
        this.addField({
            name: "url",
            type: "string",
            description:
                "A URL para navegar (para as ações 'goto' e 'scrape')",
        });
        this.addField({
            name: "selector",
            type: "string",
            description:
                "O seletor CSS do elemento para interagir (para as ações 'click', 'type', 'getContent', 'waitForSelector' e 'scrape')",
        });
        this.addField({
            name: "text",
            type: "string",
            description: "O texto para digitar (para a ação 'type')",
        });
        this.addField({
            name: "filePath",
            type: "string",
            description:
                "O caminho para salvar o screenshot (para a ação 'screenshot')",
        });
        this.addField({
            name: "script",
            type: "string",
            description:
                "O código JavaScript para avaliar (para a ação 'evaluate'). O script pode retornar um valor.",
        });
        this.addField({
            name: "scrapeFormat",
            type: "string",
            description:
                "O formato desejado para os dados raspados (para a ação 'scrape'): 'json' (padrão) ou 'csv'",
        });
        this.addField({
            name: "scrapeSelectors",
            type: "object",
            description:
                "Um objeto mapeando chaves de dados para seletores CSS dos elementos a serem raspados (para a ação 'scrape')",
        });
        this.addField({
            name: "sessionName",
            type: "string",
            description:
                "O nome para salvar/carregar a sessão (para as ações 'saveSession' e 'loadSession')",
        });
        this.addField({
            name: "timeout",
            type: "number",
            description:
                "Tempo máximo para aguardar uma ação em milissegundos (para ações como 'waitForSelector')",
        });
    }

    async run(arg: string): Promise<any> {
        const objArgs: PuppeteerToolArgs = JSON.parse(arg);
        Logger.toolSaid(this.name, `Executando com argumentos: ${JSON.stringify(objArgs)}`
        );

        const {
            action,
            url,
            selector,
            text,
            filePath,
            script,
            scrapeFormat,
            scrapeSelectors,
            sessionName,
            timeout,
        } = objArgs;

        try {
            await this.initializeBrowser();

            switch (action) {
                case "goto":
                    if (!url) {
                        throw new Error("URL é necessária para a ação 'goto'.");
                    }
                    await PuppeteerTool.page!.goto(url, {waitUntil: "networkidle2"});
                    Logger.toolSaid(this.name, ` Navegado para: ${url}`);
                    return `[PuppeteerTool] Navegado para: ${url}`;

                case "click":
                    if (!selector) {
                        throw new Error("Seletor é necessário para a ação 'click'.");
                    }
                    await PuppeteerTool.page!.waitForSelector(selector, {timeout: timeout || 30000});
                    await PuppeteerTool.page!.click(selector);
                    Logger.toolSaid(this.name, ` Elemento clicado: ${selector}`);
                    return `[PuppeteerTool] Elemento clicado: ${selector}`;

                case "type":
                    if (!selector || !text) {
                        throw new Error(
                            "Seletor e texto são necessários para a ação 'type'."
                        );
                    }
                    await PuppeteerTool.page!.waitForSelector(selector, {timeout: timeout || 30000});
                    await PuppeteerTool.page!.type(selector, text);
                    Logger.toolSaid(this.name, ` Texto "${text}" digitado em: ${selector}`);
                    return `[PuppeteerTool] Texto "${text}" digitado em: ${selector}`;

                case "screenshot":
                    if (!filePath) {
                        throw new Error("Caminho do arquivo é necessário para a ação 'screenshot'.");
                    }
                    await PuppeteerTool.page!.screenshot({path: filePath});
                    Logger.toolSaid(this.name, ` Screenshot salvo em: ${filePath}`);
                    return `[PuppeteerTool] Screenshot salvo em: ${filePath}`;

                case "evaluate":
                    if (!script) {
                        throw new Error("Script é necessário para a ação 'evaluate'.");
                    }
                    const evalResult = await PuppeteerTool.page!.evaluate(script);
                     Logger.toolSaid(this.name, `Script avaliado. Resultado: ${JSON.stringify(
                            evalResult
                        )}`
                    );
                    return evalResult;

                case "getContent":
                    if (!selector) {
                        throw new Error("Seletor é necessário para a ação 'getContent'.");
                    }
                    await PuppeteerTool.page!.waitForSelector(selector, {timeout: timeout || 30000});
                    const content = await PuppeteerTool.page!.$eval(
                        selector,
                        (el) => el.textContent
                    );
                    Logger.toolSaid(this.name, ` Conteúdo obtido de: ${selector}`);
                    return content;

                case "getTitle":
                    const title = await PuppeteerTool.page!.title();
                    Logger.toolSaid(this.name, ` Título da página: ${title}`);
                    return title;

                case "getUrl":
                    const currentUrl = PuppeteerTool.page!.url();
                    Logger.toolSaid(this.name, ` URL atual: ${currentUrl}`);
                    return currentUrl;

                case "scrape":
                    if (!scrapeSelectors) {
                        throw new Error(
                            "'scrapeSelectors' é necessário para a ação 'scrape'."
                        );
                    }
                    const scrapedData = await this.scrapeData(scrapeSelectors);
                    Logger.toolSaid(this.name, ` Dados raspados com sucesso.`);
                    return scrapedData;

                case "waitForSelector":
                    if (!selector) {
                        throw new Error(
                            "Seletor é necessário para a ação 'waitForSelector'."
                        );
                    }
                    await PuppeteerTool.page!.waitForSelector(selector, {timeout: timeout || 30000});
                    Logger.toolSaid(this.name, ` Seletor ${selector} agora está visível.`);
                    return `Seletor ${selector} agora está visível.`;

                case "saveSession":
                    if (!sessionName) {
                        throw new Error(
                            "Nome da sessão é necessário para a ação 'saveSession'."
                        );
                    }
                    await this.saveSession(sessionName);
                    Logger.toolSaid(this.name, ` Sessão salva: ${sessionName}`);
                    return `Sessão salva: ${sessionName}`;

                case "loadSession":
                    if (!sessionName) {
                        throw new Error(
                            "Nome da sessão é necessário para a ação 'loadSession'."
                        );
                    }
                    await this.loadSession(sessionName);
                    Logger.toolSaid(this.name, ` Sessão carregada: ${sessionName}`);
                    return `Sessão carregada: ${sessionName}`;

                default:
                    Logger.error(`[PuppeteerTool] Ação inválida: ${action}`);
                    throw new Error(`Ação inválida: ${action}`);
            }
        } catch (error: any) {
            Logger.error(`[PuppeteerTool] Erro durante a execução: ${error.message}`);
            throw new Error(`Erro no PuppeteerTool: ${error.message}`);
        }
    }

    private async initializeBrowser(): Promise<void> {
        if (PuppeteerTool.page) {
            return;
        }

        if (PuppeteerTool.isBrowserLaunching) {
            // Aguardar até que o navegador seja lançado
            while (PuppeteerTool.isBrowserLaunching) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
            return;
        }

        PuppeteerTool.isBrowserLaunching = true;

        try {
            const options = {
                headless: false,
                args: ["--no-sandbox"],
            };
            PuppeteerTool.browser = await puppeteer.launch(options);
            PuppeteerTool.page = await PuppeteerTool.browser.newPage();

            // Configurar idioma e agente do usuário
            await PuppeteerTool.page.setExtraHTTPHeaders({
                "Accept-Language": "pt-BR",
            });
            await PuppeteerTool.page.setUserAgent(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
            );

            // Carregar cookies se a sessão existir
            const sessionName = "defaultSession";
            await this.loadSession(sessionName);

            await PuppeteerTool.page.setDefaultNavigationTimeout(60000); // Definir timeout para 60 segundos
            Logger.toolSaid(this.name, `Navegador inicializado.`);
        } catch (error: any) {
            Logger.error(
                `[PuppeteerTool] Erro ao inicializar o navegador: ${error.message}`
            );
            throw new Error(`Falha ao inicializar o navegador: ${error.message}`);
        } finally {
            PuppeteerTool.isBrowserLaunching = false;
        }
    }

    async closeBrowser(): Promise<void> {
        if (PuppeteerTool.browser) {
            await PuppeteerTool.browser.close();
            PuppeteerTool.browser = null;
            PuppeteerTool.page = null;
            Logger.toolSaid(this.name, ` Navegador fechado.`);
        }
    }

    private async saveSession(sessionName: string): Promise<void> {
        if (!PuppeteerTool.page) {
            throw new Error("Página do navegador não está inicializada.");
        }

        const cookies = await PuppeteerTool.page.cookies();
        const sessionData = JSON.stringify(cookies);

        const sessionDir = path.join(os.tmpdir(), "iara-sessions");
        const sessionPath = path.join(sessionDir, `${sessionName}.json`);

        await fs.mkdir(sessionDir, {recursive: true});
        await fs.writeFile(sessionPath, sessionData, "utf8");
    }

    private async loadSession(sessionName: string): Promise<void> {
        if (!PuppeteerTool.page) {
            throw new Error("Página do navegador não está inicializada.");
        }

        const sessionDir = path.join(os.tmpdir(), "iara-sessions");
        const sessionPath = path.join(sessionDir, `${sessionName}.json`);

        try {
            const sessionData = await fs.readFile(sessionPath, "utf8");
            const cookies = JSON.parse(sessionData);
            await PuppeteerTool.page.setCookie(...cookies);
        } catch (error) {
            Logger.warn(`[PuppeteerTool] Nenhuma sessão encontrada com o nome: ${sessionName}`);
            // Se a sessão não existir, podemos continuar sem carregar cookies
        }
    }

    private async scrapeData(
        scrapeSelectors: { [key: string]: string }
    ): Promise<{ [key: string]: any }> {
        const data: { [key: string]: any } = {};
        for (const [key, selector] of Object.entries(scrapeSelectors)) {
            try {
                await PuppeteerTool.page!.waitForSelector(selector, {timeout: 5000});
                const content = await PuppeteerTool.page!.$eval(
                    selector,
                    (el) => el.textContent || el.getAttribute('src') || ''
                );
                data[key] = content?.trim() || null;
            } catch (error) {
                data[key] = null;
                Logger.warn(
                    `[PuppeteerTool] Não foi possível raspar dados para o seletor: ${selector}`
                );
            }
        }
        return data;
    }
}
