// @ts-ignore
import {createConnection, Connection} from "mysql2/promise";
import {Tool} from "botlandia/core/tools";
import {Logger} from "botlandia/lib/logger";

interface MySQLAdminToolArgs {
    action:
        | "createDatabase"
        | "dropDatabase"
        | "createTable"
        | "dropTable"
        | "createUser"
        | "deleteUser"
        | "insertOne";
    host: string;
    port: number;
    rootUser: string;
    rootPassword: string;
    databaseName?: string;
    tableName?: string;
    userName?: string;
    userPassword?: string;
    privileges?: string; // Alterado para string com separador
    columns?: string; // JSON string para definição de colunas
    document?: Record<string, any>;
}

export class MySQLAdminTool extends Tool {
    static UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

    constructor() {
        super(
            MySQLAdminTool.UUID,
            "MySQLAdminTool",
            `
            Realiza tarefas administrativas em um banco de dados MySQL.
            Permite criar e remover bancos de dados e tabelas,
            gerenciar usuários (criar e deletar) e inserir registros.
          `
        );

        this.addField({
            name: "action",
            type: "string",
            description:
                "A ação administrativa a ser executada ('createDatabase', 'dropDatabase', 'createTable', 'dropTable', 'createUser', 'deleteUser', 'insertOne')",
        });
        this.addField({
            name: "host",
            type: "string",
            description:
                "O host do MySQL (e.g., 'localhost')",
        });
        this.addField({
            name: "port",
            type: "number",
            description:
                "A porta do MySQL (e.g., 3306)",
        });
        this.addField({
            name: "rootUser",
            type: "string",
            description:
                "O nome de usuário root do MySQL para autenticação",
        });
        this.addField({
            name: "rootPassword",
            type: "string",
            description:
                "A senha do usuário root do MySQL para autenticação",
        });
        this.addField({
            name: "databaseName",
            type: "string",
            description:
                "O nome do banco de dados a ser usado (necessário para todas as ações, exceto 'createDatabase')",
        });
        this.addField({
            name: "tableName",
            type: "string",
            description:
                "O nome da tabela a ser manipulada (necessário para 'createTable', 'dropTable' e 'insertOne')",
        });
        this.addField({
            name: "userName",
            type: "string",
            description:
                "O nome do usuário a ser criado ou deletado (necessário para 'createUser' e 'deleteUser')",
        });
        this.addField({
            name: "userPassword",
            type: "string",
            description:
                "A senha para o novo usuário (necessário para 'createUser')",
        });
        this.addField({
            name: "privileges",
            type: "string",
            description:
                "Uma lista separada por vírgulas de privilégios para o novo usuário (para 'createUser'). Exemplo: 'SELECT,INSERT,UPDATE'",
        });
        this.addField({
            name: "columns",
            type: "string",
            description:
                "Definição das colunas da tabela em formato JSON (necessário para 'createTable'). Exemplo: '{\"id\": \"INT PRIMARY KEY AUTO_INCREMENT\", \"name\": \"VARCHAR(255)\"}'",
        });
        this.addField({
            name: "document",
            type: "object",
            description: "O registro a ser inserido (necessário para 'insertOne' ação)",
        });
    }

