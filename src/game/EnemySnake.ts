import { Position, Direction } from './types';

export class EnemySnake {
    private body: Position[];
    private direction: Direction;
    private nextDirection: Direction;
    private color: string = '#ff0000'; // Red color for enemy snake
    private isDead: boolean = false;
    private playerSnakeBody: Position[] = []; // Initialize with empty array
    private boardWidth: number;
    private boardHeight: number;

    constructor(startPosition: Position, boardWidth: number, boardHeight: number) {
        this.boardWidth = boardWidth;
        this.boardHeight = boardHeight;
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
        // Calculate distances to food
        const horizontalDistance = Math.abs(food.x - head.x);
        const verticalDistance = Math.abs(food.y - head.y);

        // Determine preferred direction based on which distance is greater
        let preferredDirection: Direction;
        if (horizontalDistance > verticalDistance) {
            preferredDirection = food.x < head.x ? Direction.LEFT : Direction.RIGHT;
        } else {
            preferredDirection = food.y < head.y ? Direction.UP : Direction.DOWN;
        }

        // Check if preferred direction is safe
        const nextPos = this.getNextPosition(head, preferredDirection);
        if (!this.checkCollision(nextPos, this.body.slice(1)) && 
            !this.checkCollision(nextPos, this.playerSnakeBody) &&
            nextPos.x >= 0 && nextPos.x < this.boardWidth &&
            nextPos.y >= 0 && nextPos.y < this.boardHeight) {
            this.nextDirection = preferredDirection;
            return;
        }

        // If preferred direction is not safe, try the other direction
        const alternativeDirection = horizontalDistance > verticalDistance 
            ? (food.y < head.y ? Direction.UP : Direction.DOWN)
            : (food.x < head.x ? Direction.LEFT : Direction.RIGHT);

        const altNextPos = this.getNextPosition(head, alternativeDirection);
        if (!this.checkCollision(altNextPos, this.body.slice(1)) && 
            !this.checkCollision(altNextPos, this.playerSnakeBody) &&
            altNextPos.x >= 0 && altNextPos.x < this.boardWidth &&
            altNextPos.y >= 0 && altNextPos.y < this.boardHeight) {
            this.nextDirection = alternativeDirection;
            return;
        }

        // If both preferred directions are not safe, try any safe direction
        const possibleDirections = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
        for (const dir of possibleDirections) {
            const pos = this.getNextPosition(head, dir);
            if (!this.checkCollision(pos, this.body.slice(1)) && 
                !this.checkCollision(pos, this.playerSnakeBody) &&
                pos.x >= 0 && pos.x < this.boardWidth &&
                pos.y >= 0 && pos.y < this.boardHeight) {
                this.nextDirection = dir;
                return;
            }
        }
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

    public getHead(): Position {
        return this.body[0];
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