import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { motion, Variants, useMotionValue, useSpring, animate } from 'framer-motion';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const MESSAGES = [
  "Again? We just fixed this.",
  "Bro, stop messing with my layout!",
  "Are you serious? Put it back.",
  "You're making a mess... I'll fix it.",
  "Chill, I need this centered for the vibe.",
  "Layout is NOT a playground!",
  "Navaish is strictly watching your moves."
];

// Typewriter text component
function TypewriterText({ text, speed = 80 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return <span>{displayed}<span className="animate-pulse">▌</span></span>;
}

// Draggable Character handle type
export interface DraggableCharHandle {
  resetTo: (duration?: number) => void;
  getOffset: () => { x: number; y: number };
  getRect: () => DOMRect | undefined;
}

interface DraggableCharProps {
  char: string;
  outlined?: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDrag: (offset: { x: number; y: number }) => void;
  isLoaded: boolean;
  locked?: boolean;
  delay?: number;
}

const DraggableChar = forwardRef<DraggableCharHandle, DraggableCharProps>(
  // locked = no drag allowed (Guardian is handling reset or showing message)
  ({ char, outlined, containerRef, onDragStart, onDragEnd, onDrag, isLoaded, delay = 0, locked = false }, ref) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const springX = useSpring(x, { stiffness: 350, damping: 30 });
    const springY = useSpring(y, { stiffness: 350, damping: 30 });
    const [hovered, setHovered] = useState(false);
    const [dragging, setDragging] = useState(false);

    const innerRef = useRef<HTMLDivElement>(null);
    const charSpanRef = useRef<HTMLSpanElement>(null);

    useImperativeHandle(ref, () => ({
      resetTo: (duration = 0.7) => {
        animate(x, 0, { duration, ease: [0.16, 1, 0.3, 1] });
        animate(y, 0, { duration, ease: [0.16, 1, 0.3, 1] });
      },
      getOffset: () => ({ x: x.get(), y: y.get() }),
      getRect: () => charSpanRef.current?.getBoundingClientRect()
    }));

    const textVariants: Variants = {
      hidden: { y: 80, opacity: 0 },
      visible: {
        y: 0, opacity: 1,
        transition: { duration: 1, ease: 'easeOut', delay }
      }
    };

    return (
      <motion.div
        ref={innerRef}
        drag={!locked}
        dragMomentum={false}
        style={{ x: springX, y: springY }}
        dragConstraints={containerRef}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDragStart={() => { setDragging(true); onDragStart(); }}
        onDragEnd={() => { setDragging(false); onDragEnd(); }}
        onDrag={(_, info) => {
          x.set(info.offset.x);
          y.set(info.offset.y);
          onDrag({ x: info.offset.x, y: info.offset.y });
        }}
        initial="hidden"
        animate={isLoaded ? 'visible' : 'hidden'}
        variants={textVariants}
        className={`relative select-none ${locked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
      >
        {/* Dashed hover/drag box */}
        <div
          className="absolute pointer-events-none transition-all duration-150"
          style={{
            inset: '-6px',
            borderRadius: '6px',
            border: hovered || dragging ? '1.5px dashed rgba(255,255,255,0.45)' : '1.5px dashed transparent',
          }}
        />
        {/* DRAG TO MOVE hint */}
        <div
          className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none transition-opacity duration-150"
          style={{ top: '-28px', opacity: dragging ? 1 : 0 }}
        >
          <span className="text-[8px] bg-white text-black px-1.5 py-0.5 font-bold uppercase tracking-widest rounded-sm">
            DRAG
          </span>
        </div>

        {/* The character */}
        <span
          ref={charSpanRef}
          className="text-[15vw] md:text-[11vw] font-black uppercase leading-[0.85] tracking-tighter font-sans block"
          style={outlined
            ? { color: 'transparent', WebkitTextStroke: '2px white' }
            : { color: 'white' }
          }
        >
          {char}
        </span>
      </motion.div>
    );
  }
);
DraggableChar.displayName = 'DraggableChar';

// ─────────────────────────────────────────
export default function HeroSection({ isLoaded }: { isLoaded: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const NAVAISH = 'Navaish'.split('');
  const KHAN = 'Khan'.split('');
  const ALL_CHARS = [...NAVAISH, ...KHAN];

  // One ref per character
  const charRefs = useRef<(DraggableCharHandle | null)[]>(
    Array(ALL_CHARS.length).fill(null)
  );

  // Cursor tracking
  const [cursorPos, setCursorPos] = useState({ x: -200, y: -200 });

  // Drag state
  const [draggingChar, setDraggingChar] = useState<number | null>(null);
  const [liveCoords, setLiveCoords] = useState({ x: 0, y: 0 });
  const [isLocked, setIsLocked] = useState(false); // disables all drag during reset/message

  // GSAP Scroll Effects
  useGSAP(() => {
    // Scrub Hero Layout on scroll
    gsap.to('.hero-char-wrapper', {
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
      },
      y: (i) => (i % 2 === 0 ? -150 : 150),
      x: (i) => (i % 3 === 0 ? -100 : 100),
      opacity: 0,
      rotate: (i) => (i % 2 === 0 ? -15 : 15),
      scale: 0.8,
    });

    // Parallax hero labels
    gsap.to('.hero-label-parallax', {
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
      y: 200,
      opacity: 0,
    });
  }, { scope: containerRef });

  // Guardian
  const guardianX = useMotionValue(-400);
  const guardianY = useMotionValue(-400);
  const [guardianVisible, setGuardianVisible] = useState(false);
  const [message, setMessage] = useState('');
  const isResetting = useRef(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => setCursorPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const triggerGuardianReset = useCallback(() => {
    if (isResetting.current) return;

    // Check if anything is actually displaced
    const anyMoved = charRefs.current.some(r => {
      if (!r) return false;
      const { x: ox, y: oy } = r.getOffset();
      return Math.abs(ox) > 1 || Math.abs(oy) > 1;
    });
    if (!anyMoved) return;

    isResetting.current = true;
    setIsLocked(true);
    setDraggingChar(null);

    // Find the most displaced character
    let maxDisp = 0;
    let targetX = 0;
    let targetY = 0;
    let homeX = 0;
    let homeY = 0;

    charRefs.current.forEach(r => {
      if (!r) return;
      const { x: ox, y: oy } = r.getOffset();
      const rect = r.getRect(); 
      if (!rect) return;
      const disp = Math.abs(ox) + Math.abs(oy);
      
      if (disp > maxDisp) {
        maxDisp = disp;
        targetX = rect.left + rect.width / 2;
        targetY = rect.top + rect.height / 2;
        homeX = targetX - ox;
        homeY = targetY - oy;
      }
    });

    const offX = window.innerWidth + 100;
    const offY = -100;

    setMessage('');
    guardianX.set(offX);
    guardianY.set(offY);
    setGuardianVisible(true);

    // Phase 1: Fly to character
    animate(guardianX, targetX, { duration: 0.45, ease: 'easeOut' });
    animate(guardianY, targetY, { 
      duration: 0.45, 
      ease: 'easeOut',
      onComplete: () => {
        // Phase 2: Drag back in sync
        const dragEase = [0.16, 1, 0.3, 1] as const;
        const dragDur = 0.65;
        
        charRefs.current.forEach(r => r?.resetTo(dragDur));
        animate(guardianX, homeX, { duration: dragDur, ease: dragEase });
        animate(guardianY, homeY, { 
          duration: dragDur, 
          ease: dragEase,
          onComplete: () => {
            // Phase 3: Speak
            const chosenMsg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
            setMessage(chosenMsg);
            
            setTimeout(() => {
              // Phase 4: Return to corner
              animate(guardianX, offX, { duration: 0.6, ease: 'easeIn' });
              animate(guardianY, offY, { 
                duration: 0.6, 
                ease: 'easeIn',
                onComplete: () => {
                  setGuardianVisible(false);
                  setTimeout(() => {
                    setMessage('');
                    isResetting.current = false;
                    setIsLocked(false);
                  }, 450);
                }
              });
            }, chosenMsg.length * 80 + 1200);
          }
        });
      }
    });
  }, [guardianX, guardianY]);

  // Right-click triggers Guardian
  useEffect(() => {
    const handleDown = (e: PointerEvent) => {
      if (e.button === 2) { e.preventDefault(); triggerGuardianReset(); }
    };
    const noCtx = (e: Event) => e.preventDefault();
    window.addEventListener('pointerdown', handleDown);
    window.addEventListener('contextmenu', noCtx);
    return () => {
      window.removeEventListener('pointerdown', handleDown);
      window.removeEventListener('contextmenu', noCtx);
    };
  }, [triggerGuardianReset]);

  const handleDragEnd = useCallback(() => {
    setDraggingChar(null);
    setTimeout(() => triggerGuardianReset(), 400);
  }, [triggerGuardianReset]);

  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-transparent pt-24 md:pt-32 px-6 md:px-8 flex flex-col justify-between pb-16 md:pb-24"
    >
      {/* "You" / "Locked" cursor label */}
      <div
        className="pointer-events-none fixed z-[200] flex items-center transition-all duration-300"
        style={{ left: cursorPos.x + 14, top: cursorPos.y - 8, transform: 'translateY(-50%)' }}
      >
        <span
          className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm whitespace-nowrap select-none transition-colors duration-300 bg-black text-white"
        >
          You
        </span>
      </div>

      {/* Live coordinate overlay near cursor */}
      {draggingChar !== null && (
        <div
          className="pointer-events-none fixed z-[200] flex gap-2"
          style={{ left: cursorPos.x + 14, top: cursorPos.y + 14 }}
        >
          <div className="bg-zinc-900/90 border border-white/10 px-1.5 py-0.5 rounded-sm flex gap-1">
            <span className="text-[8px] font-mono text-zinc-500">x:</span>
            <span className="text-[8px] font-mono text-accent">{Math.round(liveCoords.x)}</span>
          </div>
          <div className="bg-zinc-900/90 border border-white/10 px-1.5 py-0.5 rounded-sm flex gap-1">
            <span className="text-[8px] font-mono text-zinc-500">y:</span>
            <span className="text-[8px] font-mono text-accent">{Math.round(liveCoords.y)}</span>
          </div>
        </div>
      )}

      {/* Guardian — single wrapper: cursor + label + message fade together */}
      <motion.div
        className="pointer-events-none fixed z-[199] flex flex-col items-start"
        style={{
          top: 0,
          left: 0,
          x: guardianX,
          y: guardianY,
          transform: 'translate(-5.5px, -3.21px)',
          opacity: guardianVisible ? 1 : 0,
          transition: 'opacity 0.4s ease'
        }}
      >
        <div className="relative flex flex-col items-start gap-1">
          {/* Custom Cursor SVG */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-accent drop-shadow-md">
            <path d="M5.5 3.21V20.8C5.5 21.46 6.27 21.82 6.78 21.4L11.5 16.92L15.34 22.18C15.65 22.61 16.27 22.7 16.7 22.39L18.46 21.11C18.89 20.8 18.98 20.17 18.66 19.74L14.73 14.3H20.21C20.87 14.3 21.24 13.53 20.82 13.02L6.82 2.23C6.44 1.94 5.5 2.11 5.5 3.21Z" fill="currentColor" stroke="black" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
          
          {/* "Navaish Khan" label below and to the right of the cursor */}
          <div className="absolute top-5 left-5 bg-accent px-2 py-0.5 rounded-sm shadow-lg border border-black/10 flex items-center">
            <span className="text-[9px] text-black font-black uppercase tracking-widest whitespace-nowrap">Navaish Khan</span>
          </div>
        </div>

        {message && (
          <div className="mt-5 ml-4 bg-white/10 backdrop-blur-xl px-4 py-2 rounded-lg border border-white/10 shadow-xl max-w-[320px] text-center">
            <span className="text-[13px] text-accent font-bold uppercase italic leading-snug font-mono">
              <TypewriterText text={message} speed={80} />
            </span>
          </div>
        )}
      </motion.div>

      {/* Section label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isLoaded ? { opacity: 1 } : {}}
        transition={{ delay: 1 }}
        className="hero-label-parallax text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em]"
      >
        01 / THE PULSE
      </motion.div>

      {/* Main interactive area */}
      <div className="relative flex-1 flex flex-col items-center justify-center gap-0">

        {/* NAVAISH — letter by letter */}
        <div className="flex items-end">
          {NAVAISH.map((char, i) => (
            <div key={`navaish-${i}`} className="hero-char-wrapper">
              <DraggableChar
                ref={el => { charRefs.current[i] = el; }}
                char={char}
                outlined={false}
                containerRef={containerRef}
                isLoaded={isLoaded}
                locked={isLocked}
                delay={0.05 * i}
                onDragStart={() => setDraggingChar(i)}
                onDragEnd={handleDragEnd}
                onDrag={(offset) => setLiveCoords(offset)}
              />
            </div>
          ))}
        </div>

        {/* KHAN — letter by letter, outlined */}
        <div className="flex items-end">
          {KHAN.map((char, i) => {
            const refIdx = NAVAISH.length + i;
            return (
              <div key={`khan-${i}`} className="hero-char-wrapper">
                <DraggableChar
                  ref={el => { charRefs.current[refIdx] = el; }}
                  char={char}
                  outlined={true}
                  containerRef={containerRef}
                  isLoaded={isLoaded}
                locked={isLocked}
                  delay={0.05 * i + 0.1}
                  onDragStart={() => setDraggingChar(refIdx)}
                  onDragEnd={handleDragEnd}
                  onDrag={(offset) => setLiveCoords(offset)}
                />
              </div>
            );
          })}
        </div>

      </div>

      {/* Hero footer */}
      <div className="hero-label-parallax w-full flex flex-col md:flex-row justify-between items-end gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={isLoaded ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 1.2, duration: 1 }}
          className="max-w-md"
        >
          <h3 className="text-[10px] font-mono text-accent uppercase tracking-[0.2em] mb-4">Crafting Visual Paradoxes</h3>
          <p className="text-zinc-400 text-sm leading-relaxed uppercase tracking-wider font-medium">
            Blending creative chaos with surgical precision. Full-stack designer &amp; developer.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={isLoaded ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 1.4, duration: 1 }}
          className="text-right"
        >
          <span className="text-[4vw] font-black text-zinc-800 uppercase tracking-tighter leading-none block">Navaish</span>
          <span className="text-[4vw] font-black text-zinc-800 uppercase tracking-tighter leading-none block">©2026</span>
        </motion.div>
      </div>
    </section>
  );
}
