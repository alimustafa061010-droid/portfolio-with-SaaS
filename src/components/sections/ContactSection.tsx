import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function ContactSection() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from('.contact-reveal', {
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 80%',
      },
      y: 30,
      opacity: 0.5,
      duration: 1,
      stagger: 0.1,
      ease: 'power3.out'
    });

    ScrollTrigger.refresh();
  }, { scope: containerRef });

  return (
    <section id="contact" className="relative w-full py-24 md:py-48 bg-transparent px-6 md:px-8 flex flex-col items-center justify-center min-h-screen overflow-hidden" ref={containerRef}>
      
      {/* Background Graphic Hint */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] bg-accent/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-screen-2xl mx-auto w-full flex flex-col items-center text-center">
        <span className="contact-reveal text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] mb-12">
            05 / CONTACT
        </span>
        
        <div className="flex flex-col leading-[0.8] mb-12">
            <h2 className="contact-reveal text-[15vw] md:text-[12vw] font-black uppercase text-white tracking-tighter">
                Let's
            </h2>
            <h2 className="contact-reveal text-[15vw] md:text-[12vw] font-black uppercase text-transparent tracking-tighter" style={{ WebkitTextStroke: '2px rgba(255,255,255,0.2)' }}>
                Collaborate
            </h2>
        </div>

        <p className="contact-reveal text-sm md:text-lg text-zinc-400 font-medium uppercase tracking-[0.2em] max-w-2xl mb-24">
            Currently accepting new projects for Q2 2026. <br className="hidden md:block" /> Let's build something extraordinary together.
        </p>

        <a 
          href="mailto:navaishkhan@gmail.com" 
          data-cursor-text="SAY HELLO"
          className="contact-reveal group relative flex items-center gap-4 md:gap-6 px-6 md:px-12 py-6 md:py-8 border border-white/10 rounded-full hover:border-accent transition-all duration-500 max-w-full overflow-hidden"
        >
          <div className="absolute inset-0 bg-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left rounded-full" />
          <span className="relative z-10 text-base md:text-3xl font-black uppercase tracking-tighter text-white group-hover:text-black transition-colors duration-500 truncate">navaishkhan@gmail.com</span>
          <div className="relative z-10 flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full border border-white/20 flex items-center justify-center text-white group-hover:border-black/20 group-hover:text-black transition-all duration-500">
             →
          </div>
        </a>

        {/* Footer Links */}
        <div className="mt-16 md:mt-32 w-full flex flex-col md:flex-row justify-between items-center gap-6 border-t border-white/5 pt-10">
            <div className="flex gap-8">
                {['Twitter', 'LinkedIn', 'Instagram'].map((item) => (
                    <a key={item} href="#" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
                        {item}
                    </a>
                ))}
            </div>
            <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                © 2026 / Navaish Khan Portfolio
            </div>
        </div>
      </div>
    </section>
  );
}
