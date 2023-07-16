import express from 'express';
import { Server as WebSocketServer } from 'ws';
import { WorldGridManager } from "./worldgridmanager"; // adjust as necessary
import { EntityController } from "./entitycontroller";
import { EntityManager } from "./entittymanager";
import { WorldState } from "./database";
import { WorldBuilderAgent } from "./worldbuilderagent";
import { MessageHistory } from './messagehistory';

// Set up your world
const worldGrid = new WorldState(60 * 1000, "typequest.json");
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
    let entityId: string | undefined;
    ws.on('message', async (message: any) => {
        try {
            console.log("message", message.toString());
            const msg = JSON.parse(message.toString());
            if (msg.type === 'login') {
                // console.log("login message received")
                // Handle login
                if (clients.has(msg.username)) {
                    console.log("Username is taken")
                    ws.send(JSON.stringify({ type: 'error', message: 'Username is taken' }));
                } else {
                    console.log("creating entity")
                    entityId = worldGridManager.createEntity(
                        { x: 0, y: 0 },
                        "player",
                        msg.username
                    ); // Initialize an entity at the start location
                    console.log("creating entity controller")
                    controller = new EntityController(
                        entityId,
                        worldGridManager,
                        entityManager,
                        worldGrid
                    );
                    clients.set(msg.username, { ws, controller });
                    console.log("Added client", msg.username)
                    ws.send(JSON.stringify({ type: 'login', message: `Welcome to TypeQuest, ${msg.username}! ${controller.examineSurroundings(false)}` }));
                    username = msg.username;
                    messageHistory = new MessageHistory(30);
                }
            } else if (msg.type === 'command') {
                // console.log("command message received")
                // Handle command
                if (!username || !controller) {
                    console.log(`Not logged in, username: ${username}, controller: ${controller}`)
                    ws.send(JSON.stringify({ type: 'error', message: 'Not logged in' }));
                } else {
                    console.log("Processing command", msg.command);
                    // Add here your logic to process the command using the corresponding EntityController
                    const output = await processCommand(controller, messageHistory, msg.command);
                    ws.send(JSON.stringify({ type: 'command', message: output }));
                }
            }
        } catch (err: any) {
            console.error(err);
        }
        
    });

    ws.on('close', () => {
        console.log("Connection closed")
        // Remove the user from the clients map when they disconnect
        for (const [username, client] of clients.entries()) {
            if (client.ws === ws) {
                if (entityId) {
                    worldGridManager.destroyEntity(entityId);
                }
                clients.delete(username);
                break;
            }
        }
    });
});

async function processCommand(controller: EntityController, messageHistory: MessageHistory, command: string) {
    console.log("Processing command", command);
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
            console.log("Moving", firstToken);
            output = controller.move(command);
            break;
        case "/examine":
            console.log("Examining");
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
