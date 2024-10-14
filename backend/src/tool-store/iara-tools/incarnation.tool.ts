import sqlite3 from "sqlite3";
import path from "path";
import { Tool } from "botlandia/core/tools";
import { Logger } from "botlandia/utils/logger";

interface IncarnationsToolArgs {
    action: "create" | "read" | "update" | "delete" | "delete-all" | "list";
    role?: string;
    name?: string;
    description?: string;
    active?: boolean;
}

export class IncarnationsTool extends Tool {
    static UUID = "e4f6c2d3-8a1b-4f5c-9d6e-2b3c4d5e6f7a"; // UUID único para a ferramenta

    constructor() {
        super(
            IncarnationsTool.UUID,
            "acrd de Perfis de Agentes de Atendimento",
            `
            Ferramenta permite gerenciar perfis de agentes utilizados no atendimento via WhatsApp.
            Com esta ferramenta, você pode executar as seguintes ações:
                - create: Criar um novo perfil.
                - read: Ler informações de um perfil.
                - update: Atualizar informações de um perfil.
                - delete: Excluir um perfil.
                - delete-all: Excluir todos os perfis de agentes.
                - list: Listar todos os perfis.

            Cada perfil de agente contém as seguintes informações:
                - role (Função ou cargo atribuído ao agente, por exemplo, "Atendente", "Supervisor").
                - name (Nome do agente, preferencialmente um nome feminino comum no Brasil).
                - description (Descrição detalhada das responsabilidades e funções do agente).
                - active (Indica se o perfil está ativo. Apenas um perfil pode estar ativo por vez).
            `
        );
        this.addField({
            name: "action",
            type: "string",
            description: "Ação a ser realizada. Valores permitidos: 'create', 'read', 'update', 'delete', 'delete-all', 'list'.",
        });
        this.addField({
            name: "role",
            type: "string",
            description: "Função ou cargo do agente, definindo suas responsabilidades dentro do atendimento.",
        });
        this.addField({
            name: "name",
            type: "string",
            description: "Nome do agente. Recomenda-se utilizar um nome feminino comum no Brasil para melhor identificação.",
        });
        this.addField({
            name: "description",
            type: "string",
            description: "Descrição detalhada das funções e responsabilidades do agente.",
        });
        this.addField({
            name: "active",
            type: "boolean",
            description: "Indica se o perfil está ativo.",
        });
    }

    async run(arg: string): Promise<any> {
        const objArgs: IncarnationsToolArgs = JSON.parse(arg);
        Logger.toolSaid(this.name, `Executando com os argumentos: ${JSON.stringify(objArgs)}`);

        const { action, role, name, description, active } = objArgs;

        if (!action) {
            Logger.error("[IncarnationsTool] Argumento obrigatório ausente: 'action'.");
            throw new Error("Argumento obrigatório ausente: 'action'.");
        }

        const dbFilePath = path.join(
            process.env.BOTLANDIA_BACKEND_DATA || ".", `incarnations.db`
        );

        try {
            switch (action) {
                case "create":
                    if (!name || !role || !description) {
                        Logger.error("[IncarnationsTool] Os campos 'name', 'role' e 'description' são necessários para criação.");
                        throw new Error("Para a ação 'create', os campos 'name', 'role' e 'description' são necessários.");
                    }
                    await this.createProfile(dbFilePath, { role, name, description, active });
                    Logger.toolSaid(this.name, `Perfil criado com sucesso para: ${name}`);
                    return `Perfil criado com sucesso para: ${name}`;
                case "read":
                    if (!name) {
                        // Se 'name' não for fornecido, ler o perfil ativo
                        const profile = await this.readActiveProfile(dbFilePath);
                        if (profile) {
                            Logger.toolSaid(this.name, `Perfil ativo lido com sucesso.`);
                            return profile;
                        } else {
                            Logger.toolSaid(this.name, `Nenhum perfil ativo encontrado.`);
                            return `Nenhum perfil ativo encontrado.`;
                        }
                    } else {
                        const profile = await this.readProfile(dbFilePath, name);
                        if (profile) {
                            Logger.toolSaid(this.name, `Perfil lido com sucesso para: ${name}`);
                            return JSON.stringify(profile);
                        } else {
                            Logger.toolSaid(this.name, `Perfil não encontrado para: ${name}`);
                            return `Perfil não encontrado para: ${name}`;
                        }
                    }
                case "update":
                    if (!name) {
                        Logger.error("[IncarnationsTool] O campo 'name' é necessário para atualização.");
                        throw new Error("Para a ação 'update', o campo 'name' é necessário.");
                    }
                    await this.updateProfile(dbFilePath, { role, name, description, active });
                    Logger.toolSaid(this.name, `Perfil atualizado com sucesso para: ${name}`);
                    return `Perfil atualizado com sucesso para: ${name}`;
                case "delete":
                    if (!name) {
                        Logger.error("[IncarnationsTool] O campo 'name' é necessário para exclusão.");
                        throw new Error("Para a ação 'delete', o campo 'name' é necessário.");
                    }
                    await this.deleteProfile(dbFilePath, name);
                    Logger.toolSaid(this.name, `Perfil excluído com sucesso para: ${name}`);
                    return `Perfil excluído com sucesso para: ${name}`;
                case "delete-all":
                    await this.deleteAllProfiles(dbFilePath);
                    Logger.toolSaid(this.name, `Todos os perfis foram excluídos com sucesso.`);
                    return `Todos os perfis foram excluídos com sucesso.`;
                case "list":
                    const profiles = await this.listProfiles(dbFilePath);
                    Logger.toolSaid(this.name, `Listagem de perfis realizada com sucesso.`);
                    return JSON.stringify(profiles);
                default:
                    Logger.error(`[IncarnationsTool] Ação inválida: ${action}`);
                    throw new Error(`Ação inválida: ${action}`);
            }
        } catch (error: any) {
            Logger.error(`[IncarnationsTool] Erro ao executar operação: ${error.message}`);
            throw new Error(`Erro ao executar operação: ${error.message}`);
        }
    }

