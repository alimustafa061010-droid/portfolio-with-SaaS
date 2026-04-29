import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger);

const portals = [
  {
    id: 'mkt-inventory',
    title: 'MKT Modern',
    subtitle: 'SaaS Inventory Cloud',
    description: 'A professional-grade SaaS inventory management engine. Features real-time multi-user syncing, automated PDF reporting (ReportLab), and AI-driven stock analysis.',
    image: '/mkt_inventory_system_mockup_1774347286704.png',
    link: '/auth'
  },
  {
    id: 'creative-dev',
    title: 'Visual Core',
    subtitle: 'High-Fidelity Rendering',
    description: 'Cloud-based 3D development environment. Access our proprietary GSAP and Three.js toolsets for creating premium digital artifacts.',
    image: '/creative_development_aesthetic_1774347411343.png',
    link: '/auth'
  }
];

export default function PortalsSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Header Reveal
    gsap.from('.portal-title-outline', {
        scrollTrigger: {
            trigger: '.portal-title-outline',
            start: 'top 90%',
            end: 'bottom center',
            scrub: 1,
        },
        x: -50,
        opacity: 0.5,
    });

    // Portal Cards Reveal
    gsap.from('.portal-card', {
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 95%',
        toggleActions: 'play none none reverse',
      },
      y: 30,
      scale: 0.98,
      stagger: 0.1,
      duration: 1,
      ease: 'power2.out',
    });

    ScrollTrigger.refresh();
  }, { scope: containerRef });

  return (
    <section id="portals" className="relative w-full py-32 bg-transparent overflow-hidden px-8" ref={containerRef}>
      
      <div className="max-w-screen-2xl mx-auto flex flex-col items-start mb-24 cursor-default">
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] mb-6">
          05 / SYSTEM ACCESS
        </span>
        <div className="flex flex-col leading-[0.8]">
            <h2 className="text-[15vw] md:text-[12vw] font-black uppercase text-white tracking-tighter">
               Portals
            </h2>
            <h2 className="portal-title-outline text-[15vw] md:text-[12vw] font-black uppercase text-transparent tracking-tighter" style={{ WebkitTextStroke: '2px rgba(255,255,255,0.2)' }}>
               Portals
            </h2>
        </div>
      </div>

      <div className="portal-card-container max-w-screen-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
        {portals.map((portal) => (
          <motion.div
            key={portal.id}
            whileHover={{ y: -10 }}
            onClick={() => {
              if (portal.link.startsWith('http')) {
                window.open(portal.link, '_blank');
              } else {
                window.location.href = portal.link;
              }
            }}
            className="portal-card group relative h-[500px] rounded-3xl overflow-hidden cursor-pointer border border-white/5 bg-zinc-950/20 backdrop-blur-3xl flex flex-col justify-end p-12 transition-all duration-700 hover:border-accent/30"
          >
            {/* Background Image with Parallax / Scale */}
            <div className="absolute inset-0 z-0 overflow-hidden">
               <img 
                 src={portal.image} 
                 alt={portal.title}
                 className="w-full h-full object-cover opacity-30 grayscale group-hover:grayscale-0 group-hover:opacity-60 scale-110 group-hover:scale-100 transition-all duration-1000 ease-out"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col space-y-4 max-w-sm">
               <div className="flex flex-col">
                  <span className="text-[10px] font-mono text-accent uppercase tracking-[0.4em] mb-2">{portal.subtitle}</span>
                  <h3 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-tight italic">{portal.title}</h3>
               </div>
               <p className="text-sm text-zinc-400 font-medium leading-relaxed uppercase tracking-wider mb-6 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                  {portal.description}
               </p>
               <button className="flex items-center gap-4 w-fit group/btn">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-white text-xs group-hover/btn:bg-accent group-hover/btn:text-black transition-all duration-300">
                    →
                  </div>
                  <span className="text-[10px] font-black text-white uppercase tracking-widest group-hover/btn:text-accent group-hover/btn:translate-x-2 transition-all duration-300">Enter System</span>
               </button>
            </div>

            {/* Top-right Status Indicator */}
            <div className="absolute top-8 right-8 flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
               <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
               <span className="text-[8px] font-mono text-accent font-bold uppercase tracking-widest">System Online</span>
            </div>
          </motion.div>
        ))}
      </div>
      
    </section>
  );
}
