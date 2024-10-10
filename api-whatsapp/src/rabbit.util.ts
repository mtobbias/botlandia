// @ts-ignore
import * as amqp from 'amqplib';
import * as dotenv from 'dotenv';

dotenv.config(); // Carregar variáveis de ambiente do arquivo .env

export class RabbitUtil {
    private connection: amqp.Connection;
    private channel: amqp.Channel;
    private url: string;

    constructor() {
        this.url = process.env.RABBITMQ_URL as string; // Lê a URL do RabbitMQ do ambiente
        console.log(`RabbitUtil--> ${this.url}`)
    }

    async connect(): Promise<void> {
        try {
            this.connection = await amqp.connect(this.url);
            this.channel = await this.connection.createChannel();
            console.log('Connected to RabbitMQ', this.url);
        } catch (error) {
            console.error('Failed to connect to RabbitMQ:', error);
            throw error;
        }
    }

    private async getChannel() {
        if (!this.channel) {
            await this.connect()
        }
        return this.channel
    }

    async createQueue(queueName: string): Promise<void> {
        await this.channel.assertQueue(queueName, {durable: true});
        console.log(`Queue ${queueName} created`);
    }

    async publish(queueName: string, message: string): Promise<void> {
        await this.getChannel()
        await this.channel.assertQueue(queueName, {durable: true});
        this.channel.sendToQueue(queueName, Buffer.from(message), {
            persistent: true,
        });
        console.log(`Message sent to ${queueName}: ${message}`);
    }

    async consume(queueName: string, callback: (msg: amqp.Message | null) => void): Promise<void> {
        await this.getChannel()
        await this.channel.assertQueue(queueName, {durable: true});
        await this.channel.consume(queueName, (msg: any) => {
            if (msg) {
                console.log(`Message received from ${queueName}: ${msg.content.toString()}`);
                callback(msg);
                this.channel.ack(msg);
            }
        });
    }

    async close(): Promise<void> {
        await this.channel.close();
        await this.connection.close();
        console.log('Connection to RabbitMQ closed');
    }
}
