import {
    OpenAIApi,
    Configuration,
    ChatCompletionRequestMessage,
    ChatCompletionRequestMessageFunctionCall,
} from "openai"; // You'll need to install the OpenAI npm package
import process from "process";
import { WorldGridManager } from "./worldgridmanager";
import { AxiosResponse } from "axios";
import { MessageHistory } from "./messagehistory";

export class WorldBuilderAgent {
    private worldGridManager: WorldGridManager;
    private openAI: OpenAIApi;
    private functionMap: Map<string, (a: any) => Promise<string>> = new Map();

    constructor(worldGridManager: WorldGridManager, apiKey: string) {
        this.worldGridManager = worldGridManager;
        this.openAI = new OpenAIApi(
            new Configuration({
                apiKey: apiKey,
            })
        );
        this.functionMap.set("savePlace", this.savePlace.bind(this));
        this.functionMap.set("destroyPlace", this.destroyPlace.bind(this));
        this.functionMap.set("answerQuestion", this.answerQuestion.bind(this));
    }

    private async completion(messageHistory: MessageHistory, prompt: string): Promise<any> {
        const userMessage: ChatCompletionRequestMessage = {
            role: "user",
            content: prompt,
        };
        const fullPrompt: ChatCompletionRequestMessage[] = [
            {
                role: "system",
                content: `You are a world builder AI. You are tasked with creating a world for a text-based RPG.

Functions have been provided to allow you to interact with the world building platform.`,
            },
            ...messageHistory.getHistory(),
            userMessage,
        ];

        // log full prompt for debugging
        for (const message of fullPrompt) {
            console.log(`${message.role}: ${message.content}`);
        }

        try {
            const response = await this.openAI.createChatCompletion({
                // model: "gpt-3.5-turbo-16k",
                model: "gpt-3.5-turbo-0613",
                messages: fullPrompt,
                functions: agentFunctions,
                max_tokens: 1024, // Adjust this as needed
                temperature: 0.7,
            });
            console.log("Usage", response.data.usage);
            const message = response.data.choices[0].message;
            if (!message) {
                throw new Error("Failed to process result.");
            }
            messageHistory.addMessage(userMessage);
            messageHistory.addMessage(message);
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

    public async processCommand(messageHistory: MessageHistory, command: string): Promise<string> {
        const result = await this.completion(messageHistory, command);
        // console.log("RESULT", JSON.stringify(result, null, 2));
        // if result is a string, return it
        // if result is a function call, execute it and return the result
        if (typeof result === "string") {
            return result;
        }
        const fcall = result as ChatCompletionRequestMessageFunctionCall;
        if (fcall.name === "clearHistory") {
            messageHistory.clearHistory();
            return "Chat history cleared.";
        }
        const fn = this.functionMap.get(fcall.name!);
        if (!fn) {
            return "Unknown function.";
        }
        const input = JSON.parse(fcall.arguments!);
        const fnResult = await fn(input);
        // The output of the function call should be included in the chat history
        messageHistory.addMessage({
            role: "user",
            content: fnResult,
        });
        return fnResult;
    }

    private async savePlace(input: SavePlaceInput): Promise<string> {
        console.log("Saving place", input);
        this.worldGridManager.savePlace(
            {
                x: input.x,
                y: input.y,
            },
            input.description,
            input.detailedDescription
        );
        return `Place saved at ${input.x}, ${input.y}. "${input.description}"`;
    }

    private async destroyPlace(input: DestroyPlaceInput): Promise<string> {
        console.log("Destroying place", input);
        return this.worldGridManager.destroyPlace({
            x: input.x,
            y: input.y,
        });
    }

    private async answerQuestion(answer: AnswerInput): Promise<string> {
        return answer.answer;
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

interface AnswerInput {
    answer: string;
}

const agentFunctions = [
    {
        name: "savePlace",
        description:
            "Create or update a place in the world grid at x, y with the given description and detailed description.",
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
                    description:
                        "A description of the place as the player sees when they enter the place.",
                },
                detailedDescription: {
                    type: "string",
                    description:
                        "A detailed description of the place that the player sees when they examine the place.",
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
        parameters: {
            type: "object",
            properties: {},
        },
    },
    {
        name: "answerQuestion",
        description: "If the player asks a question, provide the answer.",
        parameters: {
            type: "object",
            properties: {
                answer: {
                    type: "string",
                },
            },
            required: ["answer"],
        },
    },
];
