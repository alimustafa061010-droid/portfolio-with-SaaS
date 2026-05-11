import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Key, ShieldCheck, Copy, RefreshCw } from 'lucide-react';

export default function LicenseManager() {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copying, setCopying] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/licenses`);
      const data = await res.json();
      setLicenses(data);
    } catch (err) {
      console.error('Failed to fetch licenses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateLicense = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/licenses/create`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert('Failed to generate license: ' + data.message);
      }
    } catch (err) { alert('Operation failed'); }
  };

  const handleDeleteLicense = async (serial: string) => {
    if (!confirm(`Are you sure you want to revoke/delete serial ${serial}?`)) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/licenses/delete?serial=${encodeURIComponent(serial)}`, { method: 'DELETE' });
      if ((await res.json()).success) {
        fetchData();
      }
    } catch (err) { alert('Delete failed'); }
  };

  const handleCopy = (serial: string) => {
    navigator.clipboard.writeText(serial);
    setCopying(serial);
    setTimeout(() => setCopying(null), 2000);
  };

  const filtered = licenses.filter((lic) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (lic.serial || '').toLowerCase().includes(q) || (lic.machine_id || '').toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Action Bar */}
      <div className="flex justify-between items-center mb-8">
         <div className="flex items-center gap-4">
            <div className="relative group w-80">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-accent transition-colors" size={16} />
               <input 
                 type="text" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Search by serial or machine ID..." 
                 className="bg-zinc-900/60 border border-white/10 rounded-xl pl-12 pr-6 py-3 text-sm focus:outline-none focus:border-accent/50 transition-all w-full placeholder:text-zinc-600"
               />
            </div>
            <span className="text-xs text-zinc-500 font-medium">{filtered.length} keys total</span>
         </div>
         <div className="flex items-center gap-3">
            <button 
              onClick={fetchData}
              className="p-2.5 rounded-xl bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white transition-all"
              title="Refresh Data"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={handleCreateLicense}
              className="px-6 py-2.5 rounded-xl bg-accent text-black text-xs font-bold shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus size={16} /> Generate Lifetime Key
            </button>
         </div>
      </div>

      {/* License Table */}
      <div className="bg-zinc-900/30 border border-white/[0.06] rounded-[2rem] overflow-hidden flex-1 flex flex-col backdrop-blur-3xl">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-900/60 sticky top-0 z-10 border-b border-white/[0.06]">
              <tr>
                <th className="px-8 py-5 text-[11px] text-zinc-400 font-black uppercase tracking-[0.2em]">Serial Number</th>
                <th className="px-8 py-5 text-[11px] text-zinc-400 font-black uppercase tracking-[0.2em]">Machine Bind</th>
                <th className="px-8 py-5 text-[11px] text-zinc-400 font-black uppercase tracking-[0.2em]">Type</th>
                <th className="px-8 py-5 text-[11px] text-zinc-400 font-black uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-5 text-[11px] text-zinc-400 font-black uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading && licenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-32 text-center">
                    <div className="animate-spin w-10 h-10 border-2 border-accent border-t-transparent rounded-full mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-32 text-center">
                    <ShieldCheck className="mx-auto text-zinc-700 mb-4" size={40} />
                    <p className="text-zinc-500 text-sm font-medium">No license records found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((lic) => (
                  <tr key={lic.serial} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${lic.status === 'active' ? 'bg-accent/10 text-accent' : 'bg-zinc-800 text-zinc-500'}`}>
                             <Key size={14} />
                          </div>
                          <div className="flex flex-col">
                             <span className="text-sm font-black font-mono tracking-wider text-white uppercase">{lic.serial}</span>
                             <span className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest font-bold">Created: {lic.activation_date ? new Date(lic.activation_date).toLocaleDateString() : 'Pending'}</span>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex flex-col">
                          <span className="text-xs font-mono text-zinc-300">{lic.machine_id ? lic.machine_id : '—'}</span>
                          <span className="text-[10px] text-zinc-600 uppercase tracking-tighter mt-1">{lic.machine_id ? 'Unique Hardware ID' : 'Available for Activation'}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className="text-[10px] bg-zinc-800 border border-zinc-700/50 px-2.5 py-1 rounded-full text-zinc-400 font-bold uppercase tracking-widest">{lic.license_type}</span>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${lic.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'}`} />
                          <span className={`text-[10px] font-black uppercase tracking-widest ${lic.status === 'active' ? 'text-green-500' : 'text-zinc-500'}`}>
                             {lic.status}
                          </span>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleCopy(lic.serial)}
                            className="p-2 rounded-lg bg-zinc-800/50 border border-white/5 text-zinc-400 hover:text-accent hover:border-accent/30 transition-all relative"
                          >
                             {copying === lic.serial ? <ShieldCheck size={14} className="text-accent" /> : <Copy size={14} />}
                             {copying === lic.serial && (
                               <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-accent text-black text-[9px] px-2 py-0.5 rounded font-bold whitespace-nowrap">COPIED</span>
                             )}
                          </button>
                          <button 
                            onClick={() => handleDeleteLicense(lic.serial)} 
                            className="p-2 rounded-lg bg-zinc-800/50 border border-white/5 text-zinc-400 hover:text-red-500 hover:border-red-500/30 transition-all"
                          >
                             <Trash2 size={14} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Card */}
      <div className="mt-8 p-6 rounded-3xl bg-accent/5 border border-accent/10 flex items-start gap-4">
         <div className="p-3 rounded-2xl bg-accent/20 text-accent">
            <ShieldCheck size={20} />
         </div>
         <div className="flex-1">
            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1 italic">Security Protocol Alpha</h4>
            <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">License keys are cryptographically unique and bound to the client's machine identifier upon first activation. Revoking a key will immediately terminate access for that specific node in the next synchronization cycle.</p>
         </div>
      </div>
    </div>
  );
}
