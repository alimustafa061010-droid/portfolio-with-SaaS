import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("");

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const onMouseMove = (e: MouseEvent) => {
      gsap.to([cursor, pillRef.current], {
        x: e.clientX,
        y: e.clientY,
        duration: 0.1,
        ease: 'power3.out',
      });

      // Check if hovering over element with data-cursor-text
      const target = e.target as HTMLElement;
      const cursorText = target?.closest('[data-cursor-text]')?.getAttribute('data-cursor-text');
      
      if (cursorText) {
        setLabel(cursorText);
        gsap.to(pillRef.current, { 
            scale: 1, // Retaining scale from original logic
            y: 0, // Adding y animation
            opacity: 1, 
            duration: 1.2, // Using duration from the provided 'transition'
            ease: "easeOut" // Using ease from the provided 'transition'
        });
        gsap.to(cursor, { opacity: 0, duration: 0.2 });
      } else {
        gsap.to(pillRef.current, { 
            scale: 0.5, 
            opacity: 0, 
            duration: 0.3, 
            ease: 'expo.in' 
        });
        gsap.to(cursor, { opacity: 1, duration: 0.2 });
      }
    };

    window.addEventListener('mousemove', onMouseMove);

    // Simple hover effect for all buttons/links if no data-cursor-text
    const interactiveElements = document.querySelectorAll('a, button:not([data-cursor-text])');
    interactiveElements.forEach((el) => {
        el.addEventListener('mouseenter', () => {
            if (!el.hasAttribute('data-cursor-text')) {
                gsap.to(cursor, { scale: 3, duration: 0.3 });
            }
        });
        el.addEventListener('mouseleave', () => {
            gsap.to(cursor, { scale: 1, duration: 0.3 });
        });
    });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <>
      {/* Main Cursor Dot */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 w-1.5 h-1.5 bg-white rounded-full pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2"
      />

      <div
        ref={pillRef}
        className="fixed top-0 left-0 z-[9998] pointer-events-none -translate-x-1/2 -translate-y-1/2 scale-0 opacity-0"
      >
        <div className="px-3 py-1 bg-white rounded-full transition-transform">
           <span className="text-[10px] font-bold uppercase tracking-widest text-black whitespace-nowrap">
             {label}
           </span>
        </div>
      </div>
    </>
  );
}
