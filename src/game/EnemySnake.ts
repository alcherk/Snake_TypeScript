import { Position, Direction } from './types';

export class EnemySnake {
    private body: Position[];
    private direction: Direction;
    private nextDirection: Direction;
    private color: string = '#ff0000'; // Red color for enemy snake
    private isDead: boolean = false;
    private playerSnakeBody: Position[] = []; // Initialize with empty array

    constructor(startPosition: Position) {
        // Randomly choose a direction
        const directions = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
        const randomIndex = Math.floor(Math.random() * directions.length);
        this.direction = directions[randomIndex];
        this.nextDirection = this.direction;

        // Create initial body with 3 pieces, arranged based on the chosen direction
        this.body = [startPosition];
        
        // Add body segments based on the chosen direction
        switch (this.direction) {
            case Direction.UP:
                this.body.push(
                    { x: startPosition.x, y: startPosition.y + 1 },
                    { x: startPosition.x, y: startPosition.y + 2 }
                );
                break;
            case Direction.DOWN:
                this.body.push(
                    { x: startPosition.x, y: startPosition.y - 1 },
                    { x: startPosition.x, y: startPosition.y - 2 }
                );
                break;
            case Direction.LEFT:
                this.body.push(
                    { x: startPosition.x + 1, y: startPosition.y },
                    { x: startPosition.x + 2, y: startPosition.y }
                );
                break;
            case Direction.RIGHT:
                this.body.push(
                    { x: startPosition.x - 1, y: startPosition.y },
                    { x: startPosition.x - 2, y: startPosition.y }
                );
                break;
        }
    }

    public move(foodPositions: Position[], playerSnakeBody: Position[], boardWidth: number, boardHeight: number): void {
        if (this.isDead) return;

        // Store player snake body for collision checks
        this.playerSnakeBody = playerSnakeBody;

        const head = this.body[0];
        const nearestFood = this.findNearestFood(head, foodPositions);
        
        // Update direction based on nearest food
        if (nearestFood) {
            this.updateDirectionTowardsFood(head, nearestFood);
        }

        // Apply the next direction
        this.direction = this.nextDirection;

        // Calculate new head position
        const newHead = { ...head };
        switch (this.direction) {
            case Direction.UP:
                newHead.y--;
                break;
            case Direction.DOWN:
                newHead.y++;
                break;
            case Direction.LEFT:
                newHead.x--;
                break;
            case Direction.RIGHT:
                newHead.x++;
                break;
        }

        // Check for wall collision
        if (newHead.x < 0 || newHead.x >= boardWidth || newHead.y < 0 || newHead.y >= boardHeight) {
            this.isDead = true;
            return;
        }

        // Check if enemy snake ate food
        const ateFood = foodPositions.some(foodPos => 
            newHead.x === foodPos.x && newHead.y === foodPos.y
        );

        // Add new head
        this.body.unshift(newHead);

        // Remove tail only if we didn't eat food
        if (!ateFood) {
            this.body.pop();
        }

        // Check for collisions after moving
        if (this.checkCollision(newHead, playerSnakeBody.slice(1))) {
            this.isDead = true;
        }
    }

    private findNearestFood(head: Position, foodPositions: Position[]): Position | null {
        let nearestFood: Position | null = null;
        let minDistance = Infinity;

        foodPositions.forEach(food => {
            const distance = Math.abs(food.x - head.x) + Math.abs(food.y - head.y);
            if (distance < minDistance) {
                minDistance = distance;
                nearestFood = food;
            }
        });

        return nearestFood;
    }

