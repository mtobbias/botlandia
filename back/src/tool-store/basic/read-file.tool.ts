import {promises as fs} from "fs";
import {Tool} from "botlandia/core/tools";
import {Logger} from "botlandia/utils/logger";
import * as path from "path";

interface ReadFileToolArgs {
    filePath: string;
}

export class ReadFileTool extends Tool {
    static UUID = "931e0088-d3a8-4db1-91a6-8eda4212ade2";
    private baseDirectory?: string;

    constructor(baseDirectory?: string) {
        super(
            ReadFileTool.UUID,
            "ReadFileTool",
            `
                **Descrição da Ferramenta:**
                A ReadFileTool lê o conteúdo de um arquivo especificado e retorna seu conteúdo como uma string.
                
                **Como Usar:**
                - **filePath**: Forneça o caminho relativo ou absoluto do arquivo que deseja ler. Se um diretório base for especificado, os caminhos relativos serão resolvidos em relação a ele.
                
                **Notas:**
                - A ferramenta garante que arquivos fora do diretório base (se especificado) não possam ser acessados por questões de segurança.
            `,
        );
        this.baseDirectory = baseDirectory;

        this.addField({
            name: "filePath",
            type: "string",
            description: "O caminho do arquivo que será lido. Pode ser relativo ao diretório base ou um caminho absoluto.",
        });
    }

    async run(arg: any): Promise<string> {
        let objArgs: ReadFileToolArgs;
        try {
            objArgs = JSON.parse(arg);
            Logger.toolSaid(this.name, `Iniciando execução com argumentos: ${JSON.stringify(objArgs)}`);
        } catch (parseError: any) {
            Logger.error(`[${this.name}] Falha ao analisar os argumentos fornecidos: ${parseError.message}`);
            throw new Error("Argumentos fornecidos inválidos. Certifique-se de que estão no formato JSON correto.");
        }

        const {filePath} = objArgs;

        if (!filePath) {
            Logger.warn(`[${this.name}] Argumento 'filePath' não fornecido.`);
            throw new Error("Argumento 'filePath' é obrigatório.");
        }

        try {
            const content = await this.readFile(filePath);
            Logger.toolSaid(this.name, `Conteúdo do arquivo '${filePath}' lido com sucesso.`);
            return content;
        } catch (error: any) {
            Logger.error(`[${this.name}] Falha ao ler o arquivo '${filePath}': ${error.message}`);
            throw new Error(`Não foi possível ler o arquivo '${filePath}': ${error.message}`);
        }
    }

    private async readFile(filePath: string): Promise<string> {
        try {
            let fullPath = filePath;

            if (this.baseDirectory) {
                const resolvedBase = path.resolve(this.baseDirectory);
                fullPath = path.resolve(resolvedBase, filePath);

                if (!fullPath.startsWith(resolvedBase)) {
                    Logger.warn(`[${this.name}] Tentativa de acessar o caminho fora do diretório base: '${fullPath}'`);
                    throw new Error("Tentativa de ler um arquivo fora do diretório base não é permitida.");
                }
            }

            Logger.toolSaid(this.name, `Lendo arquivo de: ${fullPath}`);
            const data = await fs.readFile(fullPath, "utf8");
            Logger.toolSaid(this.name, `Arquivo lido com sucesso: ${fullPath}`);
            return data;
        } catch (error: any) {
            Logger.error(`[${this.name}] Erro ao ler o arquivo '${filePath}': ${error.message}`);
            throw new Error(`Erro ao ler o arquivo '${filePath}': ${error.message}`);
        }
    }
}
