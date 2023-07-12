
import * as nanoId from "nanoid";
import { Coordinates, Entity } from "./models";

export interface IEntityManager {
    createEntity(coordinates: Coordinates): string;
    getEntity(id: string): Entity | undefined;
    destroyEntity(id: string): boolean;
}

export class EntityManager implements IEntityManager {
    private entities: Map<string, Entity>;

    constructor() {
        this.entities = new Map();
    }

    public createEntity(coordinates: Coordinates): string {
        const id = nanoId.nanoid();
        const entity = { id, coordinates };
        this.entities.set(id, entity);
        return id;
    }

    public getEntity(id: string): Entity | undefined {
        return this.entities.get(id);
    }

    public destroyEntity(id: string): boolean {
        return this.entities.delete(id);
    }
}

