import { WorldState } from "./database";
import { EntityManager } from "./entittymanager";
import { Coordinates } from "./models";
import { WorldGridManager } from "./worldgridmanager";

export class EntityController {
    private entityId: string;
    private worldGridManager: WorldGridManager;

    constructor(
        entityId: string,
        worldGridManager: WorldGridManager,
        private entityManager: EntityManager,
        private grid: WorldState
    ) {
        this.entityId = entityId;
        this.worldGridManager = worldGridManager;
    }

    public move(direction: string): string {
        const entity = this.entityManager.getEntity(this.entityId);
        // console.log("Moving entity", entity)
        if (entity) {
            const result = this.worldGridManager.moveEntity(
                this.entityId,
                direction
            );
            if (result.success) {
                const coordinates = entity.coordinates;
                const place = this.grid.getPlace(coordinates.x, coordinates.y);
                if (place) {
                    return place.description!;
                } else {
                    return "You see nothing special.";
                }
            }
            return result.message || "You can't move that way.";
        }
        return "Are you real? I don't seem to have a record of you.";
    }

    public examineSurroundings(detailed = true): string {
        const entity = this.entityManager.getEntity(this.entityId);
        if (entity) {
            const place = this.grid.getPlace(
                entity.coordinates.x,
                entity.coordinates.y
            );
            if (place) {
                return detailed
                    ? place.detailedDescription!
                    : place.description!;
            }
        }
        return "You see nothing special.";
    }

    public coordinates(): string {
        const entity = this.entityManager.getEntity(this.entityId);
        if (entity) {
            return `You are at ${entity.coordinates.x}, ${entity.coordinates.y}.`;
        }
        return "Are you real? I don't seem to have a record of you.";
    }
}
