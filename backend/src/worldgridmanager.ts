import { Database } from "./database";
import { Coordinates, EntityType, NotifyPlaceEvent } from "./models";

export interface MoveEntityResult {
    success: boolean;
    oldCoordinates?: Coordinates;
    newCoordinates?: Coordinates;
    message?: string;
}

type NotifyPlaceListener = (event: NotifyPlaceEvent) => void;
type NotifyPlaceListeners = {[key: string]: {[key: string]: NotifyPlaceListener}};

const oppositeDirections: {[key: string]: string} = {
    north: "south",
    south: "north",
    east: "west",
    west: "east",
};

export class WorldGridManager {
    private worldGrid: Database;
    private notifyPlaceListeners: NotifyPlaceListeners = {};

    constructor(worldGrid: Database) {
        this.worldGrid = worldGrid;
    }

    init(): void {
        this.worldGrid.init();
        if (!this.worldGrid.getPlace(0, 0)) {
            this.worldGrid.createPlace({ x: 0, y: 0 }, "You are standing in an empty field.", "You are standing in an empty field. There is nothing of interest here.");
        }
    }

    public addNotifyPlaceListener(coordinates: Coordinates, entityId: string, listener: NotifyPlaceListener) {
        const key = `${coordinates.x},${coordinates.y}`;
        if (!this.notifyPlaceListeners[key]) {
            this.notifyPlaceListeners[key] = {};
        }
        this.notifyPlaceListeners[key][entityId] = listener;
    }

    public removeNotifyPlaceListener(coordinates: Coordinates, entityId: string) {
        const key = `${coordinates.x},${coordinates.y}`;
        if (!this.notifyPlaceListeners[key]) {
            return;
        }
        const listeners = this.notifyPlaceListeners[key];
        if (!listeners[entityId]) {
            return;
        }
        delete listeners[entityId];
    }

    public notifyPlace(event: NotifyPlaceEvent) {
        const key = `${event.x},${event.y}`;
        if (!this.notifyPlaceListeners[key]) {
            return;
        }
        const listeners = this.notifyPlaceListeners[key];
        Object.keys(listeners).forEach((entityId) => {
            if (event.sourceEntity && entityId === event.sourceEntity) {
                return;
            }
            const listener = listeners[entityId];
            listener(event);
        });
    }

    public moveEntity(entityId: string, direction: string): MoveEntityResult {
        // Logic to move entity to newCoordinates.
        // Check if the move is valid, update the entity's coordinates,
        // and update the entityIds in the respective places.
        // Return true if the move was successful, false otherwise.
        const entity = this.worldGrid.getEntity(entityId);
        if (!entity) {
            return {
                success: false,
                message: "Are you real? I don't seem to have a record of you.",
            };
        }
        const oldCoordinates = entity.coordinates;
        const newCoordinates = this.getNewCoordinates(direction, oldCoordinates);
        if (!newCoordinates) {
            return {
                success: false,
                message: "You can't move that way.",
            };
        }
        const oldPlace = this.worldGrid.getPlace(oldCoordinates.x, oldCoordinates.y);
        const newPlace = this.worldGrid.getPlace(newCoordinates.x, newCoordinates.y);
        if (!oldPlace || !newPlace) {
            return {
                success: false,
                message: "You can't move that way.",
            };
        }
        if (oldPlace.blockedDirections) {
            const blocked = oldPlace.blockedDirections[direction];
            if (blocked) {
                return {
                    success: false,
                    message: blocked,
                };
            }
        }
        const i = oldPlace.entityIds.indexOf(entityId);
        if (i < 0) {
            return {
                success: false,
                message: "You can't move that way.",
            };
        }
        oldPlace.entityIds.splice(i, 1);
        newPlace.entityIds.push(entityId);
        entity.coordinates = newCoordinates;
        // notify place listeners that entity has left
        this.notifyPlace({
            x: oldCoordinates.x,
            y: oldCoordinates.y,
            sourceEntity: entityId,
            message: `${entity.name} has left to the ${direction}.`,
        })
        // notify place listeners that entity has arrived
        this.notifyPlace({
            x: newCoordinates.x,
            y: newCoordinates.y,
            sourceEntity: entityId,
            message: `${entity.name} has arrived from the ${oppositeDirections[direction]}.`,
        })
        return {
            success: true,
            oldCoordinates,
            newCoordinates,
        };
    }

    private getNewCoordinates(
        direction: string,
        currentCoordinates: Coordinates
    ): Coordinates | null {
        switch (direction.toLowerCase()) {
            case "north":
                return { x: currentCoordinates.x, y: currentCoordinates.y - 1 };
            case "south":
                return { x: currentCoordinates.x, y: currentCoordinates.y + 1 };
            case "east":
                return { x: currentCoordinates.x + 1, y: currentCoordinates.y };
            case "west":
                return { x: currentCoordinates.x - 1, y: currentCoordinates.y };
            default:
                return null;
        }
    }

    public createEntity(coordinates: Coordinates, type: EntityType, name: string): string {
        const entity = this.worldGrid.createEntity(coordinates, type, name);
        const place = this.worldGrid.getPlace(entity.coordinates.x, entity.coordinates.y);
        if (!place) {
            return entity.id;
        }
        place.entityIds.push(entity.id);
        return entity.id;
    }

    public destroyEntity(entityId: string): boolean {
        const entity = this.worldGrid.getEntity(entityId);
        if (!entity) {
            return false;
        }
        const place = this.worldGrid.getPlace(entity.coordinates.x, entity.coordinates.y);
        if (!place) {
            return false;
        }
        const i = place.entityIds.indexOf(entityId);
        if (i < 0) {
            return false;
        }
        place.entityIds.splice(i, 1);
        this.worldGrid.destroyEntity(entityId);
        this.notifyPlace({
            x: entity.coordinates.x,
            y: entity.coordinates.y,
            sourceEntity: entityId,
            message: `${entity.name} vanishes into thin air.`,
        })
        return true;
    }

    public savePlace(coordinates: Coordinates, description: string, detailedDescription: string) {
        const place = this.worldGrid.getPlace(coordinates.x, coordinates.y);
        if (place) {
            place.description = description;
            place.detailedDescription = detailedDescription;
            return;
        }
        this.worldGrid.createPlace(coordinates, description, detailedDescription);
    }

    public destroyPlace(coordinates: Coordinates): string {
        const place = this.worldGrid.getPlace(coordinates.x, coordinates.y);
        if (!place) {
            return `There is nothing to destroy at ${coordinates.x}, ${coordinates.y}.`;
        }
        if (place.entityIds.length > 0) {
            return `The place is not empty of entities.`;
        }
        this.worldGrid.destroyPlace(coordinates);
        return `Destroyed place at ${coordinates.x}, ${coordinates.y}.`;
    }

    public getPlace(x: number, y: number) {
        return this.worldGrid.getPlace(x, y);
    }
}
