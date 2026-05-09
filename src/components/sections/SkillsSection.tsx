import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const skills = [
  { name: 'React.js', image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800' },
  { name: 'Next.js', image: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=800' },
  { name: 'Python (Flask)', image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800' },
  { name: 'OpenCV / AI', image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=800' },
  { name: 'SQLAlchemy', image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=800' },
  { name: 'Three.js', image: '/creative_development_aesthetic_1774347411343.png' },
  { name: 'GSAP', image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800' },
  { name: 'Data Engine', image: 'https://images.unsplash.com/photo-1551288049-bbbda536339a?q=80&w=800' },
  { name: 'TypeScript', image: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?q=80&w=800' },
  { name: 'Framer', image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=800' },
  { name: 'Analytics', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800' },
  { name: 'Cloud Sys', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800' },
];

export default function SkillsSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Header Reveal
    gsap.from('.skill-title-outline', {
        scrollTrigger: {
            trigger: '.skill-title-outline',
            start: 'top 90%',
            end: 'bottom center',
            scrub: 1,
        },
        x: -50,
        opacity: 0.5,
    });

    // Reveal grid items
    gsap.from('.skill-card', {
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 95%',
      },
      y: 30,
      opacity: 0.5,
      stagger: 0.05,
      duration: 0.8,
      ease: 'power2.out',
    });

    ScrollTrigger.refresh();
  }, { scope: containerRef });

  return (
    <section id="skills" className="relative w-full py-24 md:py-32 bg-transparent overflow-hidden px-6 md:px-8" ref={containerRef}>
      
      <div className="max-w-screen-2xl mx-auto mb-24 flex flex-col items-start">
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] mb-6">
            04 / CAPABILITIES
        </span>
        <div className="flex flex-col leading-[0.8] mb-8">
            <h2 className="text-[15vw] md:text-[12vw] font-black uppercase text-white tracking-tighter">
               Stack
            </h2>
            <h2 className="skill-title-outline text-[15vw] md:text-[12vw] font-black uppercase text-transparent tracking-tighter" style={{ WebkitTextStroke: '2px rgba(255,255,255,0.2)' }}>
               Stack
            </h2>
        </div>
      </div>

      <div className="skill-grid max-w-screen-2xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
        {skills.map((skill, i) => (
          <div key={i} className="skill-card group relative h-[220px] md:h-[280px] rounded-2xl overflow-hidden border border-white/5 bg-zinc-950/20 backdrop-blur-xl flex flex-col justify-end p-6 md:p-8 transition-all duration-500 hover:border-accent/30 cursor-default">
             <div className="absolute inset-0 z-0 overflow-hidden">
                <img 
                  src={skill.image} 
                  alt={skill.name}
                  className="w-full h-full object-cover opacity-20 grayscale group-hover:grayscale-0 group-hover:opacity-60 scale-110 group-hover:scale-100 transition-all duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
             </div>
             <div className="relative z-10">
                <span className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter leading-none block">{skill.name}</span>
             </div>
          </div>
        ))}
      </div>
    </section>
  );
}