    private updateDirectionTowardsFood(head: Position, food: Position): void {
        const possibleDirections: Direction[] = [];
        
        // Calculate distances to food
        const horizontalDistance = Math.abs(food.x - head.x);
        const verticalDistance = Math.abs(food.y - head.y);

        // Add all possible directions
        possibleDirections.push(Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT);

        // Filter out directions that would cause immediate collision
        const safeDirections = possibleDirections.filter(dir => {
            const nextPos = this.getNextPosition(head, dir);
            // Check for wall collision
            if (nextPos.x < 0 || nextPos.x >= 100 || nextPos.y < 0 || nextPos.y >= 100) {
                return false;
            }
            // Check for self collision
            if (this.checkCollision(nextPos, this.body.slice(1))) {
                return false;
            }
            // Check for player snake collision
            if (this.checkCollision(nextPos, this.playerSnakeBody)) {
                return false;
            }
            return true;
        });

        // If we have safe directions, choose one
        if (safeDirections.length > 0) {
            // Prioritize the direction that gets us closer to food
            if (horizontalDistance > verticalDistance) {
                // Prioritize horizontal movement
                const horizontalDir = food.x < head.x ? Direction.LEFT : Direction.RIGHT;
                if (safeDirections.includes(horizontalDir)) {
                    this.nextDirection = horizontalDir;
                    return;
                }
            } else {
                // Prioritize vertical movement
                const verticalDir = food.y < head.y ? Direction.UP : Direction.DOWN;
                if (safeDirections.includes(verticalDir)) {
                    this.nextDirection = verticalDir;
                    return;
                }
            }

            // If we couldn't choose a prioritized direction, pick a random safe one
            const randomIndex = Math.floor(Math.random() * safeDirections.length);
            this.nextDirection = safeDirections[randomIndex];
        } else {
            // If no safe directions, try to find a path that leads to safety
            const escapeDirections = possibleDirections.filter(dir => {
                const nextPos = this.getNextPosition(head, dir);
                // Check for wall collision
                if (nextPos.x < 0 || nextPos.x >= 100 || nextPos.y < 0 || nextPos.y >= 100) {
                    return false;
                }
                // Check for self collision
                if (this.checkCollision(nextPos, this.body.slice(1))) {
                    return false;
                }
                // Check for player snake collision
                if (this.checkCollision(nextPos, this.playerSnakeBody)) {
                    return false;
                }
                return true;
            });

            if (escapeDirections.length > 0) {
                // Choose the direction that leads to the most open space
                const bestDirection = this.findDirectionWithMostSpace(head, escapeDirections);
                this.nextDirection = bestDirection;
            }
        }
    }

    private findDirectionWithMostSpace(head: Position, directions: Direction[]): Direction {
        let bestDirection = directions[0];
        let maxSpace = 0;

        for (const dir of directions) {
            const space = this.calculateSpaceInDirection(head, dir);
            if (space > maxSpace) {
                maxSpace = space;
                bestDirection = dir;
            }
        }

        return bestDirection;
    }

    private calculateSpaceInDirection(head: Position, direction: Direction): number {
        let space = 0;
        let currentPos = { ...head };

        while (true) {
            // Move in the given direction
            switch (direction) {
                case Direction.UP:
                    currentPos.y--;
                    break;
                case Direction.DOWN:
                    currentPos.y++;
                    break;
                case Direction.LEFT:
                    currentPos.x--;
                    break;
                case Direction.RIGHT:
                    currentPos.x++;
                    break;
            }

            // Check for collisions
            if (currentPos.x < 0 || currentPos.x >= 100 || currentPos.y < 0 || currentPos.y >= 100) {
                break;
            }
            if (this.checkCollision(currentPos, this.body.slice(1))) {
                break;
            }
            if (this.checkCollision(currentPos, this.playerSnakeBody)) {
                break;
            }

            space++;
        }

        return space;
    }

    private getNextPosition(pos: Position, dir: Direction): Position {
        const next = { ...pos };
        switch (dir) {
            case Direction.UP:
                next.y--;
                break;
            case Direction.DOWN:
                next.y++;
                break;
            case Direction.LEFT:
                next.x--;
                break;
            case Direction.RIGHT:
                next.x++;
                break;
        }
        return next;
    }

    public getBody(): Position[] {
        return this.body;
    }

    public checkCollision(position: Position, otherBody: Position[]): boolean {
        return otherBody.some(segment => 
            segment.x === position.x && segment.y === position.y
        );
    }

    public getIsDead(): boolean {
        return this.isDead;
    }
} 