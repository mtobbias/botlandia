// src/dbUtil.ts
import sqlite3 from 'sqlite3';
import {v4 as uuidv4} from 'uuid';
import path from 'path';
import {Logger} from "botlandia/utils/logger";

sqlite3.verbose();

// src/interfaces.ts
export interface Item {
    uuid: string;
    name: string;
    description: string;
    enable: boolean;
}

export class ToolsMemory {
    private db: sqlite3.Database;
    constructor() {
        const dbFilePath = path.join(
            process.env.BOTLANDIA_BACKEND_DATA || ".", `tools.db`
        );
        this.db = new sqlite3.Database(dbFilePath, (err: Error | null) => {
            if (err) {
                console.error('Erro ao conectar ao banco de dados:',dbFilePath, err.message);
            } else {
                console.log('Conectado ao banco de dados SQLite.',dbFilePath);
                this.createTable();
            }
        });
    }

    /**
     * Cria a tabela se não existir.
     */
    private createTable(): void {
        const sql = `
            CREATE TABLE IF NOT EXISTS items (
                uuid TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                enable INTEGER NOT NULL DEFAULT 1
            )
        `;
        this.db.run(sql, (err: Error | null) => {
            if (err) {
                Logger.error('Erro ao criar tabela:', err.message);
            } else {
                Logger.info('Tabela "items" pronta.');
            }
        });
    }

    /**
     * Adiciona um novo item à tabela.
     * @param uuid uuid do item.
     * @param name Nome do item.
     * @param description Descrição do item.
     * @param enable Status do item.
     * @returns Promessa que resolve com o UUID do novo item.
     */
    addItem(uuid:string, name: string, description: string, enable: boolean = false): Promise<string> {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO items (uuid, name, description, enable) VALUES (?, ?, ?, ?)`;
            const params: [string, string, string, number] = [uuid, name, description, enable ? 1 : 0];
            this.db.run(sql, params, function (err: Error | null) {
                if (err) {
                    console.error('Erro ao adicionar item:', err.message);
                    reject(err);
                } else {
                    resolve(uuid);
                }
            });
        });
    }

    /**
     * Recupera um item pelo UUID.
     * @param uuid UUID do item.
     * @returns Promessa que resolve com o item encontrado ou undefined.
     */
    getItem(uuid: string): Promise<Item | undefined> {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM items WHERE uuid = ?`;
            this.db.get(sql, [uuid], (err: Error | null, row: any) => {
                if (err) {
                    console.error('Erro ao recuperar item:', err.message);
                    reject(err);
                } else {
                    if (row) {
                        const item: Item = {
                            uuid: row.uuid,
                            name: row.name,
                            description: row.description,
                            enable: row.enable === 1
                        };
                        resolve(item);
                    } else {
                        resolve(undefined);
                    }
                }
            });
        });
    }

    /**
     * Atualiza um item existente.
     * @param uuid UUID do item a ser atualizado.
     * @param updates Objeto contendo os campos a serem atualizados.
     * @returns Promessa que resolve quando a atualização é concluída.
     */
    updateItem(uuid: string, updates: Partial<Omit<Item, 'uuid'>>): Promise<void> {
        return new Promise((resolve, reject) => {
            const fields: string[] = [];
            const params: any[] = [];

            if (updates.name !== undefined) {
                fields.push('name = ?');
                params.push(updates.name);
            }
            if (updates.description !== undefined) {
                fields.push('description = ?');
                params.push(updates.description);
            }
            if (updates.enable !== undefined) {
                fields.push('enable = ?');
                params.push(updates.enable ? 1 : 0);
            }

            if (fields.length === 0) {
                resolve();
                return;
            }

            const sql = `UPDATE items SET ${fields.join(', ')} WHERE uuid = ?`;
            params.push(uuid);

            this.db.run(sql, params, function (err: Error | null) {
                if (err) {
                    console.error('Erro ao atualizar item:', err.message);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Remove um item pelo UUID.
     * @param uuid UUID do item a ser removido.
     * @returns Promessa que resolve quando a deleção é concluída.
     */
    deleteItem(uuid: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM items WHERE uuid = ?`;
            this.db.run(sql, [uuid], function (err: Error | null) {
                if (err) {
                    console.error('Erro ao deletar item:', err.message);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Recupera todos os itens.
     * @returns Promessa que resolve com uma lista de itens.
     */
    getAllItems(): Promise<Item[]> {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM items`;
            this.db.all(sql, [], (err: Error | null, rows: any[]) => {
                if (err) {
                    console.error('Erro ao recuperar itens:', err.message);
                    reject(err);
                } else {
                    const items: Item[] = rows.map(row => ({
                        uuid: row.uuid,
                        name: row.name,
                        description: row.description,
                        enable: row.enable === 1
                    }));
                    resolve(items);
                }
            });
        });
    }

    /**
     * Fecha a conexão com o banco de dados.
     */
    close(): void {
        this.db.close((err: Error | null) => {
            if (err) {
                console.error('Erro ao fechar a conexão com o banco de dados:', err.message);
            } else {
                console.log('Conexão com o banco de dados fechada.');
            }
        });
    }
}
