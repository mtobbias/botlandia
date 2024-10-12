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
export interface ILog {
  timestamp?: Date;        // Data e hora do log (opcional, pode ser gerado automaticamente)
  level: LogLevel;         // Nível de severidade do log (INFO, WARNING, ERROR, etc.)
  message: string;        // Mensagem principal do log
  source?: string;         // Origem do log (nome da classe, função, etc.)
  data?: any;             // Dados adicionais relevantes para o log (opcional)
}

export enum WS_STATUS {
    NEW_MESSAGE = 'NEW_MESSAGE',
    NEW_MESSAGE_HUMAN = 'NEW_MESSAGE_HUMAN',
    GIVE_ME_TOOLS_RESPONSE = 'GIVE_ME_TOOLS_RESPONSE',
    GIVE_ME_TOOLS = 'GIVE_ME_TOOLS',
    TOOL_CHANGE = 'TOOL_CHANGE'
}

export enum EVENTS_WS {
  CLOSE = "close",
  ERROR = "error",
  CONNECTION = "connection",
  MESSAGE = "message",
}

export interface IToolData {
  uuid: string;
  name: string;
  description: string;
  enable: boolean;
}

export interface IWhatsappMessage {
  id: string;
  from: string;
  avatarUrl: string;
  body: string;
  username: string;
}

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARNING = "WARNING",
  ERROR = "ERROR",
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