    private createProfile(dbFilePath: string, profile: {
        role: string;
        name: string;
        description: string;
        active?: boolean;
    }): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const db = new sqlite3.Database(dbFilePath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
                if (err) {
                    Logger.error(`[IncarnationsTool] Erro ao abrir o banco de dados: ${err.message}`);
                    reject(err);
                    return;
                }

                const createTableSQL = `
                    CREATE TABLE IF NOT EXISTS agent_profiles (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        role TEXT NOT NULL,
                        name TEXT UNIQUE NOT NULL,
                        description TEXT NOT NULL,
                        active INTEGER NOT NULL DEFAULT 0
                    )
                `;

                db.run(createTableSQL, (err) => {
                    if (err) {
                        Logger.error(`[IncarnationsTool] Erro ao criar a tabela: ${err.message}`);
                        reject(err);
                        db.close();
                        return;
                    }

                    db.serialize(() => {
                        db.run('BEGIN TRANSACTION', (err) => {
                            if (err) {
                                Logger.error(`[IncarnationsTool] Erro ao iniciar transação: ${err.message}`);
                                reject(err);
                                db.close();
                                return;
                            }

                            const finalizeTransaction = (success: boolean) => {
                                if (success) {
                                    db.run('COMMIT', (err) => {
                                        if (err) {
                                            Logger.error(`[IncarnationsTool] Erro ao finalizar transação: ${err.message}`);
                                            reject(err);
                                        } else {
                                            resolve();
                                        }
                                        db.close();
                                    });
                                } else {
                                    db.run('ROLLBACK', () => {
                                        db.close();
                                    });
                                }
                            };

                            const insertProfile = () => {
                                const insertSQL = `
                                    INSERT INTO agent_profiles (role, name, description, active)
                                    VALUES (?, ?, ?, ?)
                                `;

                                db.run(insertSQL, [
                                    profile.role,
                                    profile.name,
                                    profile.description,
                                    profile.active ? 1 : 0
                                ], function (err) {
                                    if (err) {
                                        Logger.error(`[IncarnationsTool] Erro ao criar perfil: ${err.message}`);
                                        finalizeTransaction(false);
                                        reject(err);
                                    } else {
                                        Logger.debug(`Perfil criado com ID: ${this.lastID}`);
                                        finalizeTransaction(true);
                                    }
                                });
                            };

                            if (profile.active) {
                                // Definir todos os perfis como inativos antes de definir o novo perfil como ativo
                                db.run(`UPDATE agent_profiles SET active = 0`, (err) => {
                                    if (err) {
                                        Logger.error(`[IncarnationsTool] Erro ao atualizar status ativo: ${err.message}`);
                                        finalizeTransaction(false);
                                        reject(err);
                                    } else {
                                        insertProfile();
                                    }
                                });
                            } else {
                                insertProfile();
                            }
                        });
                    });
                });
            });
        });
    }

    private readProfile(dbFilePath: string, name: string): Promise<{
        role: string;
        name: string;
        description: string;
        active: boolean;
    } | null> {
        return new Promise<{
            role: string;
            name: string;
            description: string;
            active: boolean;
        } | null>((resolve, reject) => {
            const db = new sqlite3.Database(dbFilePath, sqlite3.OPEN_READONLY, (err) => {
                if (err) {
                    Logger.error(`[IncarnationsTool] Erro ao abrir o banco de dados: ${err.message}`);
                    reject(err);
                    return;
                }

                const selectSQL = `
                    SELECT role, name, description, active
                    FROM agent_profiles
                    WHERE name = ?
                `;

                db.get(selectSQL, [name], (err, row: any) => {
                    if (err) {
                        Logger.error(`[IncarnationsTool] Erro ao ler perfil: ${err.message}`);
                        reject(err);
                    } else {
                        if (row) {
                            const parsedRow = {
                                role: row.role,
                                name: row.name,
                                description: row.description,
                                active: row.active === 1
                            };
                            resolve(parsedRow);
                        } else {
                            resolve(null);
                        }
                    }
                    db.close();
                });
            });
        });
    }

    private readActiveProfile(dbFilePath: string): Promise<{
        role: string;
        name: string;
        description: string;
        active: boolean;
    } | null> {
        return new Promise<{
            role: string;
            name: string;
            description: string;
            active: boolean;
        } | null>((resolve, reject) => {
            const db = new sqlite3.Database(dbFilePath, sqlite3.OPEN_READONLY, (err) => {
                if (err) {
                    Logger.error(`[IncarnationsTool] Erro ao abrir o banco de dados: ${err.message}`);
                    reject(err);
                    return;
                }

                const selectSQL = `
                    SELECT role, name, description, active
                    FROM agent_profiles
                    WHERE active = 1
                `;

                db.get(selectSQL, [], (err, row: any) => {
                    if (err) {
                        Logger.error(`[IncarnationsTool] Erro ao ler perfil ativo: ${err.message}`);
                        reject(err);
                    } else {
                        if (row) {
                            const parsedRow = {
                                role: row.role,
                                name: row.name,
                                description: row.description,
                                active: true
                            };
                            resolve(parsedRow);
                        } else {
                            resolve(null);
                        }
                    }
                    db.close();
                });
            });
        });
    }

    private updateProfile(dbFilePath: string, profile: {
        role?: string;
        name: string;
        description?: string;
        active?: boolean;
    }): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const db = new sqlite3.Database(dbFilePath, sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                    Logger.error(`[IncarnationsTool] Erro ao abrir o banco de dados: ${err.message}`);
                    reject(err);
                    return;
                }

                db.serialize(() => {
                    db.run('BEGIN TRANSACTION', (err) => {
                        if (err) {
                            Logger.error(`[IncarnationsTool] Erro ao iniciar transação: ${err.message}`);
                            reject(err);
                            db.close();
                            return;
                        }

                        const finalizeTransaction = (success: boolean) => {
                            if (success) {
                                db.run('COMMIT', (err) => {
                                    if (err) {
                                        Logger.error(`[IncarnationsTool] Erro ao finalizar transação: ${err.message}`);
                                        reject(err);
                                    } else {
                                        resolve();
                                    }
                                    db.close();
                                });
                            } else {
                                db.run('ROLLBACK', () => {
                                    db.close();
                                });
                            }
                        };

                        const updateFields: string[] = [];
                        const updateValues: any[] = [];

                        if (profile.role !== undefined) {
                            updateFields.push("role = ?");
                            updateValues.push(profile.role);
                        }
                        if (profile.description !== undefined) {
                            updateFields.push("description = ?");
                            updateValues.push(profile.description);
                        }
                        if (profile.active !== undefined) {
                            updateFields.push("active = ?");
                            updateValues.push(profile.active ? 1 : 0);
                        }

                        if (updateFields.length === 0) {
                            Logger.error(`[IncarnationsTool] Nenhum campo para atualizar foi fornecido.`);
                            finalizeTransaction(false);
                            reject(new Error("Nenhum campo para atualizar foi fornecido."));
                            return;
                        }

                        const updateSQL = `
                            UPDATE agent_profiles
                            SET ${updateFields.join(", ")}
                            WHERE name = ?
                        `;

                        const updateProfile = () => {
                            updateValues.push(profile.name);
                            db.run(updateSQL, updateValues, function (err) {
                                if (err) {
                                    Logger.error(`[IncarnationsTool] Erro ao atualizar perfil: ${err.message}`);
                                    finalizeTransaction(false);
                                    reject(err);
                                } else if (this.changes === 0) {
                                    Logger.warn(`[IncarnationsTool] Nenhum perfil encontrado para: ${profile.name}`);
                                    finalizeTransaction(false);
                                    reject(new Error(`Perfil não encontrado para: ${profile.name}`));
                                } else {
                                    Logger.debug(`Perfil atualizado: ${profile.name}`);
                                    finalizeTransaction(true);
                                }
                            });
                        };

                        if (profile.active) {
                            db.run(`UPDATE agent_profiles SET active = 0 WHERE name != ?`, [profile.name], (err) => {
                                if (err) {
                                    Logger.error(`[IncarnationsTool] Erro ao atualizar status ativo: ${err.message}`);
                                    finalizeTransaction(false);
                                    reject(err);
                                } else {
                                    updateProfile();
                                }
                            });
                        } else {
                            updateProfile();
                        }
                    });
                });
            });
        });
    }

    private listProfiles(dbFilePath: string): Promise<Array<{
        role: string;
        name: string;
        description: string;
        active: boolean;
    }>> {
        return new Promise<Array<{
            role: string;
            name: string;
            description: string;
            active: boolean;
        }>>((resolve, reject) => {
            const db = new sqlite3.Database(dbFilePath, sqlite3.OPEN_READONLY, (err) => {
                if (err) {
                    Logger.error(`[IncarnationsTool] Erro ao abrir o banco de dados: ${err.message}`);
                    reject(err);
                    return;
                }

                const selectSQL = `
                    SELECT role, name, description, active
                    FROM agent_profiles
                `;

                db.all(selectSQL, [], (err, rows: any[]) => {
                    if (err) {
                        Logger.error(`[IncarnationsTool] Erro ao listar perfis: ${err.message}`);
                        reject(err);
                    } else {
                        const profiles = rows.map(row => ({
                            role: row.role,
                            name: row.name,
                            description: row.description,
                            active: row.active === 1
                        }));
                        resolve(profiles);
                    }
                    db.close();
                });
            });
        });
    }

    private deleteProfile(dbFilePath: string, name: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const db = new sqlite3.Database(dbFilePath, sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                    Logger.error(`[IncarnationsTool] Erro ao abrir o banco de dados: ${err.message}`);
                    reject(err);
                    return;
                }

                const deleteSQL = `
                    DELETE FROM agent_profiles
                    WHERE name = ?
                `;

                db.run(deleteSQL, [name], function (err) {
                    if (err) {
                        Logger.error(`[IncarnationsTool] Erro ao excluir perfil: ${err.message}`);
                        reject(err);
                    } else if (this.changes === 0) {
                        Logger.warn(`[IncarnationsTool] Nenhum perfil encontrado para: ${name}`);
                        resolve();
                    } else {
                        Logger.debug(`[IncarnationsTool] Perfil excluído: ${name}`);
                        resolve();
                    }
                    db.close();
                });
            });
        });
    }

    private deleteAllProfiles(dbFilePath: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const db = new sqlite3.Database(dbFilePath, sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                    Logger.error(`[IncarnationsTool] Erro ao abrir o banco de dados: ${err.message}`);
                    reject(err);
                    return;
                }

                const deleteSQL = `DELETE FROM agent_profiles`;

                db.run(deleteSQL, function (err) {
                    if (err) {
                        Logger.error(`[IncarnationsTool] Erro ao excluir todos os perfis: ${err.message}`);
                        reject(err);
                    } else {
                        Logger.debug(`[IncarnationsTool] Todos os perfis foram excluídos.`);
                        resolve();
                    }
                    db.close();
                });
            });
        });
    }
}
