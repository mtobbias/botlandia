import {Anyone} from "botlandia/core/anyone";
import {ITool} from "botlandia/core/interfaces";
import {Logger} from "botlandia/lib/logger";
import {BuilderFieldTool, BuilderTools} from "botlandia/core/builders/builder.tools";

export class Squad {
    analyst: Anyone;
    analystQuality: Anyone;
    analystLead: Anyone;
    name: string;
    private doContinueDialogAll = false;
    private responseSquad = '';
    private readonly acceptTool :ITool;

    constructor(analyst: Anyone, analystQuality: Anyone, analystLead: Anyone, squadName: string) {
        this.analystLead = analystLead;
        this.analyst = analyst;
        this.analystQuality = analystQuality;
        this.name = squadName
        this.acceptTool = this.acceptToolBuilder()
    }

    private acceptToolBuilder() {
        return new BuilderTools()
            .withUuid('7198573d-bb7d-4786-b1c6-c9d88af4756d')
            .withName('ACCEPT TASK TOOL')
            .withDescription('Utilize essa ferramenta para aceitar a tarefa')
            .withField(new BuilderFieldTool().withName('task').withType('string').withDescription('envie a tarefa completa aqui').build())
            .withRun((args: any) => {
                const {task} = JSON.parse(args);
                this.responseSquad = task;
                this.doContinueDialogAll = false;
                return `all task is done.`;
            })
            .build()
    }

    public addToolForAll(tool: ITool) {
        this.analyst.addTool(tool);
        this.analystQuality.addTool(tool)
        this.analystLead.addTool(tool)
    }

    async solveThat(preTasks: string, callbackLog?: (log: any) => void): Promise<any> {
        let tasks = this.prepareTask(preTasks)
        Logger.debug(`squad ready`, tasks)
        this.analystLead.addTool(this.acceptTool)
        let analystLeadAnswer;
        let totalTokens = 0;
        this.doContinueDialogAll = true;
        while (this.doContinueDialogAll) {
            const dialogAnalystAndAnalystQuality = async () => {
                let doContinueDialogAnalystAndAnalystQuality = true;
                let analystQualityAnswerContent = "";
                let analystSaid = "";
                while (doContinueDialogAnalystAndAnalystQuality) {
                    const analystAnswer = await this.analyst.solveThat(tasks);
                    const analystAnswerContent = analystAnswer.bill.answer.content || ''
                    totalTokens += analystAnswer.totalTokens;

                    Logger.agentSaid(this.analyst.getName(), analystAnswerContent)
                    if (callbackLog) {
                        callbackLog({
                            squad: this.name,
                            agent: this.analyst.getName(),
                            said: analystAnswerContent
                        })
                    }
                    const analystQualityAnswer = await this.analystQuality.solveThat(analystAnswerContent);
                    analystQualityAnswerContent = analystQualityAnswer.bill.answer.content || ''
                    totalTokens += analystQualityAnswer.totalTokens;
                    if (analystQualityAnswer.bill.answer.function_call) {
                        const tool = this.analystQuality.getToolByName(analystQualityAnswer.bill.answer.function_call.name)
                        try {
                            const responseTool = tool.run(analystQualityAnswer.bill.answer.function_call.arguments)
                            Logger.agentSaid(this.analystQuality.getName(), `[${tool.uuid}] [${responseTool}]`)
                            if (callbackLog) {
                                callbackLog({
                                    squad: this.name,
                                    tool: tool.name,
                                    said: responseTool
                                })
                            }
                            tasks += `
                            ${responseTool}
                            `;
                            continue
                        } catch (err: any) {
                            Logger.error(err?.message)
                        }
                    }
                    Logger.agentSaid(this.analystQuality.getName(), analystQualityAnswerContent)
                    if (callbackLog) {
                        callbackLog({
                            squad: this.name,
                            agent: this.analystQuality.getName(),
                            said: analystQualityAnswerContent
                        })
                    }
                    doContinueDialogAnalystAndAnalystQuality = false
                }
                return [analystSaid, analystQualityAnswerContent]
            }
            const [analystSaid, analystQualityAnswerContent] = await dialogAnalystAndAnalystQuality()


            analystLeadAnswer = await this.analystLead.solveThat(analystQualityAnswerContent);
            const analystLeadAnswerContent = analystLeadAnswer.bill.answer.content || ''
            tasks += `
            
            ${analystLeadAnswerContent}
            `
            totalTokens += analystLeadAnswer.totalTokens;

            if (analystLeadAnswer.bill.answer.function_call) {
                const tool = this.analystQuality.getToolByName(analystLeadAnswer.bill.answer.function_call.name)
                try {
                    const responseTool = tool.run(analystLeadAnswer.bill.answer.function_call.arguments)
                    Logger.agentSaid(this.analystQuality.getName(), responseTool)
                    if (callbackLog) {
                        callbackLog({
                            squad: this.name,
                            tool: tool.name,
                            said: responseTool
                        })
                    }
                    tasks += `
                    ${responseTool}
                    `;

                } catch (err) {
                    console.log(err)
                }
            }
            Logger.agentSaid(this.analystLead.getName(), analystLeadAnswerContent)

        }
        if (analystLeadAnswer) {

            if (callbackLog) {
                callbackLog({
                    squad: this.name,
                    agent: this.analystLead.getName(),
                    said: analystLeadAnswer.bill.answer.content
                })
            }

        }
        return {
            answer: this.responseSquad,
            totalTokens: totalTokens,
            anyone: []
        }
        // throw new Error('squad broken :(')
    }

    private prepareTask(preTasks: string) {
        return `
============ [SQUAD INFORMATION] ============
SQUAD_NAME : ${this.name},
SQUAD_TEAM : [
${this.analyst.getName()} (${this.analyst.getRole()}),
${this.analystQuality.getName()} (${this.analystQuality.getRole()}),
${this.analystLead.getName()} (${this.analystLead.getRole()}),
]
DATE_TIME :${new Date().toLocaleString()}

============ [ORIGINAL TASK] ============
${preTasks}


        `
    }
}
