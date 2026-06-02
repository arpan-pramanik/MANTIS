'use client';
import { useState, useEffect } from 'react';

const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/~';
const TARGET_WORD = 'MANTIS';

export default function Preloader() {
  const [displayText, setDisplayText] = useState('------');
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [complete, setComplete] = useState(false);
  
  useEffect(() => {
    let iteration = 0;
    let progressValue = 0;
    
    // Progress Bar Animation
    const progressInterval = setInterval(() => {
      progressValue += Math.random() * 5;
      if (progressValue >= 100) {
        progressValue = 100;
        clearInterval(progressInterval);
      }
      setProgress(progressValue);
    }, 50);

    // Text Scramble Animation
    const scrambleInterval = setInterval(() => {
      setDisplayText(prev => {
        return TARGET_WORD.split('')
          .map((letter, index) => {
            if (index < iteration) {
              return TARGET_WORD[index];
            }
            return CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
          })
          .join('');
      });

      if (iteration >= TARGET_WORD.length) {
        clearInterval(scrambleInterval);
        setTimeout(() => {
            setExiting(true);
            setTimeout(() => setComplete(true), 1200); // Wait for exit animation
        }, 800);
      }
      
      // Sync text reveal with progress
      if (progressValue > (iteration / TARGET_WORD.length) * 100) {
          iteration += 1 / 4; 
      }

    }, 40);

    return () => {
      clearInterval(scrambleInterval);
      clearInterval(progressInterval);
    };
  }, []);

  if (complete) return null;

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black transition-all duration-1000 ease-[cubic-bezier(0.87,0,0.13,1)] ${exiting ? 'opacity-0 scale-110 blur-xl' : 'opacity-100 scale-100 blur-0'}`}>
        {/* Top/Bottom Letterbox Bars (Cinematic effect) */}
        <div className={`absolute top-0 left-0 w-full h-[15vh] bg-black transition-transform duration-1000 ease-[cubic-bezier(0.87,0,0.13,1)] ${exiting ? '-translate-y-full' : 'translate-y-0'}`}></div>
        <div className={`absolute bottom-0 left-0 w-full h-[15vh] bg-black transition-transform duration-1000 ease-[cubic-bezier(0.87,0,0.13,1)] ${exiting ? 'translate-y-full' : 'translate-y-0'}`}></div>

        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center">
            {/* Decrypting Text */}
            <div className="text-4xl md:text-6xl font-mono font-bold tracking-[0.4em] md:tracking-[0.6em] text-brand-light mb-8 select-none pl-4 md:pl-6">
                {displayText.split('').map((char, i) => (
                    <span key={i} className={char === TARGET_WORD[i] ? 'text-brand-orange transition-colors duration-300' : 'text-brand-light/30'}>
                        {char}
                    </span>
                ))}
            </div>

            {/* Subtle Subtitle */}
            <div className="text-[10px] tracking-[0.4em] uppercase text-brand-light/40 mb-12 font-mono overflow-hidden h-4">
               <div className={`flex flex-col transition-transform duration-500 ease-out ${progress >= 100 ? '-translate-y-4' : 'translate-y-0'}`}>
                   <span className="h-4 flex items-center justify-center">Decrypting Secure Payload...</span>
                   <span className="h-4 flex items-center justify-center text-brand-orange">System Ready</span>
               </div>
            </div>

            {/* Precision Progress Bar */}
            <div className="w-64 md:w-96 h-[1px] bg-brand-light/10 relative overflow-hidden">
                <div 
                    className="absolute top-0 left-0 h-full bg-brand-orange transition-all duration-100 ease-out"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            
            {/* Percentage Text */}
            <div className="mt-4 text-[10px] font-mono text-brand-light/30 tracking-widest tabular-nums w-full text-center">
                {Math.min(100, Math.floor(progress)).toString().padStart(3, '0')}%
            </div>
            
            {/* Decorative Brackets framing the loader */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[150%] border-x border-brand-light/5 opacity-50 pointer-events-none transition-all duration-1000 ${exiting ? 'scale-150 opacity-0' : 'scale-100 opacity-50'}`}>
                <div className="absolute top-0 left-0 w-2 h-[1px] bg-brand-light/20"></div>
                <div className="absolute top-0 right-0 w-2 h-[1px] bg-brand-light/20"></div>
                <div className="absolute bottom-0 left-0 w-2 h-[1px] bg-brand-light/20"></div>
                <div className="absolute bottom-0 right-0 w-2 h-[1px] bg-brand-light/20"></div>
            </div>
        </div>
    </div>
  );
}
