import {promises as fs} from "fs";
import path from "path";
import {Tool} from "botlandia/core/tools";
import {Logger} from "../../../../api-whatsapp/src/logger";

interface SearchDirectoryArgs {
    directory: string;
}

export class SearchDirectoryTool extends Tool {
    static UUID = "efeccd95-d5b2-4179-a044-3ed0202bf104";
    private baseDirectory?: string;

    constructor(baseDirectory?: string) {
        super(
            SearchDirectoryTool.UUID,
            "SearchDirectoryTool",
            `
        **Descrição da Ferramenta:**
        A SearchDirectoryTool lista o conteúdo de um diretório especificado, incluindo arquivos e subdiretórios.
        
        **Como Usar:**
        - **directory**: Forneça o caminho relativo ou absoluto do diretório que deseja listar. Se um diretório base for especificado, os caminhos relativos serão resolvidos em relação a ele.
        
        **Notas:**
        - A ferramenta garante que diretórios fora do diretório base (se especificado) não possam ser acessados por questões de segurança.
      `,
        );
        this.baseDirectory = baseDirectory;

        this.addField({
            name: "directory",
            type: "string",
            description: "O caminho do diretório que será pesquisado. Pode ser relativo ao diretório base ou um caminho absoluto.",
        });
    }

    async run(arg: any): Promise<string[]> {
        let objArgs: SearchDirectoryArgs;
        try {
            objArgs = JSON.parse(arg);
            Logger.toolSaid(this.name, `Iniciando execução com argumentos: ${JSON.stringify(objArgs)}`);
        } catch (parseError: any) {
            Logger.error(`[${this.name}] Falha ao analisar os argumentos fornecidos: ${parseError.message}`);
            throw new Error("Argumentos fornecidos inválidos. Certifique-se de que estão no formato JSON correto.");
        }

        const {directory} = objArgs;

        if (!directory) {
            Logger.warn(`[${this.name}] Argumento 'directory' não fornecido.`);
            throw new Error("Argumento 'directory' é obrigatório.");
        }

        try {
            const contents = await this.listDirectoryContents(directory);
            Logger.toolSaid(this.name, `Conteúdo do diretório '${directory}' listado com sucesso.`);
            return contents;
        } catch (error: any) {
            Logger.error(`[${this.name}] Falha ao listar o diretório '${directory}': ${error.message}`);
            throw new Error(`Não foi possível listar o diretório '${directory}': ${error.message}`);
        }
    }

    private async listDirectoryContents(dirPath: string): Promise<string[]> {
        const result: string[] = [];
        try {
            let fullPath = dirPath;

            if (this.baseDirectory) {
                const resolvedBase = path.resolve(this.baseDirectory);
                fullPath = path.resolve(resolvedBase, dirPath);

                if (!fullPath.startsWith(resolvedBase)) {
                    Logger.warn(`[${this.name}] Tentativa de acessar o caminho fora do diretório base: '${fullPath}'`);
                    throw new Error("Tentativa de acessar um diretório fora do diretório base não é permitida.");
                }
            }

            Logger.toolSaid(this.name, `Listando conteúdo do diretório: ${fullPath}`);
            const entries = await fs.readdir(fullPath, {withFileTypes: true});

            for (const entry of entries) {
                const entryPath = path.join(dirPath, entry.name);
                if (entry.isDirectory()) {
                    result.push(`Diretório: ${entryPath}`);
                } else if (entry.isFile()) {
                    result.push(`Arquivo: ${entryPath}`);
                } else {
                    result.push(`Outro: ${entryPath}`);
                }
            }

            Logger.toolSaid(this.name, `Total de itens listados no diretório '${fullPath}': ${result.length}`);
        } catch (error: any) {
            Logger.error(`[${this.name}] Erro ao listar o diretório '${dirPath}': ${error.message}`);
            throw new Error(`Erro ao listar o diretório '${dirPath}': ${error.message}`);
        }
        return result;
    }
}
