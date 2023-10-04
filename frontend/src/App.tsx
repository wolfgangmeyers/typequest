import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Container from "react-bootstrap/Container";
import Login from "./Login";
import CommandLineInterface from "./CommandLineInterface";
import { GameClient } from "./client";

const gameClient = new GameClient(`wss://typequest-api.ngrok.io`);

function App() {
    const [username, setUsername] = useState("");

    useEffect(() => {
        const onConnect = () => {
            if (username) {
                gameClient.login(username);
            }
        };
        const onDisconnect = () => {
            console.log("disconnected");
            setUsername("");
        };
        // this auto-logs the user in on connection
        gameClient.on("connect", onConnect);
        gameClient.on("disconnect", onDisconnect);
        if (username) {
            gameClient.connect();
        }
        
        return () => {
            gameClient.off("connect", onConnect);
            gameClient.off("disconnect", onDisconnect);
        }
    }, [username]);

    return username ? (
        <Container>
            <CommandLineInterface gameClient={gameClient} />
        </Container>
    ) : (
        <Login onLogin={setUsername} />
    );
}

export default App;
