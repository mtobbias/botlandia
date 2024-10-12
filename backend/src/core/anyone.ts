import {IBill, IBillAnyone, IBrain, ITool, ILog} from "./interfaces";
import {Logger} from "botlandia/utils/logger";

/**
 * Interface para o argumento da função de callback de log.
 */
interface ICallbackLogData {
    squad: string;
    tool?: string;
    agent?: string;
    said: string;
}

/**
 * Classe que representa um agente "Anyone" que interage com um cérebro e utiliza ferramentas para resolver tarefas.
 */
export class Anyone {
    private brain: IBrain;
    private readonly billAnyone: IBillAnyone;
    private tools: ITool[];
    private readonly role: string;
    private readonly name: string;
    private readonly avatarUrl?: string;
    private readonly maxRetries: number;

    /**
     * Cria uma nova instância de Anyone.
     * @param brain Instância do cérebro que o agente irá utilizar.
     * @param role Papel do agente.
     * @param tools Ferramentas que o agente pode utilizar.
     * @param name Nome do agente.
     * @param avatarUrl URL do avatar do agente (opcional).
     * @param maxRetries Número máximo de retentativas para processar uma subtarefa (opcional, padrão 10).
     */
    constructor(
        brain: IBrain,
        role: string,
        tools: ITool[] = [],
        name: string,
        avatarUrl?: string,
        maxRetries = 10
    ) {
        this.brain = brain;
        this.role = role;
        this.tools = tools;
        this.name = name;
        this.avatarUrl = avatarUrl;
        this.maxRetries = maxRetries;
        this.billAnyone = {
            role,
            totalTokens: 0,
            bill: {} as IBill,
        };
        this.brain.addChatSystem(` YOUR NAME IS: ${this.name}`);
    }

    /**
     * Retorna o nome do agente.
     */
    public getName(): string {
        return this.name;
    }

    /**
     * Retorna a url do avatar do agente.
     */
    public getAvatar(): string | undefined {
        return this.avatarUrl;
    }

    /**
     * Adiciona uma nova ferramenta ao agente.
     * @param tool Ferramenta a ser adicionada.
     */
    public addTool(tool: ITool): void {
        this.tools.push(tool);
    }

    /**
     * Obtém uma ferramenta pelo nome (UUID).
     * @param toolName Nome da ferramenta.
     * @throws Erro se a ferramenta não for encontrada.
     */
    public getToolByName(toolName: string): ITool {
        const tool = this.tools.find((tool) => tool.uuid === toolName);
        if (!tool) {
            throw new Error(`Ferramenta com nome ${toolName} não encontrada.`);
        }
        return tool;
    }

    /**
     * Adiciona múltiplas ferramentas ao agente.
     * @param tools Array de ferramentas a serem adicionadas.
     */
    public addAllTools(tools: ITool[]): void {
        this.tools.push(...tools);
    }

    /**
     * Retorna o papel do agente.
     */
    public getRole(): string {
        return this.role;
    }

    /**
     * Resolve uma tarefa fornecida.
     * @param tasks Descrição da tarefa.
     * @param callbackLog Função de callback para logs adicionais.
     * @returns Detalhes da cobrança após a resolução da tarefa.
     */
    public async solveThat(
        tasks: string,
        callbackLog?: (log: ICallbackLogData) => void
    ): Promise<IBillAnyone> {
        const response = await this.processSubTask(tasks, callbackLog);
        this.brain.addChatAssistant(response.bill.answer.content || "");
        return response;
    }

    /**
     * Processa uma subtarefa interagindo com o cérebro e as ferramentas.
     * @param subTask Subtarefa a ser processada.
     * @param callbackLog Função de callback para logs adicionais.
     * @returns Detalhes da cobrança após o processamento.
     */
    private async processSubTask(
        subTask: string,
        callbackLog?: (log: ICallbackLogData) => void
    ): Promise<IBillAnyone> {
        let doContinue = true;
        let countRetry = 0;

        while (doContinue && countRetry <= this.maxRetries) {
            try {
                const responseThink = await this.brain.thinkAbout(
                    subTask,
                    this.tools
                );
                this.billAnyone.bill = responseThink;
                this.billAnyone.totalTokens += responseThink.tokens;

                if (responseThink.answer.function_call) {
                    await this.handleFunctionCall(responseThink, callbackLog);
                } else {
                    doContinue = false;
                    this.logSaidAgent(responseThink.answer.content || "", callbackLog);
                }
            } catch (err: any) {
                Logger.error(`Erro ao processar subtarefa: ${err.message}`);

                // Tratar diferentes tipos de erros aqui, se necessário.

                throw err;
            }

            countRetry++;

            if (countRetry > this.maxRetries) {
                const message = `Máximo de tentativas atingido para resolver: ${subTask}`;
                this.brain.addChatSystem(message);
                this.logSaidAgent(message, callbackLog);
            }
        }

        return this.billAnyone;
    }

    /**
     * Lida com a chamada de uma função de ferramenta.
     * @param responseThink Resposta do cérebro contendo a chamada da função.
     * @param callbackLog Função de callback para logs adicionais.
     */
    private async handleFunctionCall(
        responseThink: IBill,
        callbackLog?: (log: ICallbackLogData) => void
    ): Promise<void> {
        const tool = this.getToolByName(
            responseThink.answer.function_call!.name
        );

        try {
            const responseTool = await tool.run(
                responseThink.answer.function_call!.arguments
            );

            this.brain.addChatSystem(`[${tool.uuid}] disse: ${responseTool}`);
            this.logSaidTool(tool.uuid, responseTool, callbackLog);
        } catch (err: any) {
            const errorMessage = `Erro: ${err.message}`;
            this.brain.addChatSystem(`[${tool.uuid}] ${errorMessage}`);
            this.logSaidTool(tool.uuid, errorMessage, callbackLog);
        }
    }

    /**
     * Registra uma mensagem dita por uma ferramenta.
     * @param toolName Nome da ferramenta.
     * @param message Mensagem a ser registrada.
     * @param callbackLog Função de callback para logs adicionais.
     */
    private logSaidTool(
        toolName: string,
        message: string,
        callbackLog?: (log: ICallbackLogData) => void
    ): void {
        Logger.toolSaid(toolName, message);
        callbackLog &&
        callbackLog({
            squad: "",
            tool: toolName,
            said: message,
        });
    }

    /**
     * Registra uma mensagem dita pelo agente.
     * @param message Mensagem a ser registrada.
     * @param callbackLog Função de callback para logs adicionais.
     */
    private logSaidAgent(
        message: string,
        callbackLog?: (log: ICallbackLogData) => void
    ): void {
        Logger.agentSaid(this.name, message);
        callbackLog &&
        callbackLog({
            squad: "",
            agent: this.name,
            said: message,
        });
    }

    /**
     * Adiciona uma mensagem como assistant.
     * @param message Mensagem a ser registrada.
     */
    addChatAssistant(message: string): void {
        this.brain.addChatAssistant(message);
    }

    /**
     * Define as ferramentas que o agente pode usar.
     * @param toolsToNow Array de ferramentas.
     */
    useTools(toolsToNow: ITool[]): void {
        this.tools = toolsToNow;
    }

    /**
     * Define o cérebro que o agente irá usar.
     * @param brain Instância do cérebro.
     */
    useBrain(brain: IBrain): void {
        this.brain = brain;
    }
}