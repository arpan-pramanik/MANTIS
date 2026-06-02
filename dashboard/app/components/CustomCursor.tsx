'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Only run on desktop
    if (window.innerWidth <= 768) return;

    const cursor = cursorRef.current;
    const textNode = textRef.current;
    if (!cursor || !textNode) return;

    let isVisible = false;

    // Move cursor with mouse using GSAP for smoothness
    const onMouseMove = (e: MouseEvent) => {
      if (!isVisible) {
        isVisible = true;
        gsap.to(cursor, { opacity: 1, duration: 0.3 });
      }
      gsap.to(cursor, {
        x: e.clientX + 15,
        y: e.clientY + 15,
        duration: 0.1,
        ease: 'power2.out',
      });
    };

    const onMouseLeave = () => {
      isVisible = false;
      gsap.to(cursor, { opacity: 0, duration: 0.3 });
    };

    window.addEventListener('mousemove', onMouseMove);
    document.body.addEventListener('mouseleave', onMouseLeave);

    // Add listeners to interactive elements
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const cursorData = target.closest('[data-cursor]');
      if (cursorData) {
        textNode.innerText = cursorData.getAttribute('data-cursor') || '';
      } else if (target.closest('a') || target.closest('button')) {
        // Just scale up slightly for normal links
        gsap.to(cursor, { scale: 1.2, duration: 0.2 });
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      textNode.innerText = 'FURO STUDIO';
      gsap.to(cursor, { scale: 1, duration: 0.2 });
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.body.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="custom-cursor fixed top-0 left-0 pointer-events-none z-[9999] flex items-center bg-black/45 backdrop-blur-md border border-white/10 px-4 py-2 rounded font-sans text-xs uppercase tracking-wider text-white whitespace-nowrap opacity-0"
    >
      <span className="text-brand-orange text-base leading-none mr-2">•</span>
      <span ref={textRef} className="text-[10px] font-medium">FURO STUDIO</span>
    </div>
  );
}
