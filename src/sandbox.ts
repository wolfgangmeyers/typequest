import readline from "readline";
import { WorldGridManager } from "./worldgridmanager"; // adjust as necessary
import { EntityController } from "./entitycontroller";
import { EntityManager } from "./entittymanager";
import { WorldGrid } from "./database";
import { WorldBuilderAgent } from "./worldbuilderagent";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const worldGrid = new WorldGrid(60 * 1000, "sandbox.json");
const entityManager = new EntityManager();
const worldGridManager = new WorldGridManager(
    worldGrid,
    entityManager
);
worldGridManager.init();
const entityId = worldGridManager.createEntity({ x: 0, y: 0 }); // Initialize an entity at the start location
const controller = new EntityController(
    entityId,
    worldGridManager,
    entityManager,
    worldGrid
);

const worldBuilder = new WorldBuilderAgent(worldGridManager, process.env.OPENAI_API_KEY!);

let mode = "play";

rl.on("line", async (input) => {
    const command = input.trim().toLowerCase();
    let output: string | undefined = "";

    

    switch (command) {
        case "north":
        case "south":
        case "east":
        case "west":
            output = controller.move(command);
            break;
        case "examine":
            output = controller.examineSurroundings();
            break;
        case "coordinates":
            output = controller.coordinates();
            break;
        case "mode: build":
            mode = "build";
            output = "Entering build mode.";
            break;
        case "mode: play":
            mode = "play";
            output = "Entering play mode.";
            break;
        case "":
            break;
        default:
            if (mode === "build") {
                output = await worldBuilder.processCommand(command);
            } else {
                output = `You say, "${command}"`;
            }
    }

    console.log(output);
});

console.log(
    'Welcome to the game! You can move by typing "north", "south", "east", or "west". Examine your surroundings by typing "examine".'
);
