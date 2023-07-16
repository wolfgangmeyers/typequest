
import * as nanoId from "nanoid";
import { Coordinates, Entity, EntityType } from "./models";

export class EntityManager {
    private entities: Map<string, Entity>;

    constructor() {
        this.entities = new Map();
    }

    public createEntity(coordinates: Coordinates, type: EntityType, name: string): string {
        const id = nanoId.nanoid();
        const entity = { id, coordinates, type, name };
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
