import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'America/New_York'
    }) + ' EST';
  };

  const handleScrollTo = (id: string) => {
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

  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-8 py-6 pointer-events-none">
      <div className="mx-auto flex items-center justify-between pointer-events-auto">
        
        {/* Brand */}
        <div 
          onClick={() => { navigate('/'); window.scrollTo(0, 0); }}
          className="text-white text-sm font-bold uppercase tracking-[0.2em] cursor-pointer hover:text-accent transition-colors"
        >
          Navaish Khan
        </div>

        {/* Center: Real-time Location/Time */}
        <div className="hidden lg:flex items-center gap-4 text-[10px] font-mono uppercase tracking-[0.15em] text-zinc-400">
          <span>Charlotte, NC</span>
          <span className="w-1 h-1 bg-zinc-600 rounded-full" />
          <span className="text-zinc-200">{formatTime(time)}</span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-8">
          <button 
            onClick={() => handleScrollTo('projects')}
            className="text-xs text-white hover:text-accent font-bold uppercase tracking-widest transition-colors"
          >
            Work
          </button>
          <button 
            onClick={() => handleScrollTo('portals')}
            className="text-xs text-white hover:text-accent font-bold uppercase tracking-widest transition-colors"
          >
            Systems
          </button>
          <button 
            onClick={() => handleScrollTo('about')}
            className="text-xs text-white hover:text-accent font-bold uppercase tracking-widest transition-colors"
          >
            About
          </button>
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

      </div>
    </nav>
  );
}
