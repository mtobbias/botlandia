import {IBill, IBillAnyone, IBrain, ITool} from "./interfaces";
import {Logger} from "botlandia/utils/logger";

/**
 * Classe que representa um agente "Anyone" que interage com um cérebro e utiliza ferramentas para resolver tarefas.
 */
export class Anyone {
    private brain: IBrain;
    private readonly billAnyone: IBillAnyone;
    private tools: ITool[];
    private readonly role: string;
    private readonly name: string;
    private avatarUrl?: string;

    /**
     * Cria uma nova instância de Anyone.
     * @param brain Instância do cérebro que o agente irá utilizar.
     * @param role Papel do agente.
     * @param tools Ferramentas que o agente pode utilizar.
     * @param name Nome do agente.
     * @param avatarUrl
     */
    constructor(brain: IBrain, role: string, tools: ITool[] = [], name: string, avatarUrl?: string) {
        this.brain = brain;
        this.role = role;
        this.tools = tools;
        this.name = name;
        this.avatarUrl = avatarUrl
        this.billAnyone = {
            role,
            totalTokens: 0,
            bill: {} as IBill
        };
        this.brain.addChatSystem(` YOUR NAME IS: ${this.name}`)
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
        const tool = this.tools.find(tool => tool.uuid === toolName);
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
    public async solveThat(tasks: string, callbackLog?: (log: string) => void): Promise<IBillAnyone> {
        const response = await this.processSubTask(tasks, callbackLog);
        this.brain.addChatAssistant(response.bill.answer.content || '')
        return response
    }


    /**
     * Processa uma subtarefa interagindo com o cérebro e as ferramentas.
     * @param subTask Subtarefa a ser processada.
     * @param callbackLog Função de callback para logs adicionais.
     * @returns Detalhes da cobrança após o processamento.
     */
    private async processSubTask(subTask: string, callbackLog?: (log: any) => void): Promise<IBillAnyone> {
        let doContinue = true;
        let maxRetry = 10;
        let countRetry = 0;

        while (doContinue && countRetry <= maxRetry) {
            try {
                const responseThink = await this.brain.thinkAbout(subTask, this.tools);
                this.billAnyone.bill = responseThink;
                this.billAnyone.totalTokens += responseThink.tokens;

                if (responseThink.answer.function_call) {
                    const tool = this.getToolByName(responseThink.answer.function_call.name);
                    try {
                        const responseTool = await tool.run(responseThink.answer.function_call.arguments);
                        this.brain.addChatSystem(`[${tool.uuid}] disse: ${responseTool}`);
                        this.logSaidTool(tool.uuid, responseTool);
                        if (callbackLog) {
                            callbackLog({
                                squad: '',
                                tool: tool.name,
                                said: responseTool
                            })
                        }
                    } catch (err: any) {
                        this.brain.addChatSystem(`[${tool.uuid}] erro: ${err.message}`);
                        this.logSaidTool(tool.uuid, `Erro: ${err.message}`);
                        if (callbackLog) {
                            callbackLog({
                                squad: '',
                                tool: tool.name,
                                said: err.message
                            })
                        }
                    }
                } else {
                    doContinue = false;
                    this.logSaidAgent(responseThink.answer.content || '');
                    if (callbackLog) {
                        callbackLog({
                            squad: '',
                            agent: this.name,
                            said: responseThink.answer.content || ''
                        })
                    }
                }
            } catch (err: any) {
                Logger.error(`Erro ao processar subtarefa: ${err.message}`);
                throw err;
            }
            countRetry++;
            if (countRetry > maxRetry) {
                this.brain.addChatSystem(`maximo de tentatias para resolver ${subTask}`);
                if (callbackLog) {
                    callbackLog({
                        squad: '',
                        agent: this.name,
                        said: 'sem resposta :('
                    })
                }
            }
        }

        return this.billAnyone;
    }

    /**
     * Registra uma mensagem dita por uma ferramenta.
     * @param toolName Nome da ferramenta.
     * @param message Mensagem a ser registrada.
     * @returns A mensagem formatada para log.
     */
    private logSaidTool(toolName: string, message: string): string {
        const toLog = `[${toolName}] disse: ${message}`;
        Logger.toolSaid(toolName, message);
        return toLog;
    }

    /**
     * Registra uma mensagem dita pelo agente.
     * @param message Mensagem a ser registrada.
     * @returns A mensagem para log.
     */
    private logSaidAgent(message: string): string {
        Logger.agentSaid(this.name, message);
        return message;
    }

    /**
     * Registra uma mensagem como assistant.
     * @param message Mensagem a ser registrada.
     */
    addChatAssistant(message: string) {
        this.brain.addChatAssistant(message)
    }

    useTools(toolsToNow: ITool[]) {
        this.tools = [];
        this.tools.push(...toolsToNow)
    }

    useBrain(brain: IBrain) {
        this.brain = brain
    }
}
