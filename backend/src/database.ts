import fs from "fs";
import { Coordinates, Place } from "./models";

const GRID_DATA_FILE = "grid.json";

export class WorldGrid {
    private places: Map<string, Place>;
    private saveIntervalHandle: NodeJS.Timeout | null;

    constructor(private saveInterval = 60 * 1000, private dataFile = GRID_DATA_FILE) {
        this.places = new Map();
        this.saveIntervalHandle = null;
    }

    createPlace(coordinates: Coordinates, description: string, detailedDescription: string): Place {
        const place: Place = {
            entityIds: [],
            coordinates,
            description,
            detailedDescription,
        }
        const key = this.generateKey(coordinates);
        this.places.set(key, place);
        return place;
    }

    destroyPlace(coordinates: Coordinates): boolean {
        const key = this.generateKey(coordinates);
        return this.places.delete(key);
    }

    private generateKey(coordinates: Coordinates): string {
        return `${coordinates.x},${coordinates.y}`;
    }

    getPlace(x: number, y: number): Place | undefined {
        const key = this.generateKey({ x, y });
        return this.places.get(key);
    }

    updateDescription(x: number, y: number, newDescription: string): void {
        const key = this.generateKey({ x, y });
        const place = this.places.get(key);

        if (place) {
            place.description = newDescription;
            this.places.set(key, place);
        }
    }

    init(): void {
        // Load grid data from file
        if (fs.existsSync(this.dataFile)) {
            const data = fs.readFileSync(this.dataFile, "utf-8");
            const gridData = JSON.parse(data) as [string, Place][];
            this.places = new Map(gridData);

            // console.log(`Loaded ${this.places.size} places from file.`);
            // for (const [key, place] of this.places.entries()) {
            //     console.log(`Place at ${key}: ${place.description}`);
            // }
        }
        this.saveIntervalHandle = setInterval(() => {
            // console.log("Saving grid data...");
            const data = JSON.stringify(Array.from(this.places.entries()));
            fs.writeFileSync(this.dataFile, data);
        }, this.saveInterval); // Save every minute
    }

    destroy(): void {
        if (this.saveIntervalHandle) {
            clearInterval(this.saveIntervalHandle);
            this.saveIntervalHandle = null;
        }
    }
}