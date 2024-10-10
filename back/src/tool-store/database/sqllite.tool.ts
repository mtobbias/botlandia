import sqlite3 from "sqlite3";
import path from "path";
import { Tool } from "botlandia/core/tools";
import { Logger } from "botlandia/utils/logger";

interface SqliteToolArgs {
    action: "execute" | "query";
    dbName: string;
    sql: string;
}

export class SqliteTool extends Tool {
    static UUID = "2ef69b23-93e6-43dd-acfc-6215ec109585";

    constructor() {
        super(
            SqliteTool.UUID,
            "SqliteTool",
            `
                Executa consultas ou comandos SQL em um banco de dados SQLite.
                Forneça o nome do banco de dados e a instrução SQL como argumentos.
            `
        );
        this.addField({
            name: "action",
            type: "string",
            description:
                "Ação a ser realizada ('execute' para comandos, 'query' para consultas)",
        });
        this.addField({
            name: "dbName",
            type: "string",
            description: "O nome do arquivo do banco de dados SQLite (sem extensão)",
        });
        this.addField({
            name: "sql",
            type: "string",
            description: "A instrução SQL a ser executada",
        });
    }

    /**
     * Executa a ação especificada ('execute' ou 'query') com os argumentos fornecidos.
     * @param arg String JSON contendo 'action', 'dbName' e 'sql'.
     * @returns Uma promessa que resolve com o resultado da operação ou rejeita com um erro.
     */
    async run(arg: string): Promise<any> {
        const objArgs: SqliteToolArgs = JSON.parse(arg);
        Logger.toolSaid(this.name, ` Executando com os argumentos: ${JSON.stringify(objArgs)}`);

        const { action, dbName, sql } = objArgs;

        if (!action || !dbName || !sql) {
            Logger.error("[SqliteTool] Argumentos obrigatórios ausentes.");
            throw new Error("Faltando argumentos obrigatórios: 'action', 'dbName' ou 'sql'.");
        }

        const dbFilePath = path.join(
            process.env.PATH_DATA || ".",
            `${dbName.toLowerCase()}.db`
        );

        let result: any;
        try {
            switch (action) {
                case "execute":
                    await this.executeCommand(dbFilePath, sql);
                    Logger.toolSaid(this.name, ` Comando executado com sucesso: ${sql}`);
                    result = `Comando executado com sucesso: ${sql}`;
                    break;
                case "query":
                    result = await this.executeQuery(dbFilePath, sql);
                    Logger.toolSaid(this.name, ` Consulta executada com sucesso: ${sql}`);
                    break;
                default:
                    Logger.error(`[SqliteTool] Ação inválida: ${action}`);
                    throw new Error(`Ação inválida: ${action}`);
            }
            return result;
        } catch (error: any) {
            Logger.error(`[SqliteTool] Erro ao executar SQL: ${error.message}`);
            throw new Error(`Erro ao executar SQL: ${error.message}`);
        }
    }

    /**
     * Executa um comando SQL (como INSERT, UPDATE, DELETE) no banco de dados especificado.
     * @param dbFilePath Caminho do arquivo do banco de dados SQLite.
     * @param sql A instrução SQL a ser executada.
     * @returns Uma promessa que resolve quando o comando é executado com sucesso ou rejeita com um erro.
     */
    private executeCommand(dbFilePath: string, sql: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const db = new sqlite3.Database(dbFilePath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
                if (err) {
                    Logger.error(`[SqliteTool] Erro ao abrir o banco de dados: ${err.message}`);
                    reject(err);
                    return;
                }
                db.run(sql, function (err) {
                    if (err) {
                        Logger.error(`[SqliteTool] Erro ao executar o comando: ${err.message}`);
                        reject(err);
                    } else {
                        Logger.debug(` Alterações: ${this.changes}`);
                        resolve();
                    }
                    db.close();
                });
            });
        });
    }

    /**
     * Executa uma consulta SQL (como SELECT) no banco de dados especificado.
     * @param dbFilePath Caminho do arquivo do banco de dados SQLite.
     * @param sql A instrução SQL a ser executada.
     * @returns Uma promessa que resolve com os resultados da consulta ou rejeita com um erro.
     */
    private executeQuery(dbFilePath: string, sql: string): Promise<any[]> {
        return new Promise<any[]>((resolve, reject) => {
            const db = new sqlite3.Database(dbFilePath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
                if (err) {
                    Logger.error(`[SqliteTool] Erro ao abrir o banco de dados: ${err.message}`);
                    reject(err);
                    return;
                }

                db.all(sql, (err, rows) => {
                    if (err) {
                        Logger.error(`[SqliteTool] Erro ao executar a consulta: ${err.message}`);
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                    db.close();
                });
            });
        });
    }
}
