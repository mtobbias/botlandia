import path from "path";
import fs from "fs";
import {Tool} from "botlandia/core/tools";
import {Logger} from "botlandia/lib/logger";
import Datastore from "nedb";

/**
 * Interface para os argumentos da MemoryTool.
 */
interface MemoryToolArgs {
    action: "save" | "load" | "help";
    key?: string;
    agent_name: string;
    value?: string; // Necessário apenas para a ação 'save'
    collection?: "user" | "agent"; // Opcional para 'help'
}

/**
 * Interface para os documentos armazenados nas coleções.
 */
interface MemoryEntry {
    key: string;
    value: string;
}

/**
 * Classe MemoryTool para gerenciar a memória da IA utilizando NeDB.
 */
export class MemoryTool extends Tool {
    static UUID = "dbdfe7d1-6007-44be-beda-f43f58687b93";

    private userDB: Datastore<MemoryEntry> | null = null;
    private agentDB: Datastore<MemoryEntry> | null = null;

    constructor() {
        super(
            MemoryTool.UUID,
            "MemoryTool",
            `
            Gerencia a memória da IA salvando e recuperando pares chave-valor em coleções específicas utilizando o NeDB.
            Use "save" para armazenar dados e "load" para recuperar dados por chave.
            `
        );
        this.addField({
            name: "agent_name",
            type: "string",
            description: "O nome do agente que possui a memória",
        });
        this.addField({
            name: "action",
            type: "string",
            description: "A ação a ser executada ('save', 'load' ou 'help').",
        });
        this.addField({
            name: "value",
            type: "string",
            description: "O valor a ser armazenado (necessário para a ação 'save').",
        });
        this.addField({
            name: "collection",
            type: "string",
            description: "A coleção da memória ('user' ou 'agent').",
        });
    }

    /**
     * Inicializa as coleções de banco de dados NeDB para 'user' e 'agent'.
     * @param agent_name Nome do agente para identificar o arquivo de banco de dados.
     * @returns Um objeto contendo as instâncias dos datastores para 'user' e 'agent'.
     */
    private initializeDB(agent_name: string): { userDB: Datastore<MemoryEntry>; agentDB: Datastore<MemoryEntry> } {
        if (this.userDB && this.agentDB) {
            return {userDB: this.userDB, agentDB: this.agentDB};
        }

        const dbDir = `${process.env.PATH_DATA || "."}${path.sep}agents`;
        fs.mkdirSync(dbDir, {recursive: true});

        const userDBPath = path.join(dbDir, `${agent_name.toLowerCase()}_user.db`);
        const agentDBPath = path.join(dbDir, `${agent_name.toLowerCase()}_agent.db`);

        const userDB = new Datastore<MemoryEntry>({filename: userDBPath, autoload: true});
        const agentDB = new Datastore<MemoryEntry>({filename: agentDBPath, autoload: true});

        // Garantir que a chave seja única dentro de cada coleção
        userDB.ensureIndex({fieldName: "key", unique: true}, (err) => {
            if (err) {
                Logger.error(`[MemoryTool] Erro ao criar índice na coleção 'user': ${err.message}`);
            }
        });

        agentDB.ensureIndex({fieldName: "key", unique: true}, (err) => {
            if (err) {
                Logger.error(`[MemoryTool] Erro ao criar índice na coleção 'agent': ${err.message}`);
            }
        });

        this.userDB = userDB;
        this.agentDB = agentDB;

        return {userDB, agentDB};
    }

