import { Snake } from './Snake';
import { EnemySnake } from './EnemySnake';
import { Food } from './Food';
import { Direction, GameConfig, Position } from './types';

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private isRunning: boolean = false;
    private snake: Snake;
    private enemySnake: EnemySnake;
    private food: Food;
    private score: number;
    private lastUpdate: number = 0;
    private gameSpeed: number;
    private boardWidth: number;
    private boardHeight: number;
    private cellSize: number;
    private isGameOver: boolean = false;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        
        // Set canvas size to be larger
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        this.cellSize = 10; // Slightly larger cell size for better visibility
        this.boardWidth = Math.floor(this.canvas.width / this.cellSize);
        this.boardHeight = Math.floor(this.canvas.height / this.cellSize);
        this.gameSpeed = 100;
        this.score = 0;
        this.isGameOver = false;
        this.lastUpdate = 0;

        // Initialize snake at the center
        const centerX = Math.floor(this.boardWidth / 2);
        const centerY = Math.floor(this.boardHeight / 2);
        this.snake = new Snake({ x: centerX, y: centerY });

        // Initialize food
        this.food = new Food(this.boardWidth);
        this.food.respawn(this.snake.getBody());

        // Initialize enemy snake in a different area
        const enemyPosition = this.getValidEnemyPosition();
        this.enemySnake = new EnemySnake(enemyPosition);

        // Set up keyboard controls
        this.setupInputHandling();

        // Start game loop
        this.gameLoop();
    }

    public start(): void {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastUpdate = performance.now();
        this.gameLoop();
    }

    public stop(): void {
        this.isRunning = false;
    }

    private setupInputHandling(): void {
        document.addEventListener('keydown', (event) => {
            switch (event.key) {
                case 'ArrowUp':
                    this.snake.setDirection(Direction.UP);
                    break;
                case 'ArrowDown':
                    this.snake.setDirection(Direction.DOWN);
                    break;
                case 'ArrowLeft':
                    this.snake.setDirection(Direction.LEFT);
                    break;
                case 'ArrowRight':
                    this.snake.setDirection(Direction.RIGHT);
                    break;
            }
        });
    }

    private gameLoop(currentTime: number = 0): void {
        if (!this.isRunning) return;

        // Calculate time since last update
        const deltaTime = currentTime - this.lastUpdate;

        // Update game state if enough time has passed
        if (deltaTime >= this.gameSpeed) {
            this.update();
            this.lastUpdate = currentTime;
        }

        // Render game objects
        this.render();

        // Request next frame
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    private update(): void {
        // Move snake first
        this.snake.move();

        // Move enemy snake
        this.enemySnake.move(this.food.getPositions(), this.snake.getBody(), this.boardWidth, this.boardHeight);

        // Get the new head position after movement
        const head = this.snake.getHead();
        const foodPositions = this.food.getPositions();

        // Check for food collision
        const foodEaten = foodPositions.some(foodPos => 
            head.x === foodPos.x && head.y === foodPos.y
        );

        if (foodEaten) {
            // Snake ate food
            this.snake.move(true); // Grow snake
            this.food.respawn(this.snake.getBody());
            this.score += 10;
            // Increase speed slightly
            this.gameSpeed = Math.max(50, this.gameSpeed - 2);
        }

        // Get the final head position after any growth
        const finalHead = this.snake.getHead();

        // Check for wall collision
        if (this.checkWallCollision(finalHead)) {
            this.gameOver();
            return;
        }

        // Check for self collision
        if (this.snake.checkCollision(finalHead)) {
            this.gameOver();
            return;
        }

        // Check for enemy snake collision (only with enemy's body, not head)
        if (this.enemySnake.checkCollision(finalHead, this.enemySnake.getBody().slice(1))) {
            this.gameOver();
            return;
        }

        // Respawn enemy snake if it's dead
        if (this.enemySnake.getIsDead()) {
            this.respawnEnemySnake();
        }
    }

    private respawnEnemySnake(): void {
        // Find a random position away from the player snake
        let newPosition: Position;
        const minDistance = 20; // Minimum distance from player snake
        let attempts = 0;
        const maxAttempts = 100; // Prevent infinite loop

        do {
            newPosition = {
                x: Math.floor(Math.random() * this.boardWidth),
                y: Math.floor(Math.random() * this.boardHeight)
            };
            attempts++;

            // Check if position is far enough from player snake
            const isFarEnough = this.snake.getBody().every(segment => {
                const distance = Math.abs(segment.x - newPosition.x) + Math.abs(segment.y - newPosition.y);
                return distance >= minDistance;
            });

            if (isFarEnough) {
                break;
            }
        } while (attempts < maxAttempts);

        // If we couldn't find a good position, try to find the farthest possible position
        if (attempts >= maxAttempts) {
            let maxDistance = 0;
            let bestPosition = { x: 0, y: 0 };

            // Try some random positions and pick the one farthest from the player
            for (let i = 0; i < 10; i++) {
                const pos = {
                    x: Math.floor(Math.random() * this.boardWidth),
                    y: Math.floor(Math.random() * this.boardHeight)
                };

                const minDistToPlayer = Math.min(...this.snake.getBody().map(segment => 
                    Math.abs(segment.x - pos.x) + Math.abs(segment.y - pos.y)
                ));

                if (minDistToPlayer > maxDistance) {
                    maxDistance = minDistToPlayer;
                    bestPosition = pos;
                }
            }

            newPosition = bestPosition;
        }

        // Create new enemy snake with initial length
        this.enemySnake = new EnemySnake(newPosition);
    }

    private checkWallCollision(position: Position): boolean {
        return (
            position.x < 0 ||
            position.x >= this.boardWidth ||
            position.y < 0 ||
            position.y >= this.boardHeight
        );
    }

    private getRandomPosition(): Position {
        return {
            x: Math.floor(Math.random() * this.boardWidth),
            y: Math.floor(Math.random() * this.boardHeight)
        };
    }

    private isPositionValid(position: Position): boolean {
        // Check if position is far enough from center (player's starting position)
        const centerDistance = Math.abs(position.x - this.boardWidth/2) + Math.abs(position.y - this.boardHeight/2);
        // Ensure position is in the outer third of the board
        const isInOuterArea = position.x < this.boardWidth/3 || position.x > (this.boardWidth*2/3) || 
                            position.y < this.boardHeight/3 || position.y > (this.boardHeight*2/3);
        return centerDistance >= 40 && isInOuterArea;
    }

    private getValidEnemyPosition(): Position {
        let position: Position = { x: 0, y: 0 };
        let attempts = 0;
        const maxAttempts = 100;

        do {
            // Try to spawn in one of the corners or edges
            const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
            switch (side) {
                case 0: // top
                    position = {
                        x: Math.floor(Math.random() * this.boardWidth),
                        y: Math.floor(Math.random() * (this.boardHeight/3))
                    };
                    break;
                case 1: // right
                    position = {
                        x: Math.floor(this.boardWidth*2/3) + Math.floor(Math.random() * (this.boardWidth/3)),
                        y: Math.floor(Math.random() * this.boardHeight)
                    };
                    break;
                case 2: // bottom
                    position = {
                        x: Math.floor(Math.random() * this.boardWidth),
                        y: Math.floor(this.boardHeight*2/3) + Math.floor(Math.random() * (this.boardHeight/3))
                    };
                    break;
                case 3: // left
                    position = {
                        x: Math.floor(Math.random() * (this.boardWidth/3)),
                        y: Math.floor(Math.random() * this.boardHeight)
                    };
                    break;
            }
            attempts++;
        } while (!this.isPositionValid(position) && attempts < maxAttempts);

        return position;
    }

    private gameOver(): void {
        this.isRunning = false;
        alert(`Game Over! Score: ${this.score}`);
        // Reset game state
        const centerX = Math.floor(this.boardWidth / 2);
        const centerY = Math.floor(this.boardHeight / 2);
        this.snake = new Snake({ x: centerX, y: centerY });

        // Initialize enemy snake in a different position
        const enemyPosition = this.getValidEnemyPosition();
        this.enemySnake = new EnemySnake(enemyPosition);
        this.food = new Food(this.boardWidth);
        this.score = 0;
        this.gameSpeed = 100;
        this.start();
    }

    private render(): void {
        // Clear the canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw snake
        this.ctx.fillStyle = '#00ff00';
        this.snake.getBody().forEach(segment => {
            this.ctx.fillRect(
                segment.x * this.cellSize,
                segment.y * this.cellSize,
                this.cellSize - 1,
                this.cellSize - 1
            );
        });

        // Draw enemy snake (only if not dead)
        if (!this.enemySnake.getIsDead()) {
            this.ctx.fillStyle = '#ff0000';
            this.enemySnake.getBody().forEach(segment => {
                this.ctx.fillRect(
                    segment.x * this.cellSize,
                    segment.y * this.cellSize,
                    this.cellSize - 1,
                    this.cellSize - 1
                );
            });
        }

        // Draw food
        this.ctx.fillStyle = '#ffff00';
        this.food.getPositions().forEach(foodPosition => {
            this.ctx.fillRect(
                foodPosition.x * this.cellSize,
                foodPosition.y * this.cellSize,
                this.cellSize - 1,
                this.cellSize - 1
            );
        });

        // Draw score
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score: ${this.score}`, 10, 30);
    }
} 