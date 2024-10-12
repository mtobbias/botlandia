import {IaraWebSocket} from "botlandia/server/iara.websocket";

export enum WS_STATUS {
    NEW_MESSAGE = 'NEW_MESSAGE',
    NEW_MESSAGE_HUMAN = 'NEW_MESSAGE_HUMAN',
    GIVE_ME_TOOLS_RESPONSE = 'GIVE_ME_TOOLS_RESPONSE',
    GIVE_ME_TOOLS = 'GIVE_ME_TOOLS',
    TOOL_CHANGE = 'TOOL_CHANGE'
}

const port = Number(process.env.PORT || 3001);
new IaraWebSocket(port);