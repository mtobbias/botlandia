export interface IClientWhatsApp {
    onQrcode: (qr: string) => Promise<void>;
    onReady: () => Promise<void>;
    onMessage: (msg: any) => Promise<void>;
    onJoinGroup: (opts: any) => void;
    onLeaveGroup: (opts: any) => void;
}
