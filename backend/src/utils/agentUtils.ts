import sqlite3 from "sqlite3";
import path from "path";

export interface AgentProfile {
    role: string;
    name: string;
    description: string;
    active: boolean;
}

export function getActiveProfile(): Promise<AgentProfile | null> {
    try {
        const dbFilePath = path.join(
            process.env.BOTLANDIA_BACKEND_DATA || ".", `incarnations.db`
        );
        return new Promise<AgentProfile | null>((resolve, reject) => {
            const db = new sqlite3.Database(dbFilePath, sqlite3.OPEN_READONLY, (err) => {
                if (err) {
                    console.error(`[sqlUtils] Error opening database: ${err.message}`);
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
                        console.error(`[sqlUtils] Error reading active profile: ${err.message}`);
                        reject(err);
                    } else {
                        if (row) {
                            const activeProfile: AgentProfile = {
                                role: row.role,
                                name: row.name,
                                description: row.description,
                                active: row.active === 1
                            };
                            resolve(activeProfile);
                        } else {
                            resolve(null);
                        }
                    }
                    db.close();
                });
            });
        });
    } catch (e) {
        return Promise.resolve(null)
    }
}
