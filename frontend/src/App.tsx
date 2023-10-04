import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Container from "react-bootstrap/Container";
import Login from "./Login";
import CommandLineInterface from "./CommandLineInterface";
import { GameClient } from "./client";

const gameClient = new GameClient(`wss://typequest-api.ngrok.io`);

interface Credentials {
    username: string;
    password: string;
}

function App() {
    const [login, setLogin] = useState<Credentials | null>(null);
    const [register, setRegister] = useState<Credentials | null>(null);

    useEffect(() => {
        const onConnect = () => {
            console.log("connected");
            if (login) {
                console.log("logging in")
                gameClient.login(login.username, login.password);
            }
            if (register) {
                console.log("registering")
                gameClient.register(register.username, register.password);
            }
        };
        const onDisconnect = () => {
            console.log("disconnected");
            setLogin(null);
            setRegister(null);
        };
        // this auto-logs the user in on connection
        gameClient.on("connect", onConnect);
        gameClient.on("disconnect", onDisconnect);
        if (login || register) {
            console.log("connecting");
            gameClient.connect();
        }
        
        return () => {
            gameClient.off("connect", onConnect);
            gameClient.off("disconnect", onDisconnect);
        }
    }, [login, register]);

    return (login || register) ? (
        <Container>
            <CommandLineInterface gameClient={gameClient} />
        </Container>
    ) : (
        <Login onLogin={(username: string, password: string) => setLogin({
            username,
            password,
        })} onRegister={(username: string, password: string) => setRegister({
            username,
            password,
        })} />
    );
}

export default App;
