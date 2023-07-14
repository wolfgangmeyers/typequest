import express from 'express';
import { Server as WebSocketServer } from 'ws';
import { WorldGridManager } from "./worldgridmanager"; // adjust as necessary
import { EntityController } from "./entitycontroller";
import { EntityManager } from "./entittymanager";
import { WorldGrid } from "./database";
import { WorldBuilderAgent } from "./worldbuilderagent";
import { MessageHistory } from './messagehistory';

// Set up your world
const worldGrid = new WorldGrid(60 * 1000, "typequest.json");
const entityManager = new EntityManager();
const worldGridManager = new WorldGridManager(
    worldGrid,
    entityManager
);
worldGridManager.init();
const worldBuilder = new WorldBuilderAgent(worldGridManager, process.env.OPENAI_API_KEY!);

// Set up a map to keep track of clients
const clients: Map<string, any> = new Map();

// Create an HTTP server
const app = express();
const server = app.listen(3000, () => {
    console.log('Listening on port 3000');
});

// Create a WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: any) => {
    console.log("New connection")
    let username: string | undefined;
    let controller: EntityController | undefined;
    let messageHistory: MessageHistory;
    ws.on('message', async (message: any) => {
        console.log(message.toString());
        const msg = JSON.parse(message.toString());
        if (msg.type === 'login') {
            // Handle login
            if (clients.has(msg.username)) {
                ws.send(JSON.stringify({ type: 'error', message: 'Username is taken' }));
            } else {
                const entityId = worldGridManager.createEntity({ x: 0, y: 0 }); // Initialize an entity at the start location
                controller = new EntityController(
                    entityId,
                    worldGridManager,
                    entityManager,
                    worldGrid
                );
                clients.set(msg.username, { ws, controller });
                console.log("Added client", msg.username)
                ws.send(JSON.stringify({ type: 'login', message: `Welcome to TypeQuest, ${msg.username}!` }));
                username = msg.username;
                messageHistory = new MessageHistory(30);
            }
        } else if (msg.type === 'command') {
            // Handle command
            if (!username || !controller) {
                ws.send(JSON.stringify({ type: 'error', message: 'Not logged in' }));
            } else {
                // Add here your logic to process the command using the corresponding EntityController
                const output = await processCommand(controller, messageHistory, msg.command);
                ws.send(JSON.stringify({ type: 'command', message: output }));
            }
        }
    });

    ws.on('close', () => {
        console.log("Connection closed")
        // Remove the user from the clients map when they disconnect
        for (const [username, client] of clients.entries()) {
            if (client.ws === ws) {
                clients.delete(username);
                break;
            }
        }
    });
});

async function processCommand(controller: EntityController, messageHistory: MessageHistory, command: string) {
    let output: string | undefined = "";
    // get first token of command
    const tokens = command.split(" ");
    const firstToken = tokens[0];
    let messageHistoryHandled = false;
    switch (firstToken) {
        case "north":
        case "south":
        case "east":
        case "west":
            output = controller.move(command);
            break;
        case "/examine":
            output = controller.examineSurroundings();
            break;
        case "/coordinates":
            output = controller.coordinates();
            break;
        case "/build":
            output = await worldBuilder.processCommand(messageHistory, command);
            messageHistoryHandled = true;
            break;
        case "":
            break;
        default:
            output = `You say, "${command}"`;
    }
    if (!messageHistoryHandled) {
        messageHistory.addUserMessage(command);
        messageHistory.addAssistantMessage(output);
    }
    return output;
}
