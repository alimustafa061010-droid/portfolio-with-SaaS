import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function AboutSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Pin entire section
    ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top top',
      end: '+=150%',
      pin: true,
      scrub: 1,
    });

    // Reveal text lines on scroll
    gsap.from('.about-reveal', {
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 40%',
        end: 'bottom top',
        scrub: 1,
      },
      y: 100,
      opacity: 0,
      stagger: 0.1,
      ease: 'power4.out',
    });

    // Parallax background text
    gsap.to('.about-bg-text', {
        scrollTrigger: {
            trigger: containerRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.5,
        },
        x: (i) => i === 0 ? -300 : 300,
        scale: 1.2,
        opacity: 0.1
    });

    // Mask animation for headers
    gsap.from('.header-mask', {
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top center',
        end: 'top 20%',
        scrub: 1,
      },
      yPercent: 100,
      stagger: 0.1,
      ease: 'none'
    });
  }, { scope: containerRef });

  return (
    <section id="about" className="relative w-full min-h-screen py-24 md:py-32 flex items-center bg-transparent overflow-hidden" ref={containerRef}>
      
      {/* Background Scrolling Text */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full whitespace-nowrap pointer-events-none opacity-5 flex flex-col items-start gap-4">
          <span className="about-bg-text text-[30vw] font-black uppercase tracking-tighter text-transparent leading-none inline-block" style={{ WebkitTextStroke: '2px white' }}>Identity Design Development</span>
          <span className="about-bg-text text-[30vw] font-black uppercase tracking-tighter text-transparent leading-none self-end inline-block" style={{ WebkitTextStroke: '2px white' }}>Identity Design Development</span>
      </div>

      <div className="max-w-screen-2xl mx-auto w-full px-6 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 relative z-10">
        
        {/* Left: Section Info (Pins via ScrollTrigger parent) */}
        <div className="flex flex-col">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] mb-12">
                03 / THE DRIVE
            </span>
            <div className="flex flex-col leading-[0.8] mb-12 overflow-hidden">
                <div className="header-mask">
                  <h2 className="text-[15vw] md:text-[12vw] font-black uppercase text-white tracking-tighter">
                    About
                  </h2>
                </div>
                <div className="header-mask">
                  <h2 className="text-[15vw] md:text-[12vw] font-black uppercase text-transparent tracking-tighter" style={{ WebkitTextStroke: '2px rgba(255,255,255,0.2)' }}>
                    Me
                  </h2>
                </div>
            </div>
        </div>

        {/* Right: Narrative Content */}
        <div className="flex flex-col justify-end pb-12">
           <div className="max-w-xl self-end space-y-8">
              <div className="about-reveal">
                <p className="text-[10px] font-mono text-accent uppercase tracking-[0.2em]">Beyond The Code</p>
              </div>
              <div className="about-reveal">
                <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-[0.9] text-white">
                   Merging logic <br/>with imagination to <br/>create digital artifacts.
                </h3>
              </div>
              <div className="about-reveal">
                <p className="text-sm text-zinc-400 font-medium leading-relaxed uppercase tracking-wider">
                  I'm a creative developer who treats the web as a boundless canvas for interactive storytelling. My focus lies at the intersection of high-fidelity visual design and robust engineering architectures. Inspired by the meticulous nature of pixel-perfect design, I build immersive 3D experiences that bridge the gap between human and machine.
                </p>
              </div>
              <div 
                data-cursor-text="CONTACT"
                className="about-reveal group flex items-center gap-4 cursor-pointer"
              >
                 <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white text-lg transition-all group-hover:bg-accent group-hover:text-black group-hover:border-accent">
                    →
                 </div>
                 <span className="text-sm font-bold uppercase tracking-widest text-zinc-200 group-hover:text-white">Get in touch</span>
              </div>
           </div>
        </div>

      </div>
    </section>
  );
}
