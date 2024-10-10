import {ChatMessage, IBill, IBrain} from "./interfaces";


export class Brain implements IBrain {
    chatHistory: ChatMessage[] = [];
    incarnation?: string;

    constructor(incarnation?: string) {
        this.chatHistory = [];
        if (incarnation) {
            this.incarnation = incarnation;
            this.addChatSystem(incarnation)
        }
    }

    public addChatSystem(content: string) {
        this.chatHistory.push({role: "system", content: content});
    }

    public addChatUser(content: string) {
        this.chatHistory.push({role: "user", content: content});
    }

    public addChatAssistant(content: string) {
        this.chatHistory.push({role: "assistant", content: content});
    }

    private async updateTokens(description: string, tokens: number) {
    }

    protected async updateCoast(tokens?: number, owner?: string, description?: string) {
        if (tokens && owner && description) {
            await this.updateTokens(description, tokens)
        }
    }

    thinkAbout(about: string, tools: any[]): Promise<IBill> {
        // @ts-ignore
        return Promise.resolve(undefined);
    }

}

