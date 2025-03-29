import { Position, Direction } from './types';

export class Snake {
    private body: Position[];
    private direction: Direction;
    private nextDirection: Direction;

    constructor(startPosition: Position) {
        // Create initial body with 5 pieces
        this.body = [
            startPosition,
            { x: startPosition.x - 1, y: startPosition.y },
            { x: startPosition.x - 2, y: startPosition.y },
            { x: startPosition.x - 3, y: startPosition.y },
            { x: startPosition.x - 4, y: startPosition.y }
        ];
        this.direction = Direction.RIGHT;
        this.nextDirection = Direction.RIGHT;
    }

    public move(shouldGrow: boolean = false): void {
        const head = this.body[0];
        const newHead = { ...head };

        // Update direction
        this.direction = this.nextDirection;

        // Calculate new head position
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

        // Add new head
        this.body.unshift(newHead);

        // Remove tail if not growing
        if (!shouldGrow) {
            this.body.pop();
        }
    }

    public setDirection(direction: Direction): void {
        // Prevent 180-degree turns
        const opposites = {
            [Direction.UP]: Direction.DOWN,
            [Direction.DOWN]: Direction.UP,
            [Direction.LEFT]: Direction.RIGHT,
            [Direction.RIGHT]: Direction.LEFT
        };

        if (opposites[direction] !== this.direction) {
            this.nextDirection = direction;
        }
    }

    public getHead(): Position {
        return this.body[0];
    }

    public getBody(): Position[] {
        return this.body;
    }

    public checkCollision(position: Position): boolean {
        // Check collision with body segments (excluding the head)
        return this.body.slice(1).some(segment => 
            segment.x === position.x && segment.y === position.y
        );
    }
} 