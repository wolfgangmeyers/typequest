import { Database } from "./database";

export class UserRegistry {
    constructor(private database: Database) {}

    login(username: string, password: string): boolean {
        const user = this.database.getUser(username);
        if (!user) {
            return false;
        }
        return user.password === password;
    }

    register(username: string, password: string): boolean {
        const user = this.database.getUser(username);
        if (user) {
            return false;
        }
        this.database.createUser(username, password);
        return true;
    }
}