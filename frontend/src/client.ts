import { EventEmitter } from 'events';

export class GameClient extends EventEmitter {
    private ws: WebSocket | null = null;
    private reconnect = true;

    constructor(private serverUrl: string) {
        super();
        console.log("client created")
    }

    connect() {
        this.ws = new WebSocket(this.serverUrl);
        this.ws.onopen = () => this.emit('connect');
        this.ws.onclose = () => {
            console.log("connection closed...")
            if (this.reconnect) {
                console.log("Reconnecting...")
                setTimeout(() => this.connect(), 1000);
            } else {
                console.log("Disconnected")
                this.emit('disconnect');
            }
        }
        this.ws.onmessage = (message) => {
            const data = JSON.parse(message.data);
            this.emit(data.type, data.message);
        };
    }

    login(username: string) {
        if (!this.ws) {
            throw new Error('Not connected to the server');
        }

        this.ws.send(JSON.stringify({
            type: 'login',
            username: username,
        }));
    }

    sendCommand(command: string) {
        if (!this.ws) {
            throw new Error('Not connected to the server');
        }

        this.ws.send(JSON.stringify({
            type: 'command',
            command: command,
        }));
    }

    disconnect() {
        this.reconnect = false;
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}
