import { Position } from './types';

export class Food {
    private positions: Position[] = [];
    private boardSize: number;
    private foodCount: number = 3; // Number of food items to maintain

    constructor(boardSize: number) {
        this.boardSize = boardSize;
        // Initialize with initial food
        this.spawnInitialFood();
    }

    public getPositions(): Position[] {
        return this.positions;
    }

    private spawnInitialFood(): void {
        // Spawn initial food items
        for (let i = 0; i < this.foodCount; i++) {
            this.addNewFood([]);
        }
    }

    public respawn(snakeBody: Position[]): void {
        // Find eaten food positions
        const eatenPositions = this.positions.filter(pos => 
            snakeBody.some(segment => segment.x === pos.x && segment.y === pos.y)
        );

        // Remove eaten food
        this.positions = this.positions.filter(pos => 
            !snakeBody.some(segment => segment.x === pos.x && segment.y === pos.y)
        );

        // Spawn new food for each eaten position
        eatenPositions.forEach(() => {
            this.addNewFood(snakeBody);
        });

        // Ensure we have exactly foodCount pieces of food
        while (this.positions.length < this.foodCount) {
            this.addNewFood(snakeBody);
        }
    }

    private addNewFood(snakeBody: Position[]): void {
        let newPosition: Position;
        let attempts = 0;
        const maxAttempts = 100;

        do {
            newPosition = {
                x: Math.floor(Math.random() * this.boardSize),
                y: Math.floor(Math.random() * this.boardSize)
            };
            attempts++;

            // Check if position is valid (not on snake or existing food)
            const isValid = !this.isPositionOccupied(newPosition, snakeBody);

            if (isValid) {
                this.positions.push(newPosition);
                break;
            }
        } while (attempts < maxAttempts);
    }

    private isPositionOccupied(position: Position, snakeBody: Position[]): boolean {
        // Check if position is on snake
        const isOnSnake = snakeBody.some(segment => 
            segment.x === position.x && segment.y === position.y
        );

        // Check if position is on existing food
        const isOnFood = this.positions.some(foodPos => 
            foodPos.x === position.x && foodPos.y === position.y
        );

        return isOnSnake || isOnFood;
    }
} 