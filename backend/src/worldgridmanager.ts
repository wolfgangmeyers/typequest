import { WorldGrid } from "./database";
import { IEntityManager } from "./entittymanager";
import { Coordinates } from "./models";

export class WorldGridManager {
    private worldGrid: WorldGrid;
    private entityManager: IEntityManager;

    constructor(worldGrid: WorldGrid, entityManager: IEntityManager) {
        this.worldGrid = worldGrid;
        this.entityManager = entityManager;
    }

    init(): void {
        this.worldGrid.init();
        if (!this.worldGrid.getPlace(0, 0)) {
            this.worldGrid.createPlace({ x: 0, y: 0 }, "You are standing in an empty field.", "You are standing in an empty field. There is nothing of interest here.");
        }
    }

    public moveEntity(entityId: string, newCoordinates: Coordinates): boolean {
        // Logic to move entity to newCoordinates.
        // Check if the move is valid, update the entity's coordinates,
        // and update the entityIds in the respective places.
        // Return true if the move was successful, false otherwise.
        const entity = this.entityManager.getEntity(entityId);
        if (!entity) {
            return false;
        }
        const oldCoordinates = entity.coordinates;
        const oldPlace = this.worldGrid.getPlace(oldCoordinates.x, oldCoordinates.y);
        const newPlace = this.worldGrid.getPlace(newCoordinates.x, newCoordinates.y);
        if (!oldPlace || !newPlace) {
            return false;
        }
        const i = oldPlace.entityIds.indexOf(entityId);
        if (i < 0) {
            return false;
        }
        oldPlace.entityIds.splice(i, 1);
        newPlace.entityIds.push(entityId);
        entity.coordinates = newCoordinates;
        return true;
    }

    public createEntity(coordinates: Coordinates): string {
        const entityId = this.entityManager.createEntity(coordinates);
        const place = this.worldGrid.getPlace(coordinates.x, coordinates.y);
        if (!place) {
            return entityId;
        }
        place.entityIds.push(entityId);
        return entityId;
    }

    public destroyEntity(entityId: string): boolean {
        const entity = this.entityManager.getEntity(entityId);
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
        this.entityManager.destroyEntity(entityId);
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
}