    /**
     * Executa a ação solicitada com base nos argumentos fornecidos.
     * @param arg Argumentos para a ação em formato JSON ou objeto.
     * @returns Resultado da ação executada.
     */
    async run(arg: any): Promise<any> {
        let objArgs: MemoryToolArgs;

        try {
            objArgs = typeof arg === 'string' ? JSON.parse(arg) : arg;
        } catch (error) {
            Logger.error("[MemoryTool] Erro ao analisar os argumentos.");
            throw new Error("Formato de argumentos inválido. Os argumentos devem ser um JSON válido.");
        }

        Logger.toolSaid(this.name, `  Executando com os argumentos: ${JSON.stringify(objArgs)}`);

        const {action, value, agent_name, collection} = objArgs;
        const key = 'MEMORY'
        if (!action || !agent_name) {
            Logger.error("[MemoryTool] Argumentos obrigatórios faltando: 'action' ou 'agent_name'.");
            throw new Error("Argumentos obrigatórios faltando: 'action' e 'agent_name' são necessários.");
        }

        if (action === "help") {
            return this.help();
        }

        if (!collection) {
            Logger.error("[MemoryTool] Argumento obrigatório faltando: 'collection'.");
            throw new Error("Argumento obrigatório faltando: 'collection' é necessário.");
        }

        if (!["user", "agent"].includes(collection)) {
            Logger.error(`[MemoryTool] Coleção inválida: ${collection}. Use 'user' ou 'agent'.`);
            throw new Error("Coleção inválida. Use 'user' ou 'agent'.");
        }

        // Inicializa os bancos de dados
        const {userDB, agentDB} = this.initializeDB(agent_name);
        const db = collection === "user" ? userDB : agentDB;

        try {
            switch (action) {
                case "save":
                    if (!key || !value) {
                        throw new Error("Argumentos obrigatórios faltando para 'save': 'key' e 'value' são necessários.");
                    }
                    await this.saveMemory(db, key, value);
                    Logger.toolSaid(this.name, ` Memória salva com sucesso na coleção '${collection}': [${key}] -> ${value}`);
                    return `Memória salva na coleção '${collection}': [${key}] -> ${value}`;

                case "load":
                    if (!key) {
                        throw new Error("Argumento obrigatório faltando para 'load': 'key' é necessário.");
                    }
                    const result = await this.loadMemory(db, key);
                    Logger.toolSaid(this.name, `  Memória carregada com sucesso na coleção '${collection}': [${key}] -> ${result}`);
                    return result || `Nenhuma memória encontrada para a chave: ${key} na coleção: ${collection}`;

                default:
                    throw new Error("Ação inválida. Use 'save' ou 'load'.");
            }
        } catch (error: any) {
            Logger.error(`[MemoryTool] Erro: ${error.message}`);
            throw new Error(`Erro: ${error.message}`);
        }
    }

    /**
     * Salva uma entrada de memória na coleção especificada.
     * @param db Instância do datastore NeDB.
     * @param key Chave para identificar a entrada.
     * @param value Valor a ser armazenado.
     */
    private saveMemory(db: Datastore<MemoryEntry>, key: string, value: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const entry: MemoryEntry = {key, value};
            db.update(
                {key: key},
                entry,
                {upsert: true},
                (err, numAffected, affectedDocuments) => {
                    if (err) {
                        Logger.error(`[MemoryTool] Erro ao salvar memória: ${err.message}`);
                        reject(err);
                    } else {
                        resolve();
                    }
                }
            );
        });
    }

    /**
     * Carrega uma entrada de memória da coleção especificada.
     * @param db Instância do datastore NeDB.
     * @param key Chave para identificar a entrada.
     * @returns Valor associado à chave ou null se não encontrado.
     */
    private loadMemory(db: Datastore<MemoryEntry>, key: string): Promise<string | null> {
        return new Promise<string | null>((resolve, reject) => {
            db.findOne({key: key}, (err, doc) => {
                if (err) {
                    Logger.error(`[MemoryTool] Erro ao carregar memória: ${err.message}`);
                    reject(err);
                } else {
                    resolve(doc ? doc.value : null);
                }
            });
        });
    }

    /**
     * Fornece uma mensagem de ajuda detalhada sobre como usar a ferramenta.
     * @returns Mensagem de ajuda em formato de string.
     */
    public help(): string {
        return `
**MemoryTool Help**

Esta ferramenta gerencia a memória da IA salvando e recuperando pares chave-valor em coleções específicas utilizando o NeDB.

**Ações Disponíveis:**

- **save**: Salva um valor com uma chave na coleção especificada.
  - **Campos obrigatórios**: \`action\`, \`agent_name\`, \`collection\`, \`key\`, \`value\`.
  - **Exemplo**:
    \`\`\`json
    {
      "action": "save",
      "agent_name": "Iara",
      "collection": "user",
      "key": "user_email",
      "value": "joao@example.com"
    }
    \`\`\`

- **load**: Carrega um valor especificando sua chave na coleção especificada.
  - **Campos obrigatórios**: \`action\`, \`agent_name\`, \`collection\`, \`key\`.
  - **Exemplo**:
    \`\`\`json
    {
      "action": "load",
      "agent_name": "Iara",
      "collection": "user",
      "key": "user_email"
    }
    \`\`\`

- **help**: Exibe esta mensagem de ajuda.
  - **Campos obrigatórios**: \`action\`, \`agent_name\`.
  - **Exemplo**:
    \`\`\`json
    {
      "action": "help",
      "agent_name": "Iara"
    }
    \`\`\`

**Coleções Disponíveis:**

- **user**: Para informações relacionadas ao usuário.
- **agent**: Para informações relacionadas à assistente.

**Observações:**

- Certifique-se de fornecer todos os campos obrigatórios para a ação desejada.
- O campo \`agent_name\` é sempre obrigatório e deve corresponder ao nome do agente que possui a memória.
- Os campos devem ser passados em formato JSON válido.
- Em caso de erro, verifique se os campos estão corretos e tente novamente.
`;
    }
}
