import { Message } from 'whatsapp-web.js';

export interface IClientWhatsApp {
  onQrcode(qrcode: string): void;
  onMessage(message: Message): any;
  onReady(): void;
  onJoinGroup(props: any): any;
  onLeaveGroup(props: any): any;
}
