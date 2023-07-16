import React, { useState, useRef, useEffect } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { GameClient } from "./client";
import { Col, Row } from "react-bootstrap";
import { expandCommand } from "./commandhelper";

interface Props {
    gameClient: GameClient;
}

function CommandLineInterface({ gameClient }: Props) {
    const [command, setCommand] = useState("");
    const [output, setOutput] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const outputEndRef = useRef<HTMLDivElement | null>(null);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        const cmd = expandCommand(command);
        if (cmd === "/quit") {
            gameClient.disconnect();
            return;
        }
        gameClient.sendCommand(cmd);
        addToOutput(cmd);
        setCommand("");
    };

    const addToOutput = (message: string) => {
        let newOutput = [...output, message];

        // Limit history to 200 entries for performance
        if (newOutput.length > 200) {
            newOutput = newOutput.slice(newOutput.length - 200);
        }

        setOutput(newOutput);
    };

    gameClient.on("login", (message: any) => {
        addToOutput(message);
    });
    gameClient.on("command", (message: any) => {
        addToOutput(message);
    });
    gameClient.on("connect", () => {
        setOutput([]);
    });

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    useEffect(() => {
        if (outputEndRef.current) {
            outputEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [output]);

    return (
        <div>
            <div
                style={{
                    overflowY: "scroll",
                    height: "500px",
                    wordWrap: "break-word",
                    marginBottom: "16px"
                }}
            >
                {output.map((message, index) => (
                    <div key={index}>{message}</div>
                ))}
                <div ref={outputEndRef} />
            </div>
            <hr/>
            <Form onSubmit={handleSubmit}>
                <Row>
                    <Form.Group as={Col} controlId="commandForm">
                        <Form.Control
                            type="text"
                            placeholder="Enter command"
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                            ref={inputRef}
                        />
                    </Form.Group>
                    <Col xs="auto">
                        <Button variant="primary" type="submit">
                            Send
                        </Button>
                    </Col>
                </Row>
            </Form>
        </div>
    );
}

export default CommandLineInterface;
