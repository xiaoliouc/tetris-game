'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"

// Define types for our game elements
type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

type Tetromino = {
  shape: (TetrominoType | 0)[][];
  color: string;
};

type TETROMINOS = {
  [key in TetrominoType | '0']: Tetromino;
};

type Player = {
  pos: {
    x: number;
    y: number;
  };
  tetromino: (TetrominoType | 0)[][];
  collided: boolean;
};

type CellValue = TetrominoType | 0;
type CellState = 'clear' | 'merged';
type Cell = [CellValue, CellState];
type Stage = Cell[][];

// Define tetromino shapes and colors
const TETROMINOS: TETROMINOS = {
  '0': { shape: [[0]], color: '0, 0, 0' },
  I: {
    shape: [
      [0, 'I', 0, 0],
      [0, 'I', 0, 0],
      [0, 'I', 0, 0],
      [0, 'I', 0, 0]
    ],
    color: '80, 227, 230',
  },
  J: { 
    shape: [
      [0, 'J', 0],
      [0, 'J', 0],
      ['J', 'J', 0]
    ],
    color: '36, 95, 223',
  },
  L: {
    shape: [
      [0, 'L', 0],
      [0, 'L', 0],
      [0, 'L', 'L']
    ],
    color: '223, 173, 36',
  },
  O: {
    shape: [
      ['O', 'O'],
      ['O', 'O'],
    ],
    color: '223, 217, 36',
  },
  S: {
    shape: [
      [0, 'S', 'S'],
      ['S', 'S', 0],
      [0, 0, 0]
    ],
    color: '48, 211, 56',
  },
  T: {
    shape: [
      [0, 0, 0],
      ['T', 'T', 'T'],
      [0, 'T', 0]
    ],
    color: '132, 61, 198',
  },
  Z: {
    shape: [
      ['Z', 'Z', 0],
      [0, 'Z', 'Z'],
      [0, 0, 0]
    ],
    color: '227, 78, 78',
  },
};

// Create the game stage
const createStage = (): Stage => 
  Array.from(Array(20), () => 
    Array.from(Array(10), (): Cell => [0, 'clear'])
  );

// Randomly generate a new tetromino
const randomTetromino = (): Tetromino => {
  const tetrominos: TetrominoType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
  const randTetromino = tetrominos[Math.floor(Math.random() * tetrominos.length)];
  return TETROMINOS[randTetromino];
};

