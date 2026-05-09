import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, AnimatePresence } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger);

const projects = [
  { 
    id: 1, 
    title: 'MKT Modern', 
    tag: 'SaaS / ERP / Dashboard', 
    size: 'col-span-1 md:col-span-2 row-span-2', 
    color: 'bg-zinc-900',
    tech: ['Python', 'Flask', 'SQLAlchemy', 'ReportLab'],
    overview: 'An advanced enterprise inventory management cloud. Automates stock lifecycle, generates professional invoice PDFs, and manages large-scale customer data through a custom CRM layer.',
    image: '/mkt_inventory_system_mockup_1774347286704.png',
    prompt: 'A futuristic ERP dashboard for MKT Modern, dark mode, neon green accents, sleek data viz.'
  },
  { 
    id: 2, 
    title: 'Visual Core', 
    tag: 'Web3D / Graphic Design', 
    size: 'col-span-1 row-span-2', 
    color: 'bg-zinc-950',
    tech: ['Three.js', 'GSAP', 'WebGL', 'GLSL'],
    overview: 'A proprietary rendering engine for high-end web artifacts. Features sub-pixel accurate animations and custom shader-based deconstruction effects.',
    image: '/creative_development_aesthetic_1774347411343.png',
    prompt: 'Abstract geometric 3D shards, high-fashion aesthetic, metallic textures, emerald green lighting.'
  },
  { 
    id: 3, 
    title: 'Aura AR', 
    tag: 'Augmented Reality / Mobile', 
    size: 'col-span-1 row-span-1', 
    color: 'bg-zinc-900',
    tech: ['React Native', 'Swift', 'ARKit', 'Unity'],
    overview: 'Augmented reality mobile app for virtual interior staging. Real-time spatial tracking and furniture projection with photorealistic shadows.',
    image: '/aura_ar.png',
    prompt: 'AR UI overlaying a modern apartment, 3D furniture models, measurement markers, minimalist HUD.'
  },
  { 
    id: 4, 
    title: 'Vantage Finance', 
    tag: 'FinTech / Real-time Data', 
    size: 'col-span-1 row-span-1', 
    color: 'bg-zinc-900',
    tech: ['Next.js', 'WebSockets', 'Prisma', 'D3.js'],
    overview: 'High-frequency stock market analysis platform. Visualizes millions of data points per second with zero-latency updates and algorithmic trading indicators.',
    image: '/vantage_finance.png',
    prompt: 'Complex financial charts, dark glassy textures, electric blue and white lighting, data density.'
  },
  { 
    id: 5, 
    title: 'Neural Lab', 
    tag: 'AI / Image Generation', 
    size: 'col-span-1 md:col-span-2 row-span-1', 
    color: 'bg-zinc-900',
    tech: ['PyTorch', 'Fastify', 'PostgreSQL', 'Python'],
    overview: 'AI-powered lab for custom image generation and style transfer. Built on top of Stable Diffusion with advanced controlnet features for fine-grained artist control.',
    image: '/neural_lab.png',
    prompt: 'Neural network visualizations, abstract brain structures, vibrant gradients, glowing nodes.'
  },
  { 
    id: 6, 
    title: 'Sentinel Web3', 
    tag: 'Identity / Blockchain', 
    size: 'col-span-1 row-span-1', 
    color: 'bg-zinc-950',
    tech: ['Solidity', 'Rust', 'Substrate', 'TypeScript'],
    overview: 'A decentralized sovereign identity platform ensuring privacy and credential verification on-chain without exposing sensitive PII.',
    image: '/sentinel_web3.png',
    prompt: 'Encrypted code matrix, digital fingerprint abstract, violet and cyan accent lighting, secure textures.'
  },
  { 
    id: 7, 
    title: 'Zenith CRM', 
    tag: 'Enterprise / Management', 
    size: 'col-span-1 row-span-1', 
    color: 'bg-zinc-900',
    tech: ['C#', '.NET Core', 'Azure', 'Angular'],
    overview: 'Cloud-native CRM system for global logistics. Tracks shipments, manages warehouse inventories, and handles multi-region compliance.',
    image: '/zenith_crm.png',
    prompt: 'Warehouse logistics UI, supply chain map, minimalist clean design, azure blue accents.'
  },
  { 
    id: 8, 
    title: 'Lumina OS', 
    tag: 'Design System / UI Kit', 
    size: 'col-span-1 md:col-span-2 row-span-2', 
    color: 'bg-zinc-950',
    tech: ['Tailwind', 'Figma API', 'Stencil.js', 'WebComponents'],
    overview: 'Comprehensive design system for multi-platform products. Ensures pixel-perfect consistency across web, mobile, and desktop applications through unified tokens.',
    image: '/lumina_os.png',
    prompt: 'Abstract UI components flying in space, design tokens, color swatches, glassmorphism UI kit.'
  },
  { 
    id: 9, 
    title: 'Pulse Analytics', 
    tag: 'SEO / Marketing SaaS', 
    size: 'col-span-1 row-span-1', 
    color: 'bg-zinc-900',
    tech: ['Go', 'ClickHouse', 'Grafana', 'Next.js'],
    overview: 'Real-time marketing analytics engine. Tracks cross-channel attribution and calculates customer lifetime value through machine learning models.',
    image: '/pulse_analytics.png',
    prompt: 'Pulse waves, heart rate styled data lines, neon red and black gradients, aggressive high-end UI.'
  },
];

