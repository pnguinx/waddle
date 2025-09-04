'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Volume2, Shuffle, RotateCw } from 'lucide-react';
import kaboom from 'kaboom';

export default function PenguinApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSound, setCurrentSound] = useState('');

  // Penguin sounds
  const penguinSounds = ['Burh!', 'Awk!', 'Brrrh!', 'Squeak!'];

  // Initialize Kaboom.js
  useEffect(() => {
    if (!canvasRef.current || gameRef.current) return;

    const k = kaboom({
      canvas: canvasRef.current,
      background: [135, 206, 250, 0], // Transparent background
      width: 400,
      height: 400,
    });

    gameRef.current = k;

    // Create penguin sprite (simple geometric penguin)
    k.loadSprite('penguin', '/api/placeholder/80/100'); // We'll use a placeholder and create our own penguin shape

    // Add penguin character
    const penguin = k.add([
      k.rect(40, 60, { radius: 20 }),
      k.color(0, 0, 0), // Black body
      k.pos(k.width() / 2, k.height() / 2),
      k.anchor('center'),
      k.area(),
      'penguin',
    ]);

    // Add penguin belly (white)
    const belly = k.add([
      k.ellipse(25, 35),
      k.color(255, 255, 255),
      k.pos(k.width() / 2, k.height() / 2 + 5),
      k.anchor('center'),
    ]);

    // Add penguin beak (orange)
    const beak = k.add([
      k.rect(8, 6, { radius: 2 }),
      k.color(255, 165, 0),
      k.pos(k.width() / 2, k.height() / 2 - 20),
      k.anchor('center'),
    ]);

    // Add eyes
    const leftEye = k.add([
      k.circle(4),
      k.color(255, 255, 255),
      k.pos(k.width() / 2 - 8, k.height() / 2 - 15),
      k.anchor('center'),
    ]);

    const rightEye = k.add([
      k.circle(4),
      k.color(255, 255, 255),
      k.pos(k.width() / 2 + 8, k.height() / 2 - 15),
      k.anchor('center'),
    ]);

    // Add feet
    const leftFoot = k.add([
      k.ellipse(8, 4),
      k.color(255, 165, 0),
      k.pos(k.width() / 2 - 15, k.height() / 2 + 35),
      k.anchor('center'),
    ]);

    const rightFoot = k.add([
      k.ellipse(8, 4),
      k.color(255, 165, 0),
      k.pos(k.width() / 2 + 15, k.height() / 2 + 35),
      k.anchor('center'),
    ]);

    // Store all penguin parts for animation
    const penguinParts = [penguin, belly, beak, leftEye, rightEye, leftFoot, rightFoot];

    // Waddle animation
    const waddle = () => {
      penguinParts.forEach((part) => {
        k.tween(part.pos.x, part.pos.x + 10, 0.3, (val) => {
          part.pos.x = val;
        }).then(() => {
          k.tween(part.pos.x, part.pos.x - 20, 0.6, (val) => {
            part.pos.x = val;
          }).then(() => {
            k.tween(part.pos.x, part.pos.x + 10, 0.3, (val) => {
              part.pos.x = val;
            });
          });
        });
      });
    };

    // Hop animation
    const hop = () => {
      penguinParts.forEach((part) => {
        const originalY = part.pos.y;
        k.tween(part.pos.y, originalY - 20, 0.2, (val) => {
          part.pos.y = val;
        }).then(() => {
          k.tween(part.pos.y, originalY, 0.2, (val) => {
            part.pos.y = val;
          });
        });
      });
    };

    // Click interaction
    penguin.onClick(() => {
      const randomSound = penguinSounds[Math.floor(Math.random() * penguinSounds.length)];
      setCurrentSound(randomSound);
      hop();
      setTimeout(() => setCurrentSound(''), 1500);
    });

    // Hover interaction
    penguin.onHover(() => {
      waddle();
    });

    // Expose functions to window for external calls
    (window as any).penguinWaddle = waddle;
    (window as any).penguinHop = hop;

    setIsLoaded(true);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy();
        gameRef.current = null;
      }
    };
  }, []);

  const playRandomSound = () => {
    const randomSound = penguinSounds[Math.floor(Math.random() * penguinSounds.length)];
    setCurrentSound(randomSound);
    if ((window as any).penguinHop) {
      (window as any).penguinHop();
    }
    setTimeout(() => setCurrentSound(''), 1500);
  };

  const triggerWaddle = () => {
    if ((window as any).penguinWaddle) {
      (window as any).penguinWaddle();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-blue-100 to-white relative overflow-hidden">
      {/* Animated falling snow */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-70"
            initial={{
              x: Math.random() * window.innerWidth,
              y: -10,
            }}
            animate={{
              y: window.innerHeight + 10,
              x: Math.random() * window.innerWidth,
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              ease: 'linear',
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-slate-800 mb-2">
            🐧 Penguin Pal
          </h1>
          <p className="text-lg text-slate-600">
            Click, hover, or use the controls to interact with your penguin friend!
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Main penguin canvas area */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="bg-white/80 backdrop-blur-sm border-2 border-sky-200 shadow-xl">
              <CardContent className="p-8">
                <div className="flex justify-center">
                  <canvas
                    ref={canvasRef}
                    className="border-2 border-sky-300 rounded-2xl bg-gradient-to-b from-sky-100 to-blue-50 shadow-inner"
                    style={{
                      maxWidth: '100%',
                      height: 'auto',
                    }}
                  />
                </div>
                {currentSound && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="text-center mt-4"
                  >
                    <div className="inline-block bg-sky-500 text-white px-4 py-2 rounded-full text-xl font-bold shadow-lg">
                      {currentSound}
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Control panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-6"
          >
            <Card className="bg-white/80 backdrop-blur-sm border-2 border-sky-200 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-sky-500" />
                  Penguin Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={playRandomSound}
                    className="w-full bg-sky-500 hover:bg-sky-600 text-white shadow-lg transition-all duration-200"
                    size="lg"
                  >
                    <Volume2 className="w-4 h-4 mr-2" />
                    Make Sound
                  </Button>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={triggerWaddle}
                    variant="outline"
                    className="w-full border-sky-300 text-sky-700 hover:bg-sky-50 shadow-lg transition-all duration-200"
                    size="lg"
                  >
                    <Shuffle className="w-4 h-4 mr-2" />
                    Animate Waddle
                  </Button>
                </motion.div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-2 border-sky-200 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg text-slate-800">How to Play</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-sky-500 font-semibold">Click:</span>
                  <span>Penguin makes a sound and hops</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sky-500 font-semibold">Hover:</span>
                  <span>Penguin does a cute waddle</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sky-500 font-semibold">Buttons:</span>
                  <span>Trigger sounds and animations</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}