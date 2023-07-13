import express from 'express';
import { Server as WebSocketServer } from 'ws';
import { WorldGridManager } from "./worldgridmanager"; // adjust as necessary
import { EntityController } from "./entitycontroller";
import { EntityManager } from "./entittymanager";
import { WorldGrid } from "./database";
import { WorldBuilderAgent } from "./worldbuilderagent";

// Set up your world
const worldGrid = new WorldGrid(60 * 1000, "sandbox.json");
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
    ws.on('message', async (message: any) => {
        const msg = JSON.parse(message.toString());
        if (msg.type === 'login') {
            // Handle login
            if (clients.has(msg.username)) {
                ws.send(JSON.stringify({ type: 'error', message: 'Username is taken' }));
            } else {
                const entityId = worldGridManager.createEntity({ x: 0, y: 0 }); // Initialize an entity at the start location
                const controller = new EntityController(
                    entityId,
                    worldGridManager,
                    entityManager,
                    worldGrid
                );
                clients.set(msg.username, { ws, controller });
                ws.send(JSON.stringify({ type: 'login', message: 'Successfully logged in' }));
            }
        } else if (msg.type === 'command') {
            // Handle command
            if (!clients.has(msg.username)) {
                ws.send(JSON.stringify({ type: 'error', message: 'Not logged in' }));
            } else {
                // Add here your logic to process the command using the corresponding EntityController
                const { controller } = clients.get(msg.username);
                const output = await processCommand(controller, msg.command);
                ws.send(JSON.stringify({ type: 'command', message: output }));
            }
        }
    });

    ws.on('close', () => {
        // Remove the user from the clients map when they disconnect
        for (const [username, client] of clients.entries()) {
            if (client.ws === ws) {
                clients.delete(username);
                break;
            }
        }
    });
});

async function processCommand(controller: EntityController, command: string) {
    let output: string | undefined = "";
    // get first token of command
    const tokens = command.split(" ");
    const firstToken = tokens[0];
    switch (firstToken) {
        case "n":
        case "north":
        case "s":
        case "south":
        case "e":
        case "east":
        case "w":
        case "west":
            output = controller.move(command);
            break;
        case "/x":
        case "/examine":
            output = controller.examineSurroundings();
            break;
        case "/c":
        case "/coordinates":
            output = controller.coordinates();
            break;
        case "/b":
        case "/build":
            output = await worldBuilder.processCommand(command);
            break;
        case "":
            break;
        default:
            output = `You say, "${command}"`;
    }

    return output;
}
