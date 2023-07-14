import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Container from "react-bootstrap/Container";
import Login from "./Login";
import CommandLineInterface from "./CommandLineInterface";
import { GameClient } from "./client";

const gameClient = new GameClient("ws://localhost:3000");

function App() {
    const [username, setUsername] = useState("");

    const handleLogin = (username: string) => {
        // TODO: deal with username taken... etc.
        gameClient.connect();
        // this auto-logs the user in on connection
        gameClient.on("connect", () => {
            gameClient.login(username);
            setUsername(username);
        });
        gameClient.on("disconnect", () => {
            console.log("disconnected");
            setUsername("");
        });
    };

    return username ? (
        <Container>
            <CommandLineInterface gameClient={gameClient} />
        </Container>
    ) : (
        <Login onLogin={handleLogin} />
    );
}

export default App;
