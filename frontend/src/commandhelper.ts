const shortCommandMappings: {[key: string]: string} = {
    "n": "north",
    "s": "south",
    "e": "east",
    "w": "west",
    "/x": "/examine",
    "/c": "/coordinates",
    "/b": "/build",
    "/q": "/quit",
}

export function expandCommand(command: string): string {
    const tokens = command.split(" ");
    const firstToken = tokens[0];
    if (firstToken in shortCommandMappings) {
        tokens[0] = shortCommandMappings[firstToken];
        return tokens.join(" ");
    } else {
        return command;
    }
}