export default function TetrisGame(): JSX.Element {
  const [dropTime, setDropTime] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [stage, setStage] = useState<Stage>(createStage());
  const [player, setPlayer] = useState<Player>({
    pos: { x: 0, y: 0 },
    tetromino: TETROMINOS[0].shape,
    collided: false,
  });

  const movePlayer = (dir: number): void => {
    if (!checkCollision(player, stage, { x: dir, y: 0 })) {
      updatePlayerPos({ x: dir, y: 0, collided: false });
    }
  };

  const startGame = (): void => {
    setStage(createStage());
    setDropTime(1000);
    resetPlayer();
    setScore(0);
    setGameOver(false);
  };

  const drop = (): void => {
    if (!checkCollision(player, stage, { x: 0, y: 1 })) {
      updatePlayerPos({ x: 0, y: 1, collided: false });
    } else {
      if (player.pos.y < 1) {
        setGameOver(true);
        setDropTime(null);
      }
      updatePlayerPos({ x: 0, y: 0, collided: true });
    }
  };

  const dropPlayer = (): void => {
    drop();
  };

  const move = ({ keyCode }: { keyCode: number }): void => {
    if (!gameOver) {
      if (keyCode === 37) {
        movePlayer(-1);
      } else if (keyCode === 39) {
        movePlayer(1);
      } else if (keyCode === 40) {
        dropPlayer();
      } else if (keyCode === 38) {
        playerRotate(stage, 1);
      }
    }
  };

  const updatePlayerPos = ({ x, y, collided }: { x: number; y: number; collided: boolean }): void => {
    setPlayer(prev => ({
      ...prev,
      pos: { x: prev.pos.x + x, y: prev.pos.y + y },
      collided,
    }));
  };

  const resetPlayer = useCallback((): void => {
    setPlayer({
      pos: { x: 5, y: 0 },
      tetromino: randomTetromino().shape,
      collided: false,
    });
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (dropTime) {
      intervalId = setInterval(() => {
        drop();
      }, dropTime);
    }
    return () => {
      clearInterval(intervalId);
    };
  }, [dropTime, drop]);

  useEffect(() => {
    const sweepRows = (newStage: Stage): Stage =>
      newStage.reduce((ack, row) => {
        if (row.findIndex(cell => cell[0] === 0) === -1) {
          setScore(prev => prev + 1);
          ack.unshift(Array.from(Array(newStage[0].length), (): Cell => [0, 'clear']));
          return ack;
        }
        ack.push(row);
        return ack;
      }, [] as Stage);

    const updateStage = (prevStage: Stage): Stage => {
      // First flush the stage
      const newStage = prevStage.map(row =>
        row.map(cell => (cell[1] === 'clear' ? [0, 'clear'] : cell)) as Cell[]
      );

      // Then draw the tetromino
      player.tetromino.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            newStage[y + player.pos.y][x + player.pos.x] = [
              value,
              `${player.collided ? 'merged' : 'clear'}`,
            ] as Cell;
          }
        });
      });

      // Then check if we collided
      if (player.collided) {
        resetPlayer();
        return sweepRows(newStage);
      }

      return newStage;
    };

    setStage(prev => updateStage(prev));
  }, [player, resetPlayer]);

  const checkCollision = (player: Player, stage: Stage, { x: moveX, y: moveY }: { x: number; y: number }): boolean => {
    for (let y = 0; y < player.tetromino.length; y += 1) {
      for (let x = 0; x < player.tetromino[y].length; x += 1) {
        // 1. Check that we're on an actual Tetromino cell
        if (player.tetromino[y][x] !== 0) {
          if (
            // 2. Check that our move is inside the game areas height (y)
            // We shouldn't go through the bottom of the play area
            !stage[y + player.pos.y + moveY] ||
            // 3. Check that our move is inside the game areas width (x)
            !stage[y + player.pos.y + moveY][x + player.pos.x + moveX] ||
            // 4. Check that the cell we're moving to isn't set to clear
            stage[y + player.pos.y + moveY][x + player.pos.x + moveX][1] !== 'clear'
          ) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const playerRotate = (stage: Stage, dir: number): void => {
    const clonedPlayer = JSON.parse(JSON.stringify(player)) as Player;
    clonedPlayer.tetromino = rotate(clonedPlayer.tetromino, dir);

    const pos = clonedPlayer.pos.x;
    let offset = 1;
    while (checkCollision(clonedPlayer, stage, { x: 0, y: 0 })) {
      clonedPlayer.pos.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      if (offset > clonedPlayer.tetromino[0].length) {
        rotate(clonedPlayer.tetromino, -dir);
        clonedPlayer.pos.x = pos;
        return;
      }
    }

    setPlayer(clonedPlayer);
  };

  const rotate = (matrix: (TetrominoType | 0)[][], dir: number): (TetrominoType | 0)[][] => {
    // Make the rows to become cols (transpose)
    const rotatedTetro = matrix.map((_, index) =>
      matrix.map(col => col[index])
    );
    // Reverse each row to get a rotated matrix
    if (dir > 0) return rotatedTetro.map(row => row.reverse());
    return rotatedTetro.reverse();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4" onKeyDown={move} tabIndex={0}>
      <h1 className="text-4xl font-bold mb-4">Tetris</h1>
      <div className="relative bg-white p-4 rounded-lg shadow-lg">
        <div className="grid grid-cols-10 gap-px" style={{ width: '300px', height: '600px' }}>
          {stage.map((row, y) =>
            row.map((cell, x) => (
              <div
                key={`${y}-${x}`}
                className="w-full h-full"
                style={{
                  backgroundColor: cell[0] === 0 ? 'rgba(0,0,0,0.1)' : `rgba(${TETROMINOS[cell[0] as TetrominoType].color}, 0.8)`,
                }}
              />
            ))
          )}
        </div>
        {gameOver && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-2xl font-bold">Game Over</div>
          </div>
        )}
      </div>
      <div className="mt-4 text-xl">Score: {score}</div>
      <Button className="mt-4" onClick={startGame}>
        {gameOver ? 'Restart Game' : 'Start Game'}
      </Button>
    </div>
  );
}