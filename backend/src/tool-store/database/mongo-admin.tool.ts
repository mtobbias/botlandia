import { MongoClient } from "mongodb";
import { Tool } from "botlandia/core/tools";
import {Logger} from "botlandia/utils/logger";

interface MongoAdminToolArgs {
    action: string;
    databaseName?: string;
    collectionName?: string;
    userName?: string;
    userPassword?: string;
    roles?: string;
    document?: string;
    documents?: string;
    query?: string;
    update?: string;
    pipeline?: string;
    indexName?: string;
    indexFields?: string;
    limit?: string;
    skip?: string;
    sort?: string;
}

export class MongoAdminTool extends Tool {
    static UUID = "4606e1b2-0995-4ace-bf91-240d4ef4c0a10";
    private readonly connectionUrl: string;

    constructor(connectionUrl: string) {
        super(
            MongoAdminTool.UUID,
            "MongoAdminTool",
            `
                Realiza tarefas administrativas em um banco de dados MongoDB.
                Permite criar e excluir coleções e bancos de dados,
                gerenciar usuários (criar e excluir) e realizar operações CRUD básicas.
            `
        );
        this.connectionUrl = connectionUrl;
        this.addField({
            name: "action",
            type: "string",
            description:
                "Ação administrativa ou CRUD a ser executada (por exemplo, 'insertMany', 'updateMany', 'aggregate')",
        });
        this.addField({
            name: "databaseName",
            type: "string",
            description:
                "O nome do banco de dados a ser usado (necessário para a maioria das ações)",
        });
        this.addField({
            name: "collectionName",
            type: "string",
            description:
                "O nome da coleção com a qual interagir (necessário para ações de coleção e dados)",
        });
        this.addField({
            name: "userName",
            type: "string",
            description:
                "O nome de usuário para o novo usuário (necessário para 'createUser' e 'deleteUser')",
        });
        this.addField({
            name: "userPassword",
            type: "string",
            description:
                "A senha para o novo usuário (necessário para 'createUser')",
        });
        this.addField({
            name: "roles",
            type: "string",
            description:
                "Uma lista separada por vírgulas de funções para o novo usuário (para 'createUser'). Exemplo: 'readWrite,dbAdmin'",
        });
        this.addField({
            name: "document",
            type: "string",
            description: "A string JSON do documento a ser inserido (necessário para a ação 'insertOne')",
        });
        this.addField({
            name: "documents",
            type: "string",
            description: "A string JSON do array de documentos a serem inseridos (necessário para a ação 'insertMany')",
        });
        this.addField({
            name: "query",
            type: "string",
            description: "A string JSON da consulta a ser usada para ações de busca e atualização/exclusão",
        });
        this.addField({
            name: "update",
            type: "string",
            description: "A string JSON das operações de atualização a serem aplicadas (necessário para ações 'updateOne' e 'updateMany')",
        });
        this.addField({
            name: "pipeline",
            type: "string",
            description: "A string JSON do pipeline de agregação a ser executado (necessário para a ação 'aggregate')",
        });
        this.addField({
            name: "indexName",
            type: "string",
            description: "O nome do índice (necessário para ações 'createIndex' e 'dropIndex')",
        });
        this.addField({
            name: "indexFields",
            type: "string",
            description: "A string JSON dos campos a serem indexados (necessário para a ação 'createIndex')",
        });
        this.addField({
            name: "limit",
            type: "string",
            description: "O número máximo de documentos a retornar (opcional para a ação 'find')",
        });
        this.addField({
            name: "skip",
            type: "string",
            description: "O número de documentos a pular (opcional para a ação 'find')",
        });
        this.addField({
            name: "sort",
            type: "string",
            description: "A string JSON dos critérios de ordenação (opcional para a ação 'find')",
        });
    }

