import {promises as fs} from "fs";
import {Tool} from "botlandia/core/tools";
import {Logger} from "../../../../api-whatsapp/src/logger";
import * as path from "path";

interface WriteFileToolArgs {
    filePath: string;
    content: string;
    createDirectory?: boolean;
    overwrite?: boolean;
    encoding?: BufferEncoding;
    append?: boolean;
    mode?: number;
}

export class WriteFileTool extends Tool {
    static UUID = "f2db23c0-b98b-4dc4-b373-00af3db893bc";
    private baseDirectory?: string;

    constructor(baseDirectory?: string) {
        super(
            WriteFileTool.UUID,
            "WriteFileTool",
            `
            Escreve conteúdo em um arquivo.
            Forneça o caminho do arquivo e o conteúdo a ser escrito como argumentos.
            Opções disponíveis:
            - Criar o diretório se não existir.
            - Sobrescrever o arquivo se já existir.
            - Adicionar conteúdo ao final do arquivo existente.
            - Definir permissões do arquivo.
            Este tool escreve arquivos relativos a um diretório base, se especificado.
            `
        );
        this.baseDirectory = baseDirectory;

        this.addField({
            name: "filePath",
            type: "string",
            description: "O caminho do arquivo onde o conteúdo será salvo.",
        });
        this.addField({
            name: "content",
            type: "string",
            description: "O conteúdo que será escrito no arquivo.",
        });
        this.addField({
            name: "createDirectory",
            type: "boolean",
            description:
                "Indica se deve criar o diretório caso ele não exista. Padrão: true.",
        });
        this.addField({
            name: "overwrite",
            type: "boolean",
            description:
                "Indica se deve sobrescrever o arquivo caso ele já exista. Padrão: false.",
        });
        this.addField({
            name: "encoding",
            type: "string",
            description:
                "A codificação a ser usada ao escrever o arquivo. Padrão: 'utf8'.",
        });
        this.addField({
            name: "append",
            type: "boolean",
            description:
                "Indica se deve adicionar o conteúdo ao final do arquivo existente. Padrão: false.",
        });
        this.addField({
            name: "mode",
            type: "number",
            description:
                "As permissões do arquivo a serem definidas. Padrão: 0o644 (leitura/escrita para o proprietário, leitura para grupo e outros).",
        });
    }

    async run(arg: any): Promise<string> {
        const objArgs: WriteFileToolArgs = JSON.parse(arg);
        Logger.toolSaid(this.name, `Executando com os seguintes argumentos: ${JSON.stringify(objArgs)}`);

        const {
            filePath,
            content,
            createDirectory = true,
            overwrite = false,
            encoding = "utf8",
            append = false,
            mode = 0o644,
        } = objArgs;

        if (!filePath || !content) {
            Logger.error(
                "[WriteFileTool] Argumentos 'filePath' e 'content' são obrigatórios."
            );
            throw new Error("Argumentos 'filePath' e 'content' são obrigatórios.");
        }

        return await this.writeToFile(
            filePath,
            content,
            createDirectory,
            overwrite,
            encoding,
            append,
            mode
        );
    }

    async writeToFile(
        filePath: string,
        content: string,
        createDirectory: boolean,
        overwrite: boolean,
        encoding: BufferEncoding,
        append: boolean,
        mode: number
    ): Promise<string> {
        try {
            let fullPath = filePath;

            if (this.baseDirectory) {
                fullPath = path.resolve(this.baseDirectory, filePath);
                if (!fullPath.startsWith(path.resolve(this.baseDirectory))) {
                    throw new Error(
                        "Tentativa de escrita fora do diretório base não é permitida."
                    );
                }
            }

            if (createDirectory) {
                const dir = path.dirname(fullPath);
                await fs.mkdir(dir, {recursive: true});
                Logger.debug(`[WriteFileTool] Diretório garantido: ${dir}`);
            }

            try {
                if (
                    !overwrite &&
                    !append &&
                    (await fs.stat(fullPath)).isFile()
                ) {
                    Logger.warn(
                        `[WriteFileTool] O arquivo ${fullPath} já existe e 'overwrite' está definido como false. Operação ignorada.`
                    );
                    return `O arquivo ${fullPath} já existe e 'overwrite' está definido como false. Operação ignorada.`;
                }
            } catch (err: any) {
                if (err.code !== "ENOENT") {
                    throw err;
                }
            }

            const flags = append ? "a" : overwrite ? "w" : "wx";

            await fs.writeFile(fullPath, content, {encoding, flag: flags, mode});
            Logger.info(`[WriteFileTool] Arquivo escrito com sucesso em ${fullPath}`);
            return `Arquivo escrito com sucesso em ${fullPath}`;
        } catch (error: any) {
            Logger.error(
                `[WriteFileTool] Erro ao escrever no arquivo: ${error.message}`
            );
            return `Erro ao escrever no arquivo: ${error.message}`;
        }
    }
}
