'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Home, Fish, Trophy, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PENGUIN_SIZE = 60;
const FISH_SIZE = 30;
const GAME_DURATION = 60;

const FISH_TYPES = {
  normal: { emoji: '🐟', points: 1, color: '#3B82F6' },
  golden: { emoji: '🐠', points: 5, color: '#F59E0B' },
  spiky: { emoji: '🐡', points: -2, color: '#EF4444' }
};

const PENGUIN_REACTIONS = {
  catch: ['awk-awk! 🎉', 'burh yeah! 🐟', 'nom nom! 😋'],
  miss: ['burh...', 'oops! 😅', 'missed it! 🤦‍♂️'],
  spiky: ['BURHHH!!! 😵', 'OUCH! 🤕', 'Spiky! 😖']
};

export default function PenguinGame() {
  const [gameState, setGameState] = useState('landing'); // landing, playing, paused, gameOver
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [penguinX, setPenguinX] = useState(GAME_WIDTH / 2);
  const [fish, setFish] = useState([]);
  const [reaction, setReaction] = useState(null);
  const [snowflakes, setSnowflakes] = useState([]);
  
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const keysRef = useRef({ left: false, right: false });

  // Initialize snowflakes
  useEffect(() => {
    const flakes = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 2 + 1
    }));
    setSnowflakes(flakes);
  }, []);

  // Animate snowflakes
  useEffect(() => {
    const animateSnow = () => {
      setSnowflakes(prev => prev.map(flake => ({
        ...flake,
        y: flake.y > window.innerHeight ? -10 : flake.y + flake.speed,
        x: flake.x + Math.sin(flake.y * 0.01) * 0.5
      })));
    };

    const interval = setInterval(animateSnow, 50);
    return () => clearInterval(interval);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = true;
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Game timer
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('gameOver');
    }
  }, [gameState, timeLeft]);

  // Spawn fish
  const spawnFish = useCallback(() => {
    if (gameState !== 'playing') return;
    
    const fishTypes = Object.keys(FISH_TYPES);
    const randomType = fishTypes[Math.floor(Math.random() * fishTypes.length)];
    
    const newFish = {
      id: Date.now() + Math.random(),
      x: Math.random() * (GAME_WIDTH - FISH_SIZE),
      y: -FISH_SIZE,
      type: randomType,
      speed: Math.random() * 3 + 2 + (GAME_DURATION - timeLeft) * 0.1 // Increase speed over time
    };
    
    setFish(prev => [...prev, newFish]);
  }, [gameState, timeLeft]);

  // Game loop
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = setInterval(() => {
        // Move penguin
        setPenguinX(prev => {
          let newX = prev;
          if (keysRef.current.left) newX -= 5;
          if (keysRef.current.right) newX += 5;
          return Math.max(PENGUIN_SIZE / 2, Math.min(GAME_WIDTH - PENGUIN_SIZE / 2, newX));
        });

        // Move fish and check collisions
        setFish(prev => {
          const updatedFish = prev.map(f => ({ ...f, y: f.y + f.speed }))
            .filter(f => f.y < GAME_HEIGHT + FISH_SIZE);

          // Check collisions
          updatedFish.forEach(f => {
            const distance = Math.sqrt(
              Math.pow(f.x + FISH_SIZE / 2 - penguinX, 2) + 
              Math.pow(f.y + FISH_SIZE / 2 - (GAME_HEIGHT - PENGUIN_SIZE), 2)
            );
            
            if (distance < (PENGUIN_SIZE + FISH_SIZE) / 2) {
              const fishType = FISH_TYPES[f.type];
              setScore(prev => Math.max(0, prev + fishType.points));
              
              // Show reaction
              const reactions = f.type === 'spiky' ? PENGUIN_REACTIONS.spiky : PENGUIN_REACTIONS.catch;
              setReaction(reactions[Math.floor(Math.random() * reactions.length)]);
              setTimeout(() => setReaction(null), 2000);
              
              // Play sound effect
              playSound(f.type);
              
              // Remove caught fish
              setFish(current => current.filter(fish => fish.id !== f.id));
            }
          });

          return updatedFish;
        });

        // Spawn new fish occasionally
        if (Math.random() < 0.02) {
          spawnFish();
        }
      }, 1000 / 60); // 60 FPS

      return () => clearInterval(gameLoopRef.current);
    }
  }, [gameState, penguinX, spawnFish]);

  const playSound = (type) => {
    // Create audio context for sound effects
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different sounds for different fish types
    switch (type) {
      case 'normal':
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.1);
        break;
      case 'golden':
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.2);
        break;
      case 'spiky':
        oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(80, audioContext.currentTime + 0.3);
        break;
      default:
        oscillator.frequency.setValueAtTime(250, audioContext.currentTime);
    }
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setFish([]);
    setPenguinX(GAME_WIDTH / 2);
    setReaction(null);
  };

  const pauseGame = () => {
    setGameState(gameState === 'paused' ? 'playing' : 'paused');
  };

  const resetGame = () => {
    setGameState('landing');
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setFish([]);
    setPenguinX(GAME_WIDTH / 2);
    setReaction(null);
  };

  const triggerWaddle = () => {
    setReaction('waddle waddle! 🐧');
    setTimeout(() => setReaction(null), 1500);
    playSound('normal');
  };

  const makeSound = () => {
    const sounds = ['burh!', 'awk-awk!', 'brrrh!'];
    setReaction(sounds[Math.floor(Math.random() * sounds.length)]);
    setTimeout(() => setReaction(null), 1500);
    playSound('normal');
  };

  const getScoreMessage = () => {
    if (score >= 30) return 'burh champion! 🏆🐧';
    if (score >= 15) return 'nice waddle! 🐧✨';
    if (score >= 5) return 'not bad, burh! 🐧';
    return 'brrrh... better luck next waddle 🐧❄️';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-200 via-blue-300 to-blue-400 relative overflow-hidden">
      {/* Animated Snowflakes */}
      {snowflakes.map(flake => (
        <div
          key={flake.id}
          className="absolute bg-white rounded-full opacity-80 pointer-events-none"
          style={{
            left: `${flake.x}px`,
            top: `${flake.y}px`,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            transform: 'translate(-50%, -50%)'
          }}
        />
      ))}

      <div className="relative z-10 container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {gameState === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center min-h-screen"
            >
              <Card className="p-8 text-center bg-white/90 backdrop-blur-sm shadow-2xl">
                <div className="text-8xl mb-4">🐧</div>
                <h1 className="text-4xl font-bold text-gray-800 mb-4">
                  Waddle Penguin
                </h1>
                <p className="text-gray-600 mb-8 max-w-md">
                  Help our cute penguin catch falling fish! Use arrow keys or A/D to waddle left and right. 
                  Catch fish for points, but avoid the spiky ones!
                </p>
                <Button 
                  onClick={startGame}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-xl"
                >
                  <Play className="mr-2" />
                  Start Waddling! ❄️
                </Button>
              </Card>
            </motion.div>
          )}

          {(gameState === 'playing' || gameState === 'paused') && (
            <motion.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col lg:flex-row gap-6 items-start justify-center min-h-screen"
            >
              {/* Game Canvas */}
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={GAME_WIDTH}
                  height={GAME_HEIGHT}
                  className="border-4 border-white rounded-lg shadow-2xl bg-gradient-to-b from-blue-100 to-blue-200"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
                
                {/* Game Elements Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Penguin */}
                  <div
                    className="absolute transition-all duration-100 ease-out"
                    style={{
                      left: `${penguinX - PENGUIN_SIZE / 2}px`,
                      bottom: '20px',
                      transform: keysRef.current.left || keysRef.current.right ? 'scale(1.1) rotate(-2deg)' : 'scale(1)'
                    }}
                  >
                    <div className="text-6xl animate-bounce">🐧</div>
                  </div>

                  {/* Fish */}
                  {fish.map(f => (
                    <div
                      key={f.id}
                      className="absolute text-3xl animate-pulse"
                      style={{
                        left: `${f.x}px`,
                        top: `${f.y}px`,
                        transform: 'rotate(10deg)'
                      }}
                    >
                      {FISH_TYPES[f.type].emoji}
                    </div>
                  ))}

                  {/* Speech Bubble */}
                  {reaction && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.5, y: -20 }}
                      className="absolute bg-white rounded-lg px-4 py-2 shadow-lg border-2 border-gray-200"
                      style={{
                        left: `${penguinX - 50}px`,
                        bottom: '100px',
                        transform: 'translateX(-50%)'
                      }}
                    >
                      <div className="text-sm font-medium text-gray-800">{reaction}</div>
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                        <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white"></div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Pause Overlay */}
                {gameState === 'paused' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                    <Card className="p-6 text-center bg-white/95">
                      <h2 className="text-2xl font-bold mb-4">Game Paused</h2>
                      <Button onClick={pauseGame} size="lg">
                        <Play className="mr-2" />
                        Resume
                      </Button>
                    </Card>
                  </div>
                )}
              </div>

              {/* Game Controls */}
              <div className="flex flex-col gap-4 w-full lg:w-80">
                {/* Score & Timer */}
                <Card className="p-4 bg-white/90 backdrop-blur-sm">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <Trophy className="text-yellow-500" />
                      <span className="font-bold text-xl">{score}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Timer className="text-blue-500" />
                      <span className="font-bold text-xl">{timeLeft}s</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      onClick={pauseGame} 
                      variant="outline" 
                      className="w-full"
                      disabled={gameState !== 'playing'}
                    >
                      <Pause className="mr-2" />
                      Pause Game
                    </Button>
                    <Button 
                      onClick={resetGame} 
                      variant="outline" 
                      className="w-full"
                    >
                      <Home className="mr-2" />
                      Main Menu
                    </Button>
                  </div>
                </Card>

                {/* Fish Guide */}
                <Card className="p-4 bg-white/90 backdrop-blur-sm">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Fish className="text-blue-500" />
                    Fish Guide
                  </h3>
                  <div className="space-y-2 text-sm">
                    {Object.entries(FISH_TYPES).map(([type, info]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-2xl">{info.emoji}</span>
                        <span className="font-medium">
                          {info.points > 0 ? '+' : ''}{info.points} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Action Buttons */}
                <Card className="p-4 bg-white/90 backdrop-blur-sm">
                  <h3 className="font-bold mb-3">Penguin Actions</h3>
                  <div className="space-y-2">
                    <Button 
                      onClick={makeSound} 
                      variant="outline" 
                      className="w-full"
                    >
                      🔊 Make Sound
                    </Button>
                    <Button 
                      onClick={triggerWaddle} 
                      variant="outline" 
                      className="w-full"
                    >
                      🐧 Waddle Dance
                    </Button>
                  </div>
                </Card>

                {/* Controls Help */}
                <Card className="p-4 bg-white/90 backdrop-blur-sm">
                  <h3 className="font-bold mb-3">Controls</h3>
                  <div className="text-sm space-y-1">
                    <p><kbd className="px-2 py-1 bg-gray-200 rounded">←→</kbd> or <kbd className="px-2 py-1 bg-gray-200 rounded">A/D</kbd> to move</p>
                    <p>Catch fish to score points!</p>
                    <p>Avoid spiky fish! 🐡</p>
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {gameState === 'gameOver' && (
            <motion.div
              key="gameOver"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center justify-center min-h-screen"
            >
              <Card className="p-8 text-center bg-white/95 backdrop-blur-sm shadow-2xl max-w-md">
                <div className="text-8xl mb-4">
                  {score >= 20 ? '🏆' : score >= 10 ? '🐧' : '❄️'}
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  Game Over!
                </h2>
                <p className="text-xl text-gray-600 mb-4">
                  Final Score: <span className="font-bold text-blue-600">{score}</span>
                </p>
                <p className="text-lg text-gray-500 mb-6">
                  {getScoreMessage()}
                </p>
                <div className="flex gap-3">
                  <Button onClick={startGame} className="flex-1">
                    <RotateCcw className="mr-2" />
                    Play Again
                  </Button>
                  <Button onClick={resetGame} variant="outline" className="flex-1">
                    <Home className="mr-2" />
                    Home
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}