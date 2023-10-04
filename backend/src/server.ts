import express from "express";
import dotenv from "dotenv"
import { Server as WebSocketServer } from "ws";
import { WorldGridManager } from "./worldgridmanager"; // adjust as necessary
import { EntityController } from "./entitycontroller";
import { Database } from "./database";
import { WorldBuilderAgent } from "./worldbuilderagent";
import { MessageHistory } from "./messagehistory";
import { NotifyPlaceEvent } from "./models";
import { UserRegistry } from "./userregistry";

dotenv.config()

// Set up your world
const database = new Database(60 * 1000, "typequest.json");
const worldGridManager = new WorldGridManager(database);
worldGridManager.init();
const userRegistry = new UserRegistry(database);
const worldBuilder = new WorldBuilderAgent(
    worldGridManager,
    process.env.OPENAI_API_KEY!
);

// Set up a map to keep track of clients
const clients: Map<string, any> = new Map();

// Create an HTTP server
const app = express();
const server = app.listen(3000, () => {
    console.log("Listening on port 3000");
});

// Create a WebSocket server
const wss = new WebSocketServer({ server });

wss.on("connection", (ws: any) => {
    console.log("New connection");
    let username: string | undefined;
    let controller: EntityController | undefined;
    let messageHistory: MessageHistory;
    let entityId: string | undefined;

    const handlePlaceEvent = (event: NotifyPlaceEvent) => {
        console.log("place_event", event);
        ws.send(
            JSON.stringify({
                type: "place_event",
                message: event,
            })
        );
    };

    ws.on("message", async (message: any) => {
        try {
            console.log("message", message.toString());
            const msg = JSON.parse(message.toString());
            if (msg.type === "login" || msg.type === "register") {
                if (clients.has(msg.username)) {
                    console.log("User is already connected");
                    ws.send(
                        JSON.stringify({
                            type: "error",
                            message: "User is already connected",
                        })
                    );
                } else {
                    if (msg.type === "login") {
                        if (!userRegistry.login(msg.username, msg.password)) {
                            console.log("Invalid credentials");
                            ws.send(
                                JSON.stringify({
                                    type: "error",
                                    message: "Invalid credentials",
                                })
                            );
                            ws.close();
                            return;
                        }
                    } else {
                        if (!userRegistry.register(msg.username, msg.password)) {
                            console.log("Username already exists");
                            ws.send(
                                JSON.stringify({
                                    type: "error",
                                    message: "Username already exists",
                                })
                            );
                            ws.close();
                            return;
                        }
                    }
                    console.log("creating entity");
                    entityId = worldGridManager.createEntity(
                        { x: 0, y: 0 },
                        "player",
                        msg.username
                    ); // Initialize an entity at the start location
                    console.log("creating entity controller");
                    controller = new EntityController(
                        entityId,
                        worldGridManager,
                        database
                    );
                    controller.on("place_event", handlePlaceEvent);
                    controller.init();
                    clients.set(msg.username, { ws, controller });
                    console.log("Added client", msg.username);
                    ws.send(
                        JSON.stringify({
                            type: "login",
                            message: `Welcome to TypeQuest, ${
                                msg.username
                            }!\n\n${controller.examineSurroundings(false)}`,
                        })
                    );
                    username = msg.username;
                    messageHistory = new MessageHistory(30);
                }
            } else if (msg.type === "command") {
                // console.log("command message received")
                // Handle command
                if (!username || !controller) {
                    console.log(
                        `Not logged in, username: ${username}, controller: ${controller}`
                    );
                    ws.send(
                        JSON.stringify({
                            type: "error",
                            message: "Not logged in",
                        })
                    );
                } else {
                    console.log("Processing command", msg.command);
                    // Add here your logic to process the command using the corresponding EntityController
                    const output = await processCommand(
                        controller,
                        messageHistory,
                        msg.command
                    );
                    ws.send(
                        JSON.stringify({ type: "command", message: output })
                    );
                }
            }
        } catch (err: any) {
            console.error(err);
        }
    });

    ws.on("close", () => {
        console.log(`Closing connection for ${username}, entity ${entityId}`);
        if (controller) {
            controller.off("place_event", handlePlaceEvent);
            controller.destroy();
        }
        if (entityId) {
            worldGridManager.destroyEntity(entityId);
        }
        // Remove the user from the clients map when they disconnect
        if (username) {
            clients.delete(username);
        }
    });
});

async function processCommand(
    controller: EntityController,
    messageHistory: MessageHistory,
    command: string
) {
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
        case "/say":
            // trim the /say from the command
            const sayCommand = command.substring(5);
            output = controller.say(sayCommand);
            break;
        case "/emote":
            // trim the /emote from the command
            const emoteCommand = command.substring(7);
            output = controller.emote(emoteCommand);
            break;
        case "/save":
            database.save();
            output = "World saved";
            break;
        case "/help":
            output = "Commands:\n\n" +
                "/examine - examine your surroundings\n" +
                "/coordinates - show your current coordinates\n" +
                "/build - interact with the world builder ai\n" +
                "/say - say something\n" +
                "/emote - emote something\n" +
                "/save - save the world\n" +
                "/help - show this help message\n";
        case "":
            break;
        default:
            output = controller.say(command);
            break;
    }
    if (!messageHistoryHandled) {
        messageHistory.addUserMessage(command);
        messageHistory.addAssistantMessage(output);
    }
    return output;
}
