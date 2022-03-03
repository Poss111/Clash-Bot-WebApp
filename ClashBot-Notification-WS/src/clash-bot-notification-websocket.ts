import {WebSocket} from 'ws';

export interface ClashBotNotificationWebsocket extends WebSocket {
    isAlive: boolean,
    channel: string
}