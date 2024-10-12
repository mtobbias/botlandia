import {IaraWebSocket} from "botlandia/server/iara.websocket";

const port = Number(process.env.BOTLANDIA_BACKEND_PORT || 3001);
new IaraWebSocket(port);