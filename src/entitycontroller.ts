import { WorldGrid } from "./database";
import { EntityManager } from "./entittymanager";
import { Coordinates } from "./models";
import { WorldGridManager } from "./worldgridmanager";

export class EntityController {
    private entityId: string;
    private worldGridManager: WorldGridManager;

    constructor(entityId: string, worldGridManager: WorldGridManager, private entityManager: EntityManager, private grid: WorldGrid) {
        this.entityId = entityId;
        this.worldGridManager = worldGridManager;
    }

    private getNewCoordinates(direction: string, currentCoordinates: Coordinates): Coordinates | null {
        switch (direction.toLowerCase()) {
            case 'north':
                return { x: currentCoordinates.x, y: currentCoordinates.y - 1 };
            case 'south':
                return { x: currentCoordinates.x, y: currentCoordinates.y + 1 };
            case 'east':
                return { x: currentCoordinates.x + 1, y: currentCoordinates.y };
            case 'west':
                return { x: currentCoordinates.x - 1, y: currentCoordinates.y };
            default:
                return null;
        }
    }

    public move(direction: string): boolean {
        const entity = this.entityManager.getEntity(this.entityId);
        // console.log("Moving entity", entity)
        if (entity) {
            const newCoordinates = this.getNewCoordinates(direction, entity.coordinates);
            // console.log("New coordinates", newCoordinates)
            if (newCoordinates) {
                return this.worldGridManager.moveEntity(this.entityId, newCoordinates);
            }
        }
        return false;
    }

    public examineSurroundings(): string {
        const entity = this.entityManager.getEntity(this.entityId);
        if (entity) {
            const place = this.grid.getPlace(entity.coordinates.x, entity.coordinates.y);
            if (place) {
                return place.detailedDescription!;
            }
        }
        return 'You see nothing special.';
    }

    public coordinates(): Coordinates | null {
        const entity = this.entityManager.getEntity(this.entityId);
        if (entity) {
            return entity.coordinates;
        }
        return null;
    }
}
