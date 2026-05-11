import { useState } from 'react';
import LicenseManager from '../components/dashboard/LicenseManager';
import { ShieldCheck, Lock, LogIn } from 'lucide-react';

export default function LicensePortal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const MASTER_USER = 'admin-mkt-master';
  const MASTER_PASS = 'MKT-SECURE-99';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (userId === MASTER_USER && password === MASTER_PASS) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Invalid master credentials. Access denied.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-6">
        <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
          
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/20 text-accent flex items-center justify-center mb-6">
              <ShieldCheck size={32} />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter italic">Licensing Core</h1>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em] mt-2">Secure Administrative Node</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Master User ID</label>
              <div className="relative">
                <LogIn className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                <input 
                  type="text" 
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter User ID..." 
                  className="w-full bg-black border border-white/5 rounded-2xl p-4 pl-12 text-sm focus:border-accent transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Master Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-black border border-white/5 rounded-2xl p-4 pl-12 text-sm focus:border-accent transition-all outline-none"
                />
              </div>
            </div>

            {error && <p className="text-[10px] font-bold text-red-500 text-center uppercase tracking-widest">{error}</p>}

            <button 
              type="submit"
              className="w-full bg-white text-black font-black uppercase tracking-[0.2em] py-5 rounded-2xl hover:bg-accent transition-all shadow-xl active:scale-95 text-xs"
            >
              Initialize Command Link
            </button>
          </form>
          
          <div className="mt-10 pt-6 border-t border-white/5 text-center">
            <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
              Restricted Area // Authorization Required
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-12">
      <header className="max-w-6xl mx-auto mb-16 flex justify-between items-end">
        <div>
           <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 rounded-full bg-accent animate-ping" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent italic">Licensing Core Active</span>
           </div>
           <h1 className="text-6xl font-black uppercase tracking-tighter italic leading-none">Management Hub</h1>
        </div>
        <button 
          onClick={() => setIsAuthenticated(false)}
          className="px-6 py-3 rounded-xl bg-zinc-900 border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-all border-red-500/0 hover:border-red-500/20"
        >
          Deauthorize Session
        </button>
      </header>

      <main className="max-w-6xl mx-auto">
        <LicenseManager />
      </main>
    </div>
  );
}