    async run(arg: any): Promise<any> {
        const objArgs: MySQLAdminToolArgs = JSON.parse(arg);
        Logger.toolSaid(this.name,` Executando com os argumentos: ${JSON.stringify(objArgs)}`
        );

        const {
            action,
            host,
            port,
            rootUser,
            rootPassword,
            databaseName,
            tableName,
            userName,
            userPassword,
            privileges,
            columns,
            document,
        } = objArgs;

        if (!action || !host || !port || !rootUser || !rootPassword) {
            Logger.error(
                "[MySQLAdminTool] Parâmetros obrigatórios faltando: 'action', 'host', 'port', 'rootUser' ou 'rootPassword'."
            );
            throw new Error(
                "Parâmetros obrigatórios faltando: 'action', 'host', 'port', 'rootUser' ou 'rootPassword'."
            );
        }

        let connection: Connection;

        try {
            connection = await createConnection({
                host,
                port,
                user: rootUser,
                password: rootPassword,
                multipleStatements: true,
            });

            let result: string;

            switch (action) {
                case "createDatabase":
                    if (!databaseName) {
                        throw new Error(
                            "O nome do banco de dados é necessário para a ação 'createDatabase'."
                        );
                    }
                    await connection.query(`CREATE DATABASE \`${databaseName}\`;`);
                     Logger.toolSaid(this.name,` Banco de dados '${databaseName}' criado com sucesso.`
                    );
                    result = `Banco de dados '${databaseName}' criado com sucesso.`;
                    break;

                case "dropDatabase":
                    if (!databaseName) {
                        throw new Error(
                            "O nome do banco de dados é necessário para a ação 'dropDatabase'."
                        );
                    }
                    await connection.query(`DROP DATABASE \`${databaseName}\`;`);
                     Logger.toolSaid(this.name,` Banco de dados '${databaseName}' removido com sucesso.`
                    );
                    result = `Banco de dados '${databaseName}' removido com sucesso.`;
                    break;

                case "createTable":
                    if (!databaseName || !tableName || !columns) {
                        throw new Error(
                            "Nome do banco de dados, nome da tabela e definição das colunas são necessários para a ação 'createTable'."
                        );
                    }
                    await connection.query(`USE \`${databaseName}\`;`);
                    await connection.query(`CREATE TABLE \`${tableName}\` (${columns});`);
                     Logger.toolSaid(this.name,` Tabela '${tableName}' criada com sucesso no banco de dados '${databaseName}'.`
                    );
                    result = `Tabela '${tableName}' criada com sucesso no banco de dados '${databaseName}'.`;
                    break;

                case "dropTable":
                    if (!databaseName || !tableName) {
                        throw new Error(
                            "Nome do banco de dados e nome da tabela são necessários para a ação 'dropTable'."
                        );
                    }
                    await connection.query(`USE \`${databaseName}\`;`);
                    await connection.query(`DROP TABLE \`${tableName}\`;`);
                     Logger.toolSaid(this.name,` Tabela '${tableName}' removida com sucesso do banco de dados '${databaseName}'.`
                    );
                    result = `Tabela '${tableName}' removida com sucesso do banco de dados '${databaseName}'.`;
                    break;

                case "createUser":
                    if (!userName || !userPassword || !privileges || !databaseName) {
                        throw new Error(
                            "Nome de usuário, senha, privilégios e nome do banco de dados são necessários para a ação 'createUser'."
                        );
                    }
                    const privilegesList = privileges.split(",").map(priv => priv.trim()).join(", ");
                    await connection.query(
                        `CREATE USER '${userName}'@'%' IDENTIFIED BY '${userPassword}';`
                    );
                    await connection.query(
                        `GRANT ${privilegesList} ON \`${databaseName}\`.* TO '${userName}'@'%';`
                    );
                    await connection.query(`FLUSH PRIVILEGES;`);
                     Logger.toolSaid(this.name,` Usuário '${userName}' criado com sucesso com privilégios: ${privilegesList} no banco de dados '${databaseName}'.`
                    );
                    result = `Usuário '${userName}' criado com sucesso com privilégios: ${privilegesList} no banco de dados '${databaseName}'.`;
                    break;

                case "deleteUser":
                    if (!userName) {
                        throw new Error(
                            "Nome de usuário é necessário para a ação 'deleteUser'."
                        );
                    }
                    await connection.query(`DROP USER '${userName}'@'%';`);
                    await connection.query(`FLUSH PRIVILEGES;`);
                     Logger.toolSaid(this.name,` Usuário '${userName}' removido com sucesso.`
                    );
                    result = `Usuário '${userName}' removido com sucesso.`;
                    break;

                case "insertOne":
                    if (!databaseName || !tableName || !document) {
                        throw new Error(
                            "Nome do banco de dados, nome da tabela e documento são necessários para a ação 'insertOne'."
                        );
                    }
                    await connection.query(`USE \`${databaseName}\`;`);
                    const columnsKeys = Object.keys(document).map(col => `\`${col}\``).join(", ");
                    const placeholders = Object.keys(document).map(() => "?").join(", ");
                    const values = Object.values(document);
                    const insertQuery = `INSERT INTO \`${tableName}\` (${columnsKeys}) VALUES (${placeholders});`;
                    const [insertResult] = await connection.execute(insertQuery, values);
                     Logger.toolSaid(this.name,` Registro inserido com sucesso na tabela '${tableName}' no banco de dados '${databaseName}'. ID Inserido: ${(insertResult as any).insertId}`
                    );
                    result = `Registro inserido com sucesso na tabela '${tableName}' no banco de dados '${databaseName}'. ID Inserido: ${(insertResult as any).insertId}`;
                    break;

                default:
                    Logger.error(`[MySQLAdminTool] Ação inválida: ${action}`);
                    throw new Error(`Ação inválida: ${action}`);
            }

             Logger.toolSaid(this.name,` Operação '${action}' realizada com sucesso.`);
            return result;
        } catch (error: any) {
            Logger.error(`[MySQLAdminTool] Erro: ${error.message}`);
            throw new Error(`MySQLAdminTool Erro: ${error.message}`);
        } finally {
            if (connection && connection.end) {
                await connection.end();
                Logger.toolSaid(this.name,` Conexão com o MySQL fechada.`);
            }
        }
    }
}
