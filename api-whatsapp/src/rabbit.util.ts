// @ts-ignore
import * as amqp from 'amqplib';
import * as dotenv from 'dotenv';
import {Logger} from "botlandia/api/whatsapp/logger";

dotenv.config();

/**
 * Classe utilitária para interagir com o RabbitMQ.
 */
export class RabbitUtil {
    private connection: amqp.Connection;
    private channel: amqp.Channel;
    private readonly url: string;

    /**
     * Inicializa a classe RabbitUtil lendo a URL do RabbitMQ a partir das variáveis de ambiente.
     */
    constructor() {
        this.url = process.env.RABBITMQ_URL as string; // Lê a URL do RabbitMQ do ambiente
    }

    /**
     * Estabelece a conexão com o servidor RabbitMQ e cria um canal.
     * @throws {Error} Lança um erro se a conexão ou a criação do canal falhar.
     */
    async connect(): Promise<void> {
        try {
            this.connection = await amqp.connect(this.url);
            this.channel = await this.connection.createChannel();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtém o canal atual ou cria uma nova conexão se o canal não existir.
     * @returns {Promise<amqp.Channel>} O canal RabbitMQ.
     */
    private async getChannel(): Promise<amqp.Channel> {
        if (!this.channel) {
            await this.connect();
        }
        return this.channel;
    }

    /**
     * Cria uma fila no RabbitMQ com o nome especificado.
     * @param {string} queueName - O nome da fila a ser criada.
     * @throws {Error} Lança um erro se a criação da fila falhar.
     */
    async createQueue(queueName: string): Promise<void> {
        await this.channel.assertQueue(queueName, {durable: true});
    }

    /**
     * Publica uma mensagem na fila especificada.
     * @param {string} queueName - O nome da fila onde a mensagem será publicada.
     * @param {string} message - A mensagem a ser publicada.
     * @throws {Error} Lança um erro se a publicação da mensagem falhar.
     */
    async publish(queueName: string, message: string): Promise<void> {
        await this.getChannel();
        await this.channel.assertQueue(queueName, {durable: true});
        this.channel.sendToQueue(queueName, Buffer.from(message), {
            persistent: true,
        });
    }

    /**
     * Consome mensagens da fila especificada e executa um callback para cada mensagem recebida.
     * @param {string} queueName - O nome da fila a ser consumida.
     * @param {(msg: amqp.Message | null) => void} callback - A função de callback a ser executada para cada mensagem recebida.
     * @throws {Error} Lança um erro se o consumo da fila falhar.
     */
    async consume(queueName: string, callback: (msg: amqp.Message | null) => void): Promise<void> {
        await this.getChannel();
        await this.channel.assertQueue(queueName, {durable: true});
        await this.channel.consume(queueName, (msg: amqp.Message | null) => {
            if (msg) {
                Logger.whatslog(`Mensagem recebida de ${queueName}: ${msg.content.toString()}`);
                callback(msg);
                this.channel.ack(msg);
            }
        });
    }

    /**
     * Fecha o canal e a conexão com o RabbitMQ.
     * @throws {Error} Lança um erro se o fechamento do canal ou da conexão falhar.
     */
    async close(): Promise<void> {
        await this.channel.close();
        await this.connection.close();
        Logger.whatslog('Conexão com o RabbitMQ encerrada');
    }
}
