import EventEmitter from "events";
import { Database } from "./database";
import { Coordinates, NotifyPlaceEvent } from "./models";
import { WorldGridManager } from "./worldgridmanager";

export class EntityController extends EventEmitter {
    private entityId: string;
    private worldGridManager: WorldGridManager;
    private onPlaceEvent = (event: NotifyPlaceEvent) => this.emit("place_event", event);

    constructor(
        entityId: string,
        worldGridManager: WorldGridManager,
        private database: Database,
    ) {
        super();
        this.entityId = entityId;
        this.worldGridManager = worldGridManager;
    }

    public init() {
        const entity = this.database.getEntity(this.entityId);
        if (!entity) {
            throw new Error("Entity not found");
        }
        this.worldGridManager.notifyPlace({
            x: 0,
            y: 0,
            sourceEntity: this.entityId,
            message: `${entity.name} materializes out of thin air.`,
        })
        this.worldGridManager.addNotifyPlaceListener(
            this.database.getEntity(this.entityId)!.coordinates,
            this.entityId,
            this.onPlaceEvent
        )
    }

    public destroy() {
        this.worldGridManager.removeNotifyPlaceListener(
            this.database.getEntity(this.entityId)!.coordinates,
            this.entityId
        )
    }

    // TODO: ******** a way to subscribe to the world grid manager to receive events, and emit events to the client
    public move(direction: string): string {
        const entity = this.database.getEntity(this.entityId);
        // console.log("Moving entity", entity)
        if (entity) {
            const result = this.worldGridManager.moveEntity(
                this.entityId,
                direction
            );
            if (result.success) {
                this.worldGridManager.removeNotifyPlaceListener(result.oldCoordinates!, this.entityId);
                this.worldGridManager.addNotifyPlaceListener(result.newCoordinates!, this.entityId, this.onPlaceEvent);
                const coordinates = entity.coordinates;
                const place = this.database.getPlace(coordinates.x, coordinates.y);
                if (place) {
                    return this.examineSurroundings(false);
                } else {
                    return "You see nothing special.";
                }
            }
            return result.message || "You can't move that way.";
        }
        return "Are you real? I don't seem to have a record of you.";
    }

    public examineSurroundings(detailed = true): string {
        const entity = this.database.getEntity(this.entityId);
        if (entity) {
            const place = this.database.getPlace(
                entity.coordinates.x,
                entity.coordinates.y
            );
            if (place) {
                let description = detailed
                    ? place.detailedDescription!
                    : place.description!;
                const filteredEntities = place.entityIds.filter(
                    (entityId) => entityId !== this.entityId
                );
                if (filteredEntities.length > 0) {
                    description += "\n\nYou see:";
                    filteredEntities.forEach((entityId) => {
                        const entity = this.database.getEntity(entityId);
                        if (entity) {
                            description += `\n* ${entity.name} (${entity.type})`;
                        }
                    });
                }
                return description;
            }
        }
        return "You see nothing special.";
    }

    public coordinates(): string {
        const entity = this.database.getEntity(this.entityId);
        if (entity) {
            return `You are at ${entity.coordinates.x}, ${entity.coordinates.y}.`;
        }
        return "Are you real? I don't seem to have a record of you.";
    }

    public say(message: string): string {
        const entity = this.database.getEntity(this.entityId);
        if (entity) {
            this.worldGridManager.notifyPlace({
                x: entity.coordinates.x,
                y: entity.coordinates.y,
                sourceEntity: this.entityId,
                message: `${entity.name} says: "${message}"`,
            });
        }
        return `You say: "${message}"`
    }

    public emote(message: string): string {
        const entity = this.database.getEntity(this.entityId);
        if (entity) {
            const output = `${entity.name} ${message}`
            this.worldGridManager.notifyPlace({
                x: entity.coordinates.x,
                y: entity.coordinates.y,
                sourceEntity: this.entityId,
                message: output,
            });
            return output;
        }
        return `You don't exist.`
    }
}
