import React, { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import { Row } from "react-bootstrap";

interface Props {
    onLogin: (username: string) => void;
}

function Login({ onLogin }: Props) {
    const [username, setUsername] = useState("");

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        onLogin(username);
    };

    return (
        <Container className="d-flex h-100" style={{width: "100%"}}>
            <Row className="m-auto">
                <Card style={{ width: "18rem" }} className="mx-auto">
                    <Card.Body>
                        <Card.Title>Login</Card.Title>
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
                            <Button variant="primary" type="submit">
                                Login
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
            </Row>
        </Container>
    );
}

export default Login;
