'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"

// Define tetromino shapes and colors
const TETROMINOS = {
  0: { shape: [[0]], color: '0, 0, 0' },
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
}

type TETROMINO_KEYS = keyof typeof TETROMINOS;

// Create the game stage
const createStage = (): (number | string)[][] => 
  Array.from(Array(20), () => Array(10).fill([0, 'clear']))

// Randomly generate a new tetromino
const randomTetromino = () => {
  const tetrominos = 'IJLOSTZ'
  const randTetromino = tetrominos[Math.floor(Math.random() * tetrominos.length)] as TETROMINO_KEYS
  return TETROMINOS[randTetromino]
}

export default function TetrisGame() {
  const [dropTime, setDropTime] = useState<number | null>(null)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [stage, setStage] = useState(createStage())
  const [player, setPlayer] = useState({
    pos: { x: 0, y: 0 },
    tetromino: TETROMINOS[0].shape,
    collided: false,
  })

  const movePlayer = (dir: number) => {
    if (!checkCollision(player, stage, { x: dir, y: 0 })) {
      updatePlayerPos({ x: dir, y: 0, collided: false })
    }
  }

  const startGame = () => {
    setStage(createStage())
    setDropTime(1000)
    resetPlayer()
    setScore(0)
    setGameOver(false)
  }

  const drop = () => {
    if (!checkCollision(player, stage, { x: 0, y: 1 })) {
      updatePlayerPos({ x: 0, y: 1, collided: false })
    } else {
      if (player.pos.y < 1) {
        setGameOver(true)
        setDropTime(null)
      }
      updatePlayerPos({ x: 0, y: 0, collided: true })
    }
  }

  const dropPlayer = () => {
    drop()
  }

  const move = ({ keyCode }: { keyCode: number }) => {
    if (!gameOver) {
      if (keyCode === 37) {
        movePlayer(-1)
      } else if (keyCode === 39) {
        movePlayer(1)
      } else if (keyCode === 40) {
        dropPlayer()
      } else if (keyCode === 38) {
        playerRotate(stage, 1)
      }
    }
  }

  const updatePlayerPos = ({ x, y, collided }: { x: number; y: number; collided: boolean }) => {
    setPlayer(prev => ({
      ...prev,
      pos: { x: prev.pos.x + x, y: prev.pos.y + y },
      collided,
    }))
  }

  const resetPlayer = useCallback(() => {
    setPlayer({
      pos: { x: 5, y: 0 },
      tetromino: randomTetromino().shape,
      collided: false,
    })
  }, [])

  useEffect(() => {
    let intervalId: NodeJS.Timeout
    if (dropTime) {
      intervalId = setInterval(() => {
        drop()
      }, dropTime)
    }
    return () => {
      clearInterval(intervalId)
    }
  }, [dropTime, drop])

  useEffect(() => {
    const sweepRows = (newStage: (number | string)[][]) =>
      newStage.reduce((ack, row) => {
        if (row.findIndex((cell) => cell[0] === 0) === -1) {
          setScore((prev) => prev + 1)
          ack.unshift(new Array(newStage[0].length).fill([0, 'clear']))
          return ack
        }
        ack.push(row)
        return ack
      }, [] as (number | string)[][])

    const updateStage = (prevStage: (number | string)[][]) => {
      const newStage = prevStage.map(row =>
        row.map(cell => (cell[1] === 'clear' ? [0, 'clear'] : cell))
      )

      player.tetromino.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            const newY = y + player.pos.y
            const newX = x + player.pos.x
            if (newY >= 0 && newY < newStage.length && newX >= 0 && newX < newStage[0].length) {
              newStage[newY][newX] = [
                value,
                `${player.collided ? 'merged' : 'clear'}`,
              ]
            }
          }
        })
      })

      if (player.collided) {
        resetPlayer()
        return sweepRows(newStage)
      }

      return newStage
    }

    setStage(prev => updateStage(prev))
  }, [player, resetPlayer])

  const checkCollision = (player: any, stage: (number | string)[][], { x: moveX, y: moveY }: { x: number; y: number }) => {
    for (let y = 0; y < player.tetromino.length; y += 1) {
      for (let x = 0; x < player.tetromino[y].length; x += 1) {
        if (player.tetromino[y][x] !== 0) {
          const newY = y + player.pos.y + moveY
          const newX = x + player.pos.x + moveX
          if (
            newY < 0 || newY >= stage.length ||
            newX < 0 || newX >= stage[0].length ||
            stage[newY][newX][1] !== 'clear'
          ) {
            return true
          }
        }
      }
    }
    return false
  }

  const playerRotate = (stage: (number | string)[][], dir: number) => {
    const clonedPlayer = JSON.parse(JSON.stringify(player))
    clonedPlayer.tetromino = rotate(clonedPlayer.tetromino, dir)

    const pos = clonedPlayer.pos.x
    let offset = 1
    while (checkCollision(clonedPlayer, stage, { x: 0, y: 0 })) {
      clonedPlayer.pos.x += offset
      offset = -(offset + (offset > 0 ? 1 : -1))
      if (offset > clonedPlayer.tetromino[0].length) {
        rotate(clonedPlayer.tetromino, -dir)
        clonedPlayer.pos.x = pos
        return
      }
    }

    setPlayer(clonedPlayer)
  }

  const rotate = (matrix: any[][], dir: number) => {
    const rotatedTetro = matrix.map((_, index) =>
      matrix.map((col) => col[index])
    )
    if (dir > 0) return rotatedTetro.map((row) => row.reverse())
    return rotatedTetro.reverse()
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4" onKeyDown={move} tabIndex={0}>
      <h1 className="text-4xl font-bold mb-4">俄罗斯方块</h1>
      <div className="relative bg-white p-4 rounded-lg shadow-lg">
        <div className="grid grid-cols-10 gap-px" style={{ width: '300px', height: '600px' }}>
          {stage.map((row, y) =>
            row.map((cell: any[], x: number) => (
              <div
                key={`${y}-${x}`}
                className="w-full h-full"
                style={{
                  backgroundColor: cell[0] === 0 ? 'rgba(0,0,0,0.1)' : `rgba(${TETROMINOS[cell[0] as TETROMINO_KEYS].color}, 0.8)`,
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
        {gameOver ? '重新开始游戏' : '开始游戏'}
      </Button>
    </div>
  )
}