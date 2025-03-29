export interface Position {
    x: number;
    y: number;
}

export enum Direction {
    UP = 'UP',
    DOWN = 'DOWN',
    LEFT = 'LEFT',
    RIGHT = 'RIGHT'
}

export interface GameConfig {
    gridSize: number;
    cellSize: number;
    initialSpeed: number;
} 