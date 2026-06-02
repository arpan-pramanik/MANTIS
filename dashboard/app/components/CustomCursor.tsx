'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const isHovering = useRef(false);

  useEffect(() => {
    const cursor = cursorRef.current;
    const textNode = textRef.current;
    
    if (!cursor || !textNode) return;

    // We use a small offset so the cursor dot is centered on the mouse pointer
    // Standard size is 12px, so 6px offset.
    const xOffset = 6;
    const yOffset = 6;

    // Set initial position off-screen so it doesn't flash in the corner
    gsap.set(cursor, { x: -100, y: -100 });

    const moveCursor = (e: MouseEvent) => {
      // Use gsap.to for smooth following
      gsap.to(cursor, {
        x: e.clientX - xOffset,
        y: e.clientY - yOffset,
        duration: 0.15,
        ease: 'power2.out'
      });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if we're hovering over something interactive
      const isInteractive = 
        target.tagName.toLowerCase() === 'a' || 
        target.tagName.toLowerCase() === 'button' ||
        target.closest('a') || 
        target.closest('button') ||
        target.hasAttribute('data-cursor');

      if (isInteractive) {
        isHovering.current = true;
        
        // If it has specific text to display (like our Work items)
        const cursorText = target.getAttribute('data-cursor') || target.closest('[data-cursor]')?.getAttribute('data-cursor');
        
        if (cursorText) {
          textNode.innerText = cursorText;
          gsap.to(cursor, {
            width: 80,
            height: 80,
            backgroundColor: '#10B981',
            mixBlendMode: 'normal',
            duration: 0.3,
            ease: 'back.out(1.5)'
          });
          gsap.to(textNode, { opacity: 1, duration: 0.2 });
        } else {
          // Standard hover state (just enlarge slightly and change color)
          textNode.innerText = 'MANTIS';
          gsap.to(cursor, {
            scale: 1.5,
            backgroundColor: '#10B981',
            mixBlendMode: 'difference',
            duration: 0.3
          });
          gsap.to(textNode, { opacity: 0, duration: 0.2 });
        }
      }
    };

    const handleMouseOut = () => {
      isHovering.current = false;
      // Reset to default state
      gsap.to(cursor, {
        width: 12,
        height: 12,
        scale: 1,
        backgroundColor: '#10B981',
        mixBlendMode: 'difference',
        duration: 0.3,
        ease: 'power2.out'
      });
      gsap.to(textNode, { opacity: 0, duration: 0.2 });
    };

    window.addEventListener('mousemove', moveCursor);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    // Hide cursor when it leaves the window
    document.addEventListener('mouseleave', () => gsap.to(cursor, { opacity: 0, duration: 0.2 }));
    document.addEventListener('mouseenter', () => gsap.to(cursor, { opacity: 1, duration: 0.2 }));

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, []);

  return (
    <div 
      ref={cursorRef} 
      className="fixed top-0 left-0 w-3 h-3 bg-brand-orange rounded-full pointer-events-none z-[100] flex items-center justify-center overflow-hidden mix-blend-difference hidden md:flex"
      style={{ willChange: 'transform, width, height' }}
    >
      <span ref={textRef} className="text-[10px] font-medium text-black opacity-0 pointer-events-none select-none text-center leading-tight whitespace-nowrap">MANTIS</span>
    </div>
  );
}
