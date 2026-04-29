import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function Preloader({ onComplete }: { onComplete: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        onComplete();
      }
    });

    // Animate progress number
    tl.to(
      { value: 0 },
      {
        value: 100,
        duration: 2.5,
        ease: 'power3.inOut',
        onUpdate: function (this: any) {
          setProgress(Math.round(this.targets()[0].value));
        },
      }
    );

    // Fade out text
    tl.to(textRef.current, {
      opacity: 0,
      duration: 0.5,
      ease: 'power2.in',
    });

    // Slide container up exactly like Magic5/Awwwards sites
    tl.to(containerRef.current, {
      yPercent: -100,
      duration: 1.2,
      ease: 'expo.inOut',
    }, '-=0.2');

  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black text-white"
    >
      <div ref={textRef} className="flex flex-col items-center">
        <span className="text-[10px] font-mono tracking-[0.3em] uppercase mb-4 text-zinc-500">System Initialization</span>
        <h1 className="text-[20vw] font-black tracking-tighter leading-none font-sans">
          {progress}<span className="text-accent underline decoration-4 underline-offset-8">%</span>
        </h1>
        <div className="mt-8 flex gap-2">
            {[...Array(5)].map((_, i) => (
                <div key={i} className={`w-1 h-1 rounded-full ${progress > (i+1)*20 ? 'bg-accent' : 'bg-zinc-800'}`} />
            ))}
        </div>
      </div>
    </div>
  );
}
