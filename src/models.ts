// Define a type for the coordinates on the grid
export type Coordinates = {
    x: number;
    y: number;
};

// Define an interface for a Place
export interface Place {
    coordinates: Coordinates;
    description: string;
    detailedDescription: string;
    entityIds: string[];
    // Additional properties such as items and events can be added later
};

export interface Entity {
    id: string;
    coordinates: Coordinates;
    // Additional properties such as name, inventory, etc.
};