    /**
     * Executa a ação administrativa ou CRUD com os argumentos fornecidos.
     * @param arg String JSON contendo os parâmetros necessários para a ação.
     * @returns Uma promessa que resolve com o resultado da operação ou rejeita com um erro.
     */
    async run(arg: any): Promise<any> {
        const objArgs: MongoAdminToolArgs = JSON.parse(arg);
        Logger.toolSaid(this.name, `Executando com os argumentos: ${JSON.stringify(objArgs)}`);

        const {
            action,
            databaseName,
            collectionName,
            userName,
            userPassword,
            roles,
            document,
            documents,
            query,
            update,
            pipeline,
            indexName,
            indexFields,
            limit,
            skip,
            sort,
        } = objArgs;

        if (!action || !this.connectionUrl) {
            Logger.error("[MongoAdminTool] Parâmetros obrigatórios 'action' ou 'connectionUrl' ausentes.");
            throw new Error("Parâmetros obrigatórios 'action' ou 'connectionUrl' ausentes.");
        }

        const client = new MongoClient(this.connectionUrl);

        try {
            await client.connect();
            let result: any;

            // Parse de campos string para tipos apropriados
            let parsedDocument: Record<string, any> | undefined;
            let parsedDocuments: Record<string, any>[] | undefined;
            let parsedQuery: Record<string, any> | undefined;
            let parsedUpdate: Record<string, any> | undefined;
            let parsedPipeline: any[] | undefined;
            let parsedIndexFields: Record<string, any> | undefined;
            let parsedLimit: number | undefined;
            let parsedSkip: number | undefined;
            let parsedSort: Record<string, any> | undefined;

            try {
                if (document) {
                    parsedDocument = JSON.parse(document);
                }
                if (documents) {
                    parsedDocuments = JSON.parse(documents);
                }
                if (query) {
                    parsedQuery = JSON.parse(query);
                }
                if (update) {
                    parsedUpdate = JSON.parse(update);
                }
                if (pipeline) {
                    parsedPipeline = JSON.parse(pipeline);
                }
                if (indexFields) {
                    parsedIndexFields = JSON.parse(indexFields);
                }
                if (limit) {
                    parsedLimit = parseInt(limit, 10);
                    if (isNaN(parsedLimit)) {
                        throw new Error("Número inválido para 'limit'.");
                    }
                }
                if (skip) {
                    parsedSkip = parseInt(skip, 10);
                    if (isNaN(parsedSkip)) {
                        throw new Error("Número inválido para 'skip'.");
                    }
                }
                if (sort) {
                    parsedSort = JSON.parse(sort);
                }
            } catch (parseError: any) {
                Logger.error(`[MongoAdminTool] Erro ao analisar os parâmetros de entrada: ${parseError.message}`);
                throw new Error(`Erro ao analisar os parâmetros de entrada: ${parseError.message}`);
            }

            switch (action) {
                case "createCollection":
                    if (!databaseName || !collectionName) {
                        throw new Error("Nome do banco de dados e nome da coleção são necessários para a ação 'createCollection'.");
                    }
                    await client.db(databaseName).createCollection(collectionName);
                    Logger.toolSaid(this.name, `Coleção '${collectionName}' criada com sucesso no banco de dados '${databaseName}'.`);
                    result = `Coleção '${collectionName}' criada com sucesso no banco de dados '${databaseName}'.`;
                    break;

                case "dropCollection":
                    if (!databaseName || !collectionName) {
                        throw new Error("Nome do banco de dados e nome da coleção são necessários para a ação 'dropCollection'.");
                    }
                    await client.db(databaseName).collection(collectionName).drop();
                    Logger.toolSaid(this.name, `Coleção '${collectionName}' excluída com sucesso do banco de dados '${databaseName}'.`);
                    result = `Coleção '${collectionName}' excluída com sucesso do banco de dados '${databaseName}'.`;
                    break;

                case "createDatabase":
                    if (!databaseName) {
                        throw new Error("Nome do banco de dados é necessário para a ação 'createDatabase'.");
                    }
                    await client.db(databaseName).command({ ping: 1 });
                    Logger.toolSaid(this.name, `Banco de dados '${databaseName}' criado com sucesso.`);
                    result = `Banco de dados '${databaseName}' criado com sucesso.`;
                    break;

                case "dropDatabase":
                    if (!databaseName) {
                        throw new Error("Nome do banco de dados é necessário para a ação 'dropDatabase'.");
                    }
                    await client.db(databaseName).dropDatabase();
                    Logger.toolSaid(this.name, `Banco de dados '${databaseName}' excluído com sucesso.`);
                    result = `Banco de dados '${databaseName}' excluído com sucesso.`;
                    break;

                case "createUser":
                    if (!databaseName || !userName || !userPassword) {
                        throw new Error("Nome do banco de dados, nome de usuário e senha são necessários para a ação 'createUser'.");
                    }
                    const rolesArray = roles ? roles.split(",").map((role) => role.trim()) : ["readWrite"];
                    const roleObjects = rolesArray.map((role) => ({ role: role, db: databaseName }));
                    await client.db(databaseName).command({
                        createUser: userName,
                        pwd: userPassword,
                        roles: roleObjects,
                    });
                    Logger.toolSaid(this.name, `Usuário '${userName}' criado com sucesso no banco de dados '${databaseName}' com as funções: ${rolesArray.join(", ")}.`);
                    result = `Usuário '${userName}' criado com sucesso no banco de dados '${databaseName}' com as funções: ${rolesArray.join(", ")}.`;
                    break;

                case "deleteUser":
                    if (!databaseName || !userName) {
                        throw new Error("Nome do banco de dados e nome de usuário são necessários para a ação 'deleteUser'.");
                    }
                    await client.db(databaseName).command({ dropUser: userName });
                    Logger.toolSaid(this.name, `Usuário '${userName}' excluído com sucesso do banco de dados '${databaseName}'.`);
                    result = `Usuário '${userName}' excluído com sucesso do banco de dados '${databaseName}'.`;
                    break;

                case "insertOne":
                    if (!databaseName || !collectionName || !parsedDocument) {
                        throw new Error("Nome do banco de dados, nome da coleção e documento são necessários para a ação 'insertOne'.");
                    }
                    const insertResult = await client.db(databaseName).collection(collectionName).insertOne(parsedDocument);
                    Logger.toolSaid(this.name, `Documento inserido com sucesso na coleção '${collectionName}' no banco de dados '${databaseName}'. InsertedId: ${insertResult.insertedId}`);
                    result = `Documento inserido com sucesso na coleção '${collectionName}' no banco de dados '${databaseName}'. InsertedId: ${insertResult.insertedId}`;
                    break;

                case "insertMany":
                    if (!databaseName || !collectionName || !parsedDocuments) {
                        throw new Error("Nome do banco de dados, nome da coleção e documentos são necessários para a ação 'insertMany'.");
                    }
                    const insertManyResult = await client.db(databaseName).collection(collectionName).insertMany(parsedDocuments);
                    Logger.toolSaid(this.name, `Documentos inseridos com sucesso na coleção '${collectionName}' no banco de dados '${databaseName}'. InsertedCount: ${insertManyResult.insertedCount}`);
                    result = `Documentos inseridos com sucesso na coleção '${collectionName}' no banco de dados '${databaseName}'. InsertedCount: ${insertManyResult.insertedCount}`;
                    break;

                case "find":
                    if (!databaseName || !collectionName || !parsedQuery) {
                        throw new Error("Nome do banco de dados, nome da coleção e consulta são necessários para a ação 'find'.");
                    }
                    let cursor = client.db(databaseName).collection(collectionName).find(parsedQuery);

                    if (parsedSort) {
                        cursor = cursor.sort(parsedSort);
                    }
                    if (parsedSkip !== undefined) {
                        cursor = cursor.skip(parsedSkip);
                    }
                    if (parsedLimit !== undefined) {
                        cursor = cursor.limit(parsedLimit);
                    }

                    const findResult = await cursor.toArray();
                    Logger.toolSaid(this.name, `Documentos recuperados com sucesso da coleção '${collectionName}' no banco de dados '${databaseName}'.`);
                    result = JSON.stringify(findResult);
                    break;

                case "updateOne":
                    if (!databaseName || !collectionName || !parsedQuery || !parsedUpdate) {
                        throw new Error("Nome do banco de dados, nome da coleção, consulta e atualização são necessários para a ação 'updateOne'.");
                    }
                    const updateResult = await client.db(databaseName).collection(collectionName).updateOne(parsedQuery, parsedUpdate);
                    Logger.toolSaid(this.name, `Documento atualizado com sucesso na coleção '${collectionName}' no banco de dados '${databaseName}'. MatchedCount: ${updateResult.matchedCount}, ModifiedCount: ${updateResult.modifiedCount}`);
                    result = `Documento atualizado com sucesso na coleção '${collectionName}' no banco de dados '${databaseName}'. MatchedCount: ${updateResult.matchedCount}, ModifiedCount: ${updateResult.modifiedCount}`;
                    break;

                case "updateMany":
                    if (!databaseName || !collectionName || !parsedQuery || !parsedUpdate) {
                        throw new Error("Nome do banco de dados, nome da coleção, consulta e atualização são necessários para a ação 'updateMany'.");
                    }
                    const updateManyResult = await client.db(databaseName).collection(collectionName).updateMany(parsedQuery, parsedUpdate);
                    Logger.toolSaid(this.name, `Documentos atualizados com sucesso na coleção '${collectionName}' no banco de dados '${databaseName}'. MatchedCount: ${updateManyResult.matchedCount}, ModifiedCount: ${updateManyResult.modifiedCount}`);
                    result = `Documentos atualizados com sucesso na coleção '${collectionName}' no banco de dados '${databaseName}'. MatchedCount: ${updateManyResult.matchedCount}, ModifiedCount: ${updateManyResult.modifiedCount}`;
                    break;

                case "deleteOne":
                    if (!databaseName || !collectionName || !parsedQuery) {
                        throw new Error("Nome do banco de dados, nome da coleção e consulta são necessários para a ação 'deleteOne'.");
                    }
                    const deleteResult = await client.db(databaseName).collection(collectionName).deleteOne(parsedQuery);
                    Logger.toolSaid(this.name, `Documento excluído com sucesso da coleção '${collectionName}' no banco de dados '${databaseName}'. DeletedCount: ${deleteResult.deletedCount}`);
                    result = `Documento excluído com sucesso da coleção '${collectionName}' no banco de dados '${databaseName}'. DeletedCount: ${deleteResult.deletedCount}`;
                    break;

                case "deleteMany":
                    if (!databaseName || !collectionName || !parsedQuery) {
                        throw new Error("Nome do banco de dados, nome da coleção e consulta são necessários para a ação 'deleteMany'.");
                    }
                    const deleteManyResult = await client.db(databaseName).collection(collectionName).deleteMany(parsedQuery);
                    Logger.toolSaid(this.name, `Documentos excluídos com sucesso da coleção '${collectionName}' no banco de dados '${databaseName}'. DeletedCount: ${deleteManyResult.deletedCount}`);
                    result = `Documentos excluídos com sucesso da coleção '${collectionName}' no banco de dados '${databaseName}'. DeletedCount: ${deleteManyResult.deletedCount}`;
                    break;

                case "aggregate":
                    if (!databaseName || !collectionName || !parsedPipeline) {
                        throw new Error("Nome do banco de dados, nome da coleção e pipeline são necessários para a ação 'aggregate'.");
                    }
                    const aggregateResult = await client.db(databaseName).collection(collectionName).aggregate(parsedPipeline).toArray();
                    Logger.toolSaid(this.name, `Pipeline de agregação executado com sucesso na coleção '${collectionName}' no banco de dados '${databaseName}'.`);
                    result = JSON.stringify(aggregateResult);
                    break;

                case "createIndex":
                    if (!databaseName || !collectionName || !parsedIndexFields || !indexName) {
                        throw new Error("Nome do banco de dados, nome da coleção, campos do índice e nome do índice são necessários para a ação 'createIndex'.");
                    }
                    await client.db(databaseName).collection(collectionName).createIndex(parsedIndexFields, { name: indexName });
                    Logger.toolSaid(this.name, `Índice '${indexName}' criado com sucesso na coleção '${collectionName}' no banco de dados '${databaseName}'.`);
                    result = `Índice '${indexName}' criado com sucesso na coleção '${collectionName}' no banco de dados '${databaseName}'.`;
                    break;

                case "dropIndex":
                    if (!databaseName || !collectionName || !indexName) {
                        throw new Error("Nome do banco de dados, nome da coleção e nome do índice são necessários para a ação 'dropIndex'.");
                    }
                    await client.db(databaseName).collection(collectionName).dropIndex(indexName);
                    Logger.toolSaid(this.name, `Índice '${indexName}' excluído com sucesso da coleção '${collectionName}' no banco de dados '${databaseName}'.`);
                    result = `Índice '${indexName}' excluído com sucesso da coleção '${collectionName}' no banco de dados '${databaseName}'.`;
                    break;

                default:
                    Logger.error(`[MongoAdminTool] Ação inválida: ${action}`);
                    throw new Error(`Ação inválida: ${action}`);
            }

            Logger.toolSaid(this.name, `Operação '${action}' realizada com sucesso.`);
            return result;
        } catch (error: any) {
            Logger.error(`[MongoAdminTool] Erro: ${error.message}`);
            throw new Error(`Erro no MongoAdminTool: ${error.message}`);
        } finally {
            await client.close();
            Logger.toolSaid(this.name, `Conexão com o cliente MongoDB fechada.`);
        }
    }
}
