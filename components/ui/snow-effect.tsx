'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function SnowEffect() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (dimensions.width === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full opacity-70"
          initial={{
            x: Math.random() * dimensions.width,
            y: -10,
          }}
          animate={{
            y: dimensions.height + 10,
            x: Math.random() * dimensions.width,
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
  );
}
