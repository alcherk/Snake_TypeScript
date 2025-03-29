import { Position } from './types';

export class Food {
    private positions: Position[];
    private gridSize: number;
    private minFood: number = 2;
    private maxFood: number = 7;
    private spawnDelays: { [key: string]: number } = {};
    private minDelay: number = 2000; // 2 seconds minimum delay
    private maxDelay: number = 5000; // 5 seconds maximum delay

    constructor(gridSize: number) {
        this.gridSize = gridSize;
        this.positions = [];
        this.spawnInitialFood();
    }

    public getPositions(): Position[] {
        return this.positions;
    }

    public respawn(snakeBody: Position[]): void {
        // Remove eaten food
        this.positions = this.positions.filter(pos => {
            const wasEaten = snakeBody.some(segment => segment.x === pos.x && segment.y === pos.y);
            if (wasEaten) {
                // Schedule new food spawn with random delay
                this.scheduleNewFoodSpawn(snakeBody);
            }
            return !wasEaten;
        });
    }

    private spawnInitialFood(): void {
        // Spawn random number of food items between min and max
        const numFood = Math.floor(Math.random() * (this.maxFood - this.minFood + 1)) + this.minFood;
        for (let i = 0; i < numFood; i++) {
            this.addNewFood([]);
        }
    }

    private scheduleNewFoodSpawn(snakeBody: Position[]): void {
        const delay = Math.random() * (this.maxDelay - this.minDelay) + this.minDelay;
        const key = `${Date.now()}-${Math.random()}`;
        this.spawnDelays[key] = Date.now() + delay;

        // Check and spawn food after delay
        setTimeout(() => {
            if (this.positions.length < this.maxFood) {
                this.addNewFood(snakeBody);
            }
            delete this.spawnDelays[key];
        }, delay);
    }

    private addNewFood(snakeBody: Position[]): void {
        let newPosition: Position;
        do {
            newPosition = this.generateRandomPosition();
        } while (this.isPositionOccupied(newPosition, snakeBody));
        this.positions.push(newPosition);
    }

    private generateRandomPosition(): Position {
        return {
            x: Math.floor(Math.random() * this.gridSize),
            y: Math.floor(Math.random() * this.gridSize)
        };
    }

    private isPositionOccupied(position: Position, snakeBody: Position[]): boolean {
        // Check if position is occupied by snake
        const isOccupiedBySnake = snakeBody.some(segment => 
            segment.x === position.x && segment.y === position.y
        );

        // Check if position is occupied by other food
        const isOccupiedByFood = this.positions.some(food => 
            food.x === position.x && food.y === position.y
        );

        return isOccupiedBySnake || isOccupiedByFood;
    }
} 