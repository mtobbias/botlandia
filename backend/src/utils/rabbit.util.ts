// @ts-ignore
import * as amqp from 'amqplib';
import * as dotenv from 'dotenv';

dotenv.config(); // Carregar variáveis de ambiente do arquivo .env

export class RabbitUtil {
    private connection: amqp.Connection;
    private channel: amqp.Channel;
    private url: string;
    public static readonly WHATSAPP_IN = "WHATSAPP_IN"
    public static readonly WHATSAPP_OUT = "WHATSAPP_OUT"
    public static readonly WHATSAPP_READY = "WHATSAPP_READY"

    constructor() {
        this.url = process.env.BOTLANDIA_RABBITMQ_URI as string; // Lê a URL do RabbitMQ do ambiente

    }

    async connect(): Promise<void> {
        try {
            this.connection = await amqp.connect(this.url);
            this.channel = await this.connection.createChannel();
            console.log('Connected to RabbitMQ');
        } catch (error) {
            console.error('Failed to connect to RabbitMQ:', error);
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
        try {
            await this.getChannel()
            await this.channel.assertQueue(queueName, {durable: true});
            await this.channel.consume(queueName, (msg: any) => {
                if (msg) {
                    console.log(`Message received from ${queueName}: ${msg.content.toString()}`);
                    callback(msg);
                    this.channel.ack(msg);
                }
            });
        } catch (error: any) {
        }
    }

    async close(): Promise<void> {
        await this.channel.close();
        await this.connection.close();
        console.log('Connection to RabbitMQ closed');
    }
}
