// @ts-ignore
import amqplib, {Connection, Channel, ConsumeMessage} from "amqplib";
import {Tool} from "botlandia/core/tools";
import {Logger} from "botlandia/utils/logger";

interface RabbitMQToolArgs {
    action: "publish" | "consume";
    connectionUrl: string;
    queueName: string;
    message?: string; // Para ação de publicar
}

export class RabbitMQTool extends Tool {
    static UUID = "29fe469d-7287-4ab2-9a4e-bbf41d53de70";
    private connectionUrl: string

    constructor(connectionUrl: string) {
        super(
            RabbitMQTool.UUID,
            "RabbitMQTool",
            `
            Interage com um broker de mensagens RabbitMQ.
            Permite publicar mensagens em uma fila ou consumir mensagens de uma fila.
            `
        );
        this.connectionUrl = connectionUrl
        this.addField({
            name: "action",
            type: "string",
            description: "A ação a ser executada ('publish' ou 'consume').",
        });
        this.addField({
            name: "queueName",
            type: "string",
            description: "O nome da fila com a qual interagir.",
        });
        this.addField({
            name: "message",
            type: "string",
            description: "A mensagem a ser publicada (para a ação 'publish').",
        });
    }

    async run(arg: string): Promise<any> {
        const objArgs: RabbitMQToolArgs = JSON.parse(arg);
        Logger.toolSaid(this.name, `Executando com os seguintes argumentos: ${JSON.stringify(objArgs)}`);

        const {action, queueName, message} = objArgs;

        if (!action || !this.connectionUrl || !queueName) {
            Logger.error("[RabbitMQTool] Argumentos obrigatórios ausentes.");
            throw new Error("Faltando argumentos obrigatórios: 'action', 'connectionUrl' ou 'queueName'.");
        }

        try {
            switch (action) {
                case "publish":
                    if (!message) {
                        throw new Error("A mensagem é obrigatória para a ação 'publish'.");
                    }
                    await this.publishMessage(this.connectionUrl, queueName, message);
                    Logger.toolSaid(this.name, `Mensagem publicada na fila: ${queueName}`);
                    return "Mensagem publicada com sucesso.";
                case "consume":
                    const consumedMessage = await this.consumeMessage(
                        this.connectionUrl,
                        queueName
                    );
                    Logger.toolSaid(this.name, `Mensagem consumida da fila: ${queueName}`);
                    return consumedMessage;
                default:
                    Logger.error(`[RabbitMQTool] Ação inválida: ${action}`);
                    throw new Error(`Ação inválida: ${action}`);
            }
        } catch (error: any) {
            Logger.error(`[RabbitMQTool] Erro: ${error.message}`);
            throw new Error(`Erro no RabbitMQTool: ${error.message}`);
        }
    }

    private async publishMessage(
        connectionUrl: string,
        queueName: string,
        message: string
    ): Promise<void> {
        let connection: Connection | null = null;
        let channel: Channel | null = null;

        try {
            connection = await amqplib.connect(connectionUrl);
            channel = await connection.createChannel();
            await channel.assertQueue(queueName, {durable: true});
            channel.sendToQueue(queueName, Buffer.from(message));
            Logger.toolSaid(this.name, `Mensagem enviada para a fila '${queueName}': ${message}`);
        } catch (error: any) {
            Logger.error(`[RabbitMQTool] Erro ao publicar mensagem: ${error.message}`);
            throw error;
        } finally {
            if (channel) {
                await channel.close();
            }
            if (connection) {
                await connection.close();
            }
        }
    }

    private async consumeMessage(
        connectionUrl: string,
        queueName: string
    ): Promise<string> {
        let connection: Connection | null = null;
        let channel: Channel | null = null;

        try {
            connection = await amqplib.connect(connectionUrl);
            channel = await connection.createChannel();
            await channel.assertQueue(queueName, {durable: true});

            const message = await new Promise<string>((resolve, reject) => {
                const onMessage = (msg: ConsumeMessage | null) => {
                    if (msg) {
                        const messageContent = msg.content.toString();
                        channel!.ack(msg); // Confirma a mensagem
                        resolve(messageContent);
                    }
                };
                channel!.consume(queueName, onMessage, {noAck: false}).catch(reject);
            });

            Logger.toolSaid(this.name, `Mensagem consumida da fila '${queueName}': ${message}`);
            return message;
        } catch (error: any) {
            Logger.error(`[RabbitMQTool] Erro ao consumir mensagem: ${error.message}`);
            throw error;
        } finally {
            if (channel) {
                await channel.close();
            }
            if (connection) {
                await connection.close();
            }
        }
    }
}
