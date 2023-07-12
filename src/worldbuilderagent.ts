import {
    OpenAIApi,
    Configuration,
    ChatCompletionRequestMessage,
    ChatCompletionRequestMessageFunctionCall,
} from "openai"; // You'll need to install the OpenAI npm package
import process from "process";
import { WorldGridManager } from "./worldgridmanager";
import { AxiosResponse } from "axios";

export class WorldBuilderAgent {
    private worldGridManager: WorldGridManager;
    private openAI: OpenAIApi;
    private messageHistory: ChatCompletionRequestMessage[] = [];
    private functionMap: Map<string, (a: any) => Promise<string>> = new Map();

    constructor(worldGridManager: WorldGridManager, apiKey: string) {
        this.worldGridManager = worldGridManager;
        this.openAI = new OpenAIApi(
            new Configuration({
                apiKey: apiKey,
            })
        );
        this.functionMap.set("savePlace", this.savePlace.bind(this));
        this.functionMap.set("clearHistory", this.clearHistory.bind(this));
        this.functionMap.set("destroyPlace", this.destroyPlace.bind(this));
    }

    private async completion(prompt: string): Promise<any> {
        const userMessage: ChatCompletionRequestMessage = {
            role: "user",
            content: prompt,
        };
        try {
            const response = await this.openAI.createChatCompletion({
                // model: "gpt-3.5-turbo-16k",
                model: "gpt-3.5-turbo-0613",
                messages: [
                    {
                        role: "system",
                        content: `You are a world builder AI. You are tasked with creating a world for a text-based RPG.
    
    Functions have been provided to allow you to interact with the world building platform.`,
                    },
                    ...this.messageHistory,
                    userMessage,
                ],
                functions: agentFunctions,
                max_tokens: 1024, // Adjust this as needed
                temperature: 0.7,
            });
    
            const message = response.data.choices[0].message;
            if (!message) {
                throw new Error("Failed to process result.");
            }
            this.messageHistory.push(userMessage);
            this.messageHistory.push(message);
            if (message.function_call) {
                return message.function_call;
            }
            const result = response.data.choices[0].message?.content?.trim();
            if (!result) {
                throw new Error("Failed to generate description.");
            }
            return result;
        } catch (err: any) {
            if (err.response) {
                const response = err.response as AxiosResponse;
                console.error(JSON.stringify(response.data, null, 2));
                // exit process
                process.exit(1);
            }
            throw err;
        }
        
    }

    public async processCommand(command: string): Promise<string> {
        const result = await this.completion(command);
        // console.log("RESULT", JSON.stringify(result, null, 2));
        // if result is a string, return it
        // if result is a function call, execute it and return the result
        if (typeof result === "string") {
            return result;
        }
        const fcall = result as ChatCompletionRequestMessageFunctionCall;
        const fn = this.functionMap.get(fcall.name!);
        if (!fn) {
            return "Unknown function.";
        }
        const input = JSON.parse(fcall.arguments!);
        const fnResult = await fn(input);
        // The output of the function call should be included in the chat history
        this.messageHistory.push({
            role: "user",
            content: fnResult,
        });
        return fnResult;
    }

    private async savePlace(input: SavePlaceInput): Promise<string> {
        const success = this.worldGridManager.savePlace({
            x: input.x,
            y: input.y,
        }, input.description, input.detailedDescription);
        if (success) {
            return "Place created.";
        }
        return "A place already exists at that location.";
    }

    private async destroyPlace(input: DestroyPlaceInput): Promise<string> {
        return this.worldGridManager.destroyPlace({
            x: input.x,
            y: input.y,
        });
    }


    private async clearHistory(): Promise<string> {
        this.messageHistory = [];
        return "History cleared.";
    }
}

interface SavePlaceInput {
    x: number;
    y: number;
    description: string;
    detailedDescription: string;
}

interface DestroyPlaceInput {
    x: number;
    y: number;
}

const agentFunctions = [
    {
        name: "savePlace",
        description:
            "Create or update a place in the world grid at x, y with the given description and detailed description.",
        // parameters are specified in json schema format
        parameters: {
            type: "object",
            properties: {
                x: {
                    type: "integer",
                },
                y: {
                    type: "integer",
                },
                description: {
                    type: "string",
                    description: "A description of the place as the player sees when they enter the place.",
                },
                detailedDescription: {
                    type: "string",
                    description: "A detailed description of the place that the player sees when they examine the place.",
                },
            },
            required: ["x", "y", "description", "detailedDescription"],
        },
    },
    {
        name: "destroyPlace",
        description: "Destroy the place at x, y.",
        parameters: {
            type: "object",
            properties: {
                x: {
                    type: "integer",
                },
                y: {
                    type: "integer",
                },
            },
        },
        required: ["x", "y"],
    },
    {
        name: "clearHistory",
        description: "Clear the chat history.",
        // TODO: this blows up
    }
];
