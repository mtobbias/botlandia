export interface IBrain {
    thinkAbout: (about: string, tools: any[]) => Promise<IBill>;

    addChatSystem(content: string): any;

    addChatUser(content: string): any;

    addChatAssistant(content: string): any;
}


export interface IBill {
    tokens: number;
    answer: Answer;
}

export interface IBillAnyone {
    bill: IBill;
    totalTokens: number;
    role: string;
}
export interface IBillSquad {
    totalTokens: number;
    anyone: IBillAnyone[];
    answer: Answer;
}


export interface Answer {
    content: string | null;
    function_call?: FunctionCall;
    tool_calls?: Array<ToolCall>
    refusal?: string | null;
    role: string;
}

export interface FunctionCall {
    arguments: any;
    name: string;
}

export interface ToolCall {
    id: string;
    function: any;
    type: any;
}


export interface ITool {
    uuid: string;
    name: string;
    description: string;
    fields: FieldTool[];
    run: (args: any) => any;
    help:()=>string;

}

export interface FieldTool {
    name: string;
    type: string;
    description: string;
}

export interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}
export interface ClientWebsocket {
    ws: WebSocket;
    username: string;
}

export interface IncarnationsType {
    role: string;
    name: string;
    description: string;
}
