import { ChatCompletionRequestMessage } from "openai";

export class MessageHistory {
    private messageHistory: ChatCompletionRequestMessage[] = [];

    constructor(private maxHistory: number) {
    }

    public addMessage(message: ChatCompletionRequestMessage) {
        this.messageHistory.push(message);
        if (this.messageHistory.length > this.maxHistory) {
            this.messageHistory.shift();
        }
    }

    public addUserMessage(message: string) {
        this.addMessage({
            role: "user",
            content: message,
        });
    }

    public addAssistantMessage(message: string) {
        this.addMessage({
            role: "assistant",
            content: message,
        });
    }

    public getHistory() {
        return this.messageHistory;
    }

    public clearHistory() {
        this.messageHistory = [];
    }
}