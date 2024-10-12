import {Tool} from "botlandia/core/tools";
import {Logger} from "botlandia/utils/logger";


interface DateTimeToolArgs {
    format?: "date" | "time" | "full";
    help?: "help";
}

export class DateTimeTool extends Tool {
    static UUID = "fa16438f-a603-40dc-bb8c-b4e7f0ee82fa";

    constructor() {
        super(
            DateTimeTool.UUID,
            "DateTimeTool",
            "Esta ferramenta fornece a data e/ou hora atual."
        );
        this.addField({
            name: "format",
            type: "string",
            description:
                "O formato desejado ('date', 'time' ou 'full'). Padrão é 'full'.",
        });
    }

    /**
     * Executa a ferramenta com os argumentos fornecidos.
     * @param arg String JSON contendo 'format' e/ou 'help'.
     * @returns Uma promessa que resolve com a data/hora ou com a mensagem de ajuda, ou rejeita com um erro.
     */
    async run(arg: any): Promise<string> {
        Logger.toolSaid(this.name, `[DateTimeTool] Executando com estes argumentos: ${arg}`);

        let objArgs: DateTimeToolArgs;
        try {
            objArgs = JSON.parse(arg);
            if (objArgs && objArgs?.help) {
                return this.help();
            }
        } catch (error) {
            Logger.error("[DateTimeTool] Entrada JSON inválida.");
            throw new Error("Formato de entrada inválido. Esperado uma string JSON.");
        }

        const format = objArgs.format || "full";
        const dateTimeNow = new Date();

        switch (format) {
            case "date":
                Logger.toolSaid(this.name, "Retornando data.");
                return dateTimeNow.toLocaleDateString();
            case "time":
                Logger.toolSaid(this.name, "Retornando hora.");
                return dateTimeNow.toLocaleTimeString();
            case "full":
                Logger.toolSaid(this.name, "Retornando data e hora completas.");
                return `${dateTimeNow.toLocaleDateString()} ${dateTimeNow.toLocaleTimeString()}`;
            default:
                Logger.error(
                    `[DateTimeTool] Formato inválido: ${format}. Deve ser 'date', 'time' ou 'full'.`
                );
                throw new Error(
                    `Formato inválido: ${format}. Deve ser 'date', 'time' ou 'full'.`
                );
        }
    }

    /**
     * Retorna a mensagem de ajuda para a ferramenta.
     * @returns Uma string contendo instruções de uso.
     */
    help(): string {
        return `Ajuda do DateTimeTool:
- format: O formato da saída. Pode ser 'date', 'time' ou 'full'. Padrão é 'full'.
  Exemplos:
    - '{"format": "date"}' -> Retorna apenas a data.
    - '{"format": "time"}' -> Retorna apenas a hora.
    - '{"format": "full"}' -> Retorna data e hora.
- help: Exibe esta mensagem de ajuda.
  Exemplo:
    - '{"help": "help"}' -> Exibe a ajuda do DateTimeTool.
Se nenhum argumento for fornecido, 'full' será usado como padrão.`;
    }
}
