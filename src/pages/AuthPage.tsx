import { useState, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Entrance animation for the auth card
  useGSAP(() => {
    gsap.from('.auth-card', {
      y: 50,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      delay: 0.2
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="relative w-full min-h-screen flex items-center justify-center pt-24 pb-12 px-4">
      {/* Decorative blurred background elements specific to Auth */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-zinc-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Auth Card */}
      <div className="auth-card relative z-10 w-full max-w-md bg-zinc-900/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden">
        
        <div className="flex flex-col mb-8">
           <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Portal Login</h1>
           <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Accessing Professional System Node</p>
        </div>

        {/* Toggle Switch */}
        <div className="flex bg-black/40 rounded-full p-1 mb-8 relative">
          <div 
            className="absolute top-1 left-1 h-[calc(100%-8px)] w-[calc(50%-4px)] bg-accent rounded-full transition-transform duration-500 ease-out"
            style={{ transform: isLogin ? 'translateX(0)' : 'translateX(100%)' }}
          />
          <button 
            className={`w-1/2 py-2 text-sm font-semibold uppercase tracking-widest z-10 transition-colors duration-300 ${isLogin ? 'text-black' : 'text-zinc-400 hover:text-white'}`}
            onClick={() => setIsLogin(true)}
          >
            Log In
          </button>
          <button 
            className={`w-1/2 py-2 text-sm font-semibold uppercase tracking-widest z-10 transition-colors duration-300 ${!isLogin ? 'text-black' : 'text-zinc-400 hover:text-white'}`}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
        </div>

        {/* Form Container (Crossfade) */}
        <div className="relative">
          
          {/* Login Form */}
          <form className={`flex flex-col gap-5 transition-all duration-500 absolute w-full ${isLogin ? 'opacity-100 translate-y-0 pointer-events-auto relative' : 'opacity-0 -translate-y-4 pointer-events-none'}`}
            onSubmit={async (e) => {
              e.preventDefault();
              const email = e.currentTarget.email.value;
              const password = e.currentTarget.password.value;
              try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/login`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (data.success) {
                  localStorage.setItem('mkt_user', JSON.stringify(data.user));
                  window.location.href = '/portal/mkt';
                } else {
                  alert(data.message || 'Login failed');
                }
              } catch (err) {
                console.error(err);
                alert('Connection error. Is the MKT backend running?');
              }
            }}
          >
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-2 uppercase tracking-wider">Email Address</label>
              <input name="email" type="email" placeholder="admin@mkt.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-2 uppercase tracking-wider">Password</label>
              <input name="password" type="password" placeholder="admin123" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors" />
            </div>
            <button type="button" className="text-xs text-zinc-400 hover:text-white text-right font-light transition-colors">Forgot Password?</button>
            <button type="submit" className="w-full mt-4 bg-white text-black font-bold uppercase tracking-widest py-4 rounded-xl hover:bg-accent hover:text-black transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]">
              Enter System
            </button>
          </form>

          {/* Sign Up Form */}
          <form className={`flex flex-col gap-5 transition-all duration-500 absolute top-0 w-full ${!isLogin ? 'opacity-100 translate-y-0 pointer-events-auto relative' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
             <div className="flex gap-4">
               <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-2 uppercase tracking-wider">First Name</label>
                  <input type="text" placeholder="John" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors" />
               </div>
               <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-2 uppercase tracking-wider">Last Name</label>
                  <input type="text" placeholder="Doe" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors" />
               </div>
             </div>
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-2 uppercase tracking-wider">Email Address</label>
              <input type="email" placeholder="john@company.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-2 uppercase tracking-wider">Password</label>
              <input type="password" placeholder="••••••••" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors" />
            </div>
            <button type="button" className="w-full mt-4 bg-white text-black font-bold uppercase tracking-widest py-4 rounded-xl hover:bg-accent hover:text-black transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]">
              Create Account
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
