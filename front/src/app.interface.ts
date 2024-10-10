export interface Message {
    type: string;
    to: string;
    message: string;
    timestamp: string;
    avatarUrl?: string;
    from: string;
    id?: string;
    toChat: boolean;
}

export interface Tool {
    uuid: number;
    name: string;
    description: string;
}

