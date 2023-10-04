import React, { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import { Row } from "react-bootstrap";

interface Props {
    onLogin: (username: string, password: string) => void;
    onRegister: (username: string, password: string) => void;
}

function Login({ onLogin, onRegister }: Props) {
    const [registering, setRegistering] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (registering) {
            onRegister(username, password);
            return;
        }
        onLogin(username, password);
    };

    const action = registering ? "Register" : "Login";

    return (
        <Container className="d-flex h-100" style={{width: "100%"}}>
            <Row className="m-auto">
                <Card style={{ width: "18rem" }} className="mx-auto">
                    <Card.Body>
                        <Card.Title>{action}</Card.Title>
                        <Form onSubmit={handleSubmit}>
                            <Form.Group controlId="loginForm" style={{marginBottom: "8px"}}>
                                <Form.Label>Username</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter username"
                                    value={username}
                                    onChange={(e) =>
                                        setUsername(e.target.value)
                                    }
                                />
                            </Form.Group>
                            <Form.Group controlId="passwordForm" style={{marginBottom: "8px"}}>
                                <Form.Label>Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                />
                            </Form.Group>
                            <Button variant="primary" type="submit">
                                {action}
                            </Button>
                        </Form>
                        <hr/>
                        {!registering && <>Or <a href="" onClick={
                            e => {e.preventDefault(); setRegistering(true)}
                        }>register</a> for an account.</>}
                        {registering && <>Or <a href="" onClick={
                            e => {e.preventDefault(); setRegistering(false)}
                        }>login</a> to your account.</>}
                    </Card.Body>
                </Card>
            </Row>
        </Container>
    );
}

export default Login;
