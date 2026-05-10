import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Menu } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [time, setTime] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Use useGSAP for menu animations
  useGSAP(() => {
    if (menuOpen) {
      // Menu background entry
      gsap.fromTo(menuRef.current,
        { x: '100%' },
        { x: '0%', duration: 0.8, ease: 'power4.out' }
      );
      
      // Header and Footer areas
      gsap.from('.menu-reveal', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
        delay: 0.4
      });

      // Links stagger
      gsap.from('.menu-link', {
        x: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.08,
        ease: 'power4.out',
        delay: 0.3
      });
    }
  }, { dependencies: [menuOpen] });

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
    }) + ' PKT';
  };

  const handleScrollTo = (id: string) => {
    setMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const navLinks = [
    { id: 'projects', label: 'Work' },
    { id: 'portals', label: 'Systems' },
    { id: 'courses', label: 'Academy' },
    { id: 'about', label: 'About' },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 px-6 md:px-8 py-5 md:py-6 pointer-events-none">
        <div className="mx-auto flex items-center justify-between pointer-events-auto">
          
          {/* Brand */}
          <div 
            onClick={() => { navigate('/'); window.scrollTo(0, 0); }}
            className="text-white text-sm font-bold uppercase tracking-[0.2em] cursor-pointer hover:text-accent transition-colors"
          >
            Navaish Khan
          </div>

          {/* Center: Real-time Location/Time (desktop only) */}
          <div className="hidden lg:flex items-center gap-4 text-[10px] font-mono uppercase tracking-[0.15em] text-zinc-400">
            <span>Pakistan</span>
            <span className="w-1 h-1 bg-zinc-600 rounded-full" />
            <span className="text-zinc-200">{formatTime(time)}</span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <button 
                key={link.id}
                onClick={() => handleScrollTo(link.id)}
                className="text-xs text-white hover:text-accent font-bold uppercase tracking-widest transition-colors"
              >
                {link.label}
              </button>
            ))}
            <button 
              onClick={() => navigate('/auth')}
              className="group relative px-5 py-2 overflow-hidden border border-white/10 rounded-sm bg-zinc-950/50 backdrop-blur-sm transition-all hover:border-accent"
            >
               <span className="relative z-10 text-[10px] text-white font-bold uppercase tracking-widest group-hover:text-black transition-colors">
                 Portal
               </span>
               <div className="absolute inset-0 bg-accent translate-y-[101%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            </button>
          </div>

          {/* Hamburger (mobile only) */}
          <button
            onClick={() => setMenuOpen(true)}
            className="md:hidden text-white p-2 rounded-sm border border-white/10 bg-zinc-950/50 backdrop-blur-sm hover:border-accent transition-all"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Mobile Full-Screen Menu */}
      {menuOpen && (
        <div 
          ref={menuRef}
          className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-3xl flex flex-col px-8 pt-8 pb-16 overflow-hidden"
        >
          {/* Close button */}
          <div className="flex items-center justify-between mb-20 menu-reveal">
            <span className="text-white text-sm font-bold uppercase tracking-[0.2em]">Navaish Khan</span>
            <button
              onClick={() => {
                gsap.to(menuRef.current, {
                  x: '100%',
                  duration: 0.6,
                  ease: 'power4.in',
                  onComplete: () => setMenuOpen(false)
                });
              }}
              className="text-white p-3 border border-white/10 rounded-full hover:border-accent transition-all bg-white/5 active:scale-95"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col gap-4 flex-1" ref={linksRef}>
            {navLinks.map((link, i) => (
              <button
                key={link.id}
                onClick={() => handleScrollTo(link.id)}
                className="menu-link group flex items-baseline gap-4 text-left text-[14vw] font-black uppercase tracking-tighter text-white hover:text-accent transition-colors leading-[0.9] py-1"
              >
                <span className="text-[10px] font-mono text-zinc-600 group-hover:text-accent transition-colors">0{i+1}</span>
                {link.label}
              </button>
            ))}
          </nav>

          {/* Bottom area */}
          <div className="flex flex-col gap-10 menu-reveal">
            <button
              onClick={() => { navigate('/auth'); setMenuOpen(false); }}
              className="group w-full py-6 bg-accent text-black font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              Portal <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
            <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em]">
               <div className="flex flex-col gap-1 text-left">
                  <span className="text-zinc-600">Location</span>
                  <span className="text-zinc-300 font-bold">Pakistan</span>
               </div>
               <div className="flex flex-col items-end gap-1 text-right">
                  <span className="text-zinc-600">Local Time</span>
                  <span className="text-zinc-300 font-bold">{formatTime(time)}</span>
               </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