export default function ProjectsBento() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const terminalScrollRef = useRef<HTMLDivElement>(null);

  const activeProject = projects.find(p => p.id === selectedId);

  const startBootSequence = () => {
    if (!activeProject) return;
    setIsTerminalOpen(true);
    setTerminalLogs([]);
    
    const logs = [
      `> INITIALIZING NODE [${activeProject.title.toUpperCase()}]`,
      `> SECURE_AUTH: RSA_KEY_VERIFIED`,
      `> BOOTING VIRTUAL ENVIRONMENT...`,
      `> FETCHING CLOUD_CORE_RESOURCES... [OK]`,
      `> LOADING MODULES: ${activeProject.tech.join(', ')}`,
      `> CHECKING DATABASE INTEGRITY... [DONE]`,
      `> SYSTEM_LATENCY: 14MS`,
      `> NODE STATUS: ONLINE`,
      `> ACCESS GRANTED.`,
      `> RUNNING SIMULATION...`
    ];

    logs.forEach((log, i) => {
      setTimeout(() => {
        setTerminalLogs(prev => [...prev, log]);
      }, i * 250);
    });
  };

  useGSAP(() => {
    // Header Reveal
    gsap.from('.work-title-outline', {
        scrollTrigger: {
            trigger: '.work-title-outline',
            start: 'top 90%',
            end: 'bottom center',
            scrub: 1,
        },
        x: -50,
        opacity: 0.5,
    });

    // Cards Reveal
    gsap.from('.bento-card', {
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 95%',
        toggleActions: 'play none none reverse',
      },
      y: 30,
      stagger: 0.05,
      duration: 0.8,
      ease: 'power2.out',
    });

    ScrollTrigger.refresh();
  }, { scope: containerRef });

  useEffect(() => {
    if (terminalScrollRef.current) {
      terminalScrollRef.current.scrollTop = terminalScrollRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  return (
    <section id="projects" className="relative w-full min-h-screen bg-transparent px-6 md:px-8 py-24 md:py-32">
      <div className="max-w-screen-2xl mx-auto" ref={containerRef}>
        
        <div className="flex flex-col mb-24">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] mb-6">
                02 / SELECTED WORK
            </span>
            <div className="flex flex-col leading-[0.8] mb-8">
                <h2 className="text-[15vw] md:text-[12vw] font-black uppercase text-white tracking-tighter">
                   Work
                </h2>
                <h2 className="work-title-outline text-[15vw] md:text-[12vw] font-black uppercase text-transparent tracking-tighter" style={{ WebkitTextStroke: '2px rgba(255,255,255,0.2)' }}>
                   Work
                </h2>
            </div>
            <p className="text-sm text-zinc-400 font-medium uppercase tracking-[0.2em] max-w-xl">
               A collection of digital artifacts ranging from SaaS platforms to experimental 3D engines. Every project is a synthesis of logic and imagination.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[350px]">
          {projects.map((project) => (
             <motion.div 
              key={project.id} 
              layoutId={`card-${project.id}`}
              onClick={() => setSelectedId(project.id)}
              className={`bento-card group relative rounded-3xl overflow-hidden p-10 flex flex-col justify-between cursor-pointer border border-white/5 transition-all duration-700 hover:border-accent/40 ${project.size} ${project.color}`}
            >
               <div className="absolute inset-0 z-0 overflow-hidden">
                  {project.image ? (
                    <img 
                      src={project.image} 
                      alt={project.title} 
                      className="w-full h-full object-cover opacity-30 grayscale group-hover:grayscale-0 group-hover:opacity-100 scale-110 group-hover:scale-100 transition-all duration-1000 ease-out" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-black translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
               </div>

               <div className="relative z-10 w-full flex justify-between items-start">
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-mono text-accent uppercase tracking-[0.2em]">
                      {project.tag}
                    </span>
                    <div className="flex gap-2">
                      {project.tech.slice(0, 3).map((t, i) => (
                        <span key={i} className="text-[8px] font-mono text-zinc-500 border border-white/10 px-2 py-0.5 rounded-full uppercase">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white text-xs -rotate-45 group-hover:rotate-0 group-hover:bg-accent group-hover:text-black transition-all duration-500">
                    →
                  </div>
               </div>

               <div className="relative z-10">
                  <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white leading-none">
                    {project.title.split(' ').map((word, i) => (
                        <span key={i} className="block">{word}</span>
                    ))}
                  </h3>
               </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedId && activeProject && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setSelectedId(null); setIsTerminalOpen(false); }}
              className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md cursor-pointer"
            />
            <motion.div 
              layoutId={`card-${selectedId}`}
              className="fixed inset-0 md:inset-12 z-[70] bg-zinc-900 border border-white/10 md:rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl"
            >
               <div className="w-full md:w-1/2 h-64 md:h-full relative overflow-hidden bg-zinc-950">
                  {activeProject.image ? (
                    <img 
                      src={activeProject.image} 
                      alt={activeProject.title} 
                      className="w-full h-full object-cover opacity-60" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-black" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
                  
                  <div className="absolute bottom-12 left-12 right-12">
                     <span className="text-xs font-mono text-accent uppercase tracking-[0.3em] mb-4 block">{activeProject.tag}</span>
                     <h2 className="text-4xl md:text-8xl font-black text-white uppercase tracking-tighter leading-none italic">{activeProject.title}</h2>
                  </div>
               </div>

               <div className="w-full md:w-1/2 h-full p-8 md:p-20 overflow-y-auto custom-scrollbar relative">
                  <button 
                    onClick={() => { setSelectedId(null); setIsTerminalOpen(false); }}
                    className="absolute top-8 right-8 w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all z-20"
                  >
                    ✕
                  </button>

                  <div className="max-w-xl flex flex-col gap-12 pt-12 md:pt-0">
                     <section>
                        <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] mb-6">01 / OVERVIEW</h4>
                        <p className="text-lg md:text-xl text-zinc-200 font-medium leading-relaxed uppercase tracking-wide">
                          {activeProject.overview}
                        </p>
                     </section>

                     <section>
                        <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] mb-6">02 / TECHNOLOGIES</h4>
                        <div className="flex flex-wrap gap-3">
                           {activeProject.tech.map((t, i) => (
                             <span key={i} className="px-6 py-2 rounded-full border border-white/10 text-xs font-bold text-white uppercase tracking-widest bg-white/5">
                                {t}
                             </span>
                           ))}
                        </div>
                     </section>

                     <button 
                       onClick={startBootSequence}
                       className="w-full py-6 mt-4 border border-accent text-accent font-black uppercase tracking-[0.3em] hover:bg-accent hover:text-black transition-all duration-500 group"
                     >
                        View Live Project Node 
                        <span className="inline-block ml-4 group-hover:translate-x-2 transition-transform">→</span>
                     </button>
                  </div>

                  <AnimatePresence>
                    {isTerminalOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute inset-0 z-[80] p-8 md:p-20 bg-zinc-950 flex flex-col"
                      >
                         <div className="w-full h-full bg-black/50 border border-white/10 rounded-2xl shadow-3xl overflow-hidden font-mono flex flex-col">
                            <div className="bg-zinc-900 px-6 py-3 border-b border-white/5 flex justify-between items-center">
                               <div className="flex gap-2">
                                  <div className="w-2 h-2 rounded-full bg-red-500/40" />
                                  <div className="w-2 h-2 rounded-full bg-yellow-500/40" />
                                  <div className="w-2 h-2 rounded-full bg-accent/40" />
                               </div>
                               <span className="text-[8px] text-zinc-500 uppercase tracking-widest">{activeProject.title} Node v1.0.4</span>
                               <button onClick={() => setIsTerminalOpen(false)} className="text-zinc-500 hover:text-white transition-colors text-xs">✕</button>
                            </div>
                            
                            <div ref={terminalScrollRef} className="p-8 flex-1 overflow-y-auto custom-scrollbar text-[10px] md:text-xs leading-relaxed">
                               {terminalLogs.map((log, i) => (
                                  <div key={i} className={`mb-2 ${log.includes('ONLINE') || log.includes('GRANTED') ? 'text-accent font-black' : 'text-zinc-400'}`}>
                                     <span className="text-zinc-600 mr-2">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                                     {log}
                                  </div>
                               ))}
                               <div className="w-2 h-4 bg-accent/80 animate-pulse inline-block align-middle ml-1" />
                            </div>

                            <div className="px-8 py-4 bg-zinc-900 overflow-hidden border-t border-white/5 flex gap-8">
                               <div className="flex flex-col">
                                  <span className="text-[6px] text-zinc-600 uppercase">Process ID</span>
                                  <span className="text-[9px] text-zinc-400 font-bold">NODE_0X{activeProject.id}F4</span>
                               </div>
                               <div className="flex flex-col border-l border-white/10 pl-6">
                                  <span className="text-[6px] text-zinc-600 uppercase">Load</span>
                                  <span className="text-[9px] text-zinc-400 font-bold">1.4%</span>
                               </div>
                               <div className="ml-auto flex items-center">
                                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse mr-2" />
                                  <span className="text-[7px] text-accent font-black uppercase tracking-widest">LIVE_SIMULATION</span>
                               </div>
                            </div>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
