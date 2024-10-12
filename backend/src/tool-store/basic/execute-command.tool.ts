import { exec } from "child_process";
import { Tool } from "botlandia/core/tools";
import {Logger} from "../../../../api-whatsapp/src/logger";
import os from "os";

interface ExecuteCommandToolArgs {
    command: string;
}

export class ExecuteCommandTool extends Tool {
    static UUID = "82969de5-f092-43d0-8c16-5be5ff32672b";
    private prohibitedCommands: string[];

    constructor(prohibitedCommands: string[] = []) {
        super(
            ExecuteCommandTool.UUID,
            "ExecuteCommandTool",
            `
                Executa um comando no shell do sistema operacional.
                Forneça o comando como um argumento.
                Retorna a saída padrão (stdout) do comando.
                Esta ferramenta permite a execução de qualquer comando, exceto aqueles especificados na lista de comandos proibidos.
            `
        );
        this.prohibitedCommands = prohibitedCommands;

        this.addField({
            name: "command",
            type: "string",
            description: "O comando a ser executado.",
        });
    }

    /**
     * Executa o comando com os argumentos fornecidos.
     * @param arg String JSON contendo 'command'.
     * @returns Uma promessa que resolve com a saída do comando ou rejeita com um erro.
     */
    async run(arg: string): Promise<string> {
        const objArgs: ExecuteCommandToolArgs = JSON.parse(arg);
        Logger.toolSaid(this.name, ` Executando com os argumentos: ${JSON.stringify(objArgs)}`);
        const { command } = objArgs;

        if (!command) {
            Logger.error("[ExecuteCommandTool] Argumento 'command' ausente.");
            throw new Error("Argumento 'command' ausente");
        }

        if (this.isCommandProhibited(command)) {
            Logger.error(`[ExecuteCommandTool] O comando "${command}" é proibido.`);
            throw new Error(`O comando "${command}" é proibido.`);
        }

        try {
            const output = await this.executeCommand(command);
            Logger.toolSaid(this.name, ` Comando [${command}] executado com sucesso`);
            return `Comando [${command}] executado com sucesso:\n${output}`;
        } catch (error: any) {
            Logger.error(
                `[ExecuteCommandTool] Erro ao executar o comando: ${error.message}`
            );
            throw new Error(`Erro ao executar o comando: ${error.message}`);
        }
    }

    /**
     * Verifica se o comando está na lista de comandos proibidos.
     * @param command O comando a ser verificado.
     * @returns Verdadeiro se o comando for proibido, caso contrário, falso.
     */
    private isCommandProhibited(command: string): boolean {
        const commandName = command.split(" ")[0];
        return this.prohibitedCommands.includes(commandName);
    }

    /**
     * Executa o comando no shell apropriado com base no sistema operacional.
     * @param command O comando a ser executado.
     * @returns Uma promessa que resolve com a saída do comando.
     */
    async executeCommand(command: string): Promise<string> {
        const platform = os.platform();
        let shell: string;

        // Determina o shell com base no sistema operacional
        if (platform === "win32") {
            shell = "cmd.exe";
        } else {
            shell = "/bin/bash";
        }
        return new Promise((resolve, reject) => {
            exec(command, { shell }, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                if (stderr) {
                    // Algumas ferramentas enviam avisos para stderr, que podem não ser críticas
                    // Dependendo do caso de uso, você pode optar por resolver mesmo com stderr
                    reject(new Error(stderr));
                    return;
                }
                return resolve(stdout);
            });
        });
    }
}
