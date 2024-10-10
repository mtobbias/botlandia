import {IaraWebSocket} from "botlandia/server/iara.websocket";

const port = Number(process.env.PORT || 3001);
new IaraWebSocket(port);