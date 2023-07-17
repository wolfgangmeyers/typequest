import fs from "fs";
import { Coordinates, Entity, EntityType, Place } from "./models";
import { nanoid } from "nanoid";

const GRID_DATA_FILE = "grid.json";

interface WorldState {
    places: { [key: string]: Place };
    entitiesById: { [key: string]: Entity };
    playerEntities: { [key: string]: Entity };
}

export class Database {
    private worldState: WorldState;
    private saveIntervalHandle: NodeJS.Timeout | null;

    constructor(
        private saveInterval = 60 * 1000,
        private dataFile = GRID_DATA_FILE
    ) {
        this.worldState = {
            places: {},
            entitiesById: {},
            playerEntities: {},
        };
        this.saveIntervalHandle = null;
    }

    createPlace(
        coordinates: Coordinates,
        description: string,
        detailedDescription: string
    ): Place {
        const place: Place = {
            entityIds: [],
            coordinates,
            description,
            detailedDescription,
        };
        const key = this.generateKey(coordinates);
        this.worldState.places[key] = place;
        return place;
    }

    destroyPlace(coordinates: Coordinates): boolean {
        const key = this.generateKey(coordinates);
        if (this.worldState.places[key]) {
            delete this.worldState.places[key];
            return true;
        }
        return false;
    }

    private generateKey(coordinates: Coordinates): string {
        return `${coordinates.x},${coordinates.y}`;
    }

    getPlace(x: number, y: number): Place | undefined {
        const key = this.generateKey({ x, y });
        return this.worldState.places[key];
    }

    updateDescription(x: number, y: number, newDescription: string): void {
        const key = this.generateKey({ x, y });
        const place = this.worldState.places[key];

        if (place) {
            place.description = newDescription;
            this.worldState.places[key] = place;
        }
    }

    public createEntity(
        defaultCoordinates: Coordinates,
        type: EntityType,
        name: string
    ): Entity {
        let entity: Entity | null = null;
        if (type === "player") {
            entity = this.worldState.playerEntities[name];
            if (!entity) {
                entity = { id: nanoid(), coordinates: defaultCoordinates, type, name };
                this.worldState.playerEntities[name] = entity;
            } else {
                entity = JSON.parse(JSON.stringify(entity));
            }
        } else {
            entity = { id: nanoid(), coordinates: defaultCoordinates, type, name };
        }
        this.worldState.entitiesById[entity!.id] = entity!;
        return entity!;
    }

    public getEntity(id: string): Entity | undefined {
        return this.worldState.entitiesById[id];
    }

    public destroyEntity(id: string): boolean {
        const entity = this.worldState.entitiesById[id];
        if (entity) {
            if (entity.type === "player") {
                this.worldState.playerEntities[entity.name] = JSON.parse(
                    JSON.stringify(entity)
                );
            }
            delete this.worldState.entitiesById[id];
            return true;
        }
        return false;
    }

    init(): void {
        // Load grid data from file
        if (fs.existsSync(this.dataFile)) {
            const data = fs.readFileSync(this.dataFile, "utf-8");
            this.worldState = JSON.parse(data);
        }
        this.saveIntervalHandle = setInterval(() => {
            this.save();
        }, this.saveInterval); // Save every minute
    }

    save(): void {
        // console.log("Saving grid data...");
        const data = JSON.stringify(this.worldState);
        fs.writeFileSync(this.dataFile, data);
    }

    destroy(): void {
        if (this.saveIntervalHandle) {
            clearInterval(this.saveIntervalHandle);
            this.saveIntervalHandle = null;
        }
    }
}
