import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, FileText, Download, Users, Phone, MapPin } from 'lucide-react';

export default function CustomerCRM() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerFiles, setCustomerFiles] = useState<string[]>([]);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/customers`);
      setCustomers(await res.json());
    } catch (err) {
      console.error('Failed to fetch customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (serial: string) => {
    if (!confirm('WARNING: Removing this customer will also delete all associated history. Continue?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/customers/${serial}`, { method: 'DELETE' });
      if ((await res.json()).success) fetchData();
    } catch (err) { alert('Delete failed'); }
  };

  const loadCustomerFiles = async (serial: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/customers/${serial}/files`);
      setCustomerFiles(await res.json());
      setIsFileModalOpen(true);
    } catch (err) {
      console.error('Failed to load files', err);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const body: any = {};
    formData.forEach((value, key) => { body[key] = value });
    
    if (!body.serial_number) {
       body.serial_number = `CUST-${(body.name || 'X').substring(0,3).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if ((await res.json()).success) {
        setIsModalOpen(false);
        fetchData();
      } else {
        alert('Failed to register customer');
      }
    } catch (err) { alert('Create failed'); }
  };

  const filtered = customers.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (c.name || '').toLowerCase().includes(q) 
      || (c.serial_number || '').toLowerCase().includes(q)
      || (c.phone || '').includes(q)
      || (c.location || '').toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      {/* Action Bar */}
      <div className="flex justify-between items-center mb-8">
         <div className="flex items-center gap-4">
            <div className="relative group w-80">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-accent transition-colors" size={16} />
               <input 
                 type="text" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Search by name, serial, phone..." 
                 className="bg-zinc-900/60 border border-white/10 rounded-xl pl-12 pr-6 py-3 text-sm focus:outline-none focus:border-accent/50 transition-all w-full placeholder:text-zinc-600"
               />
            </div>
            <span className="text-xs text-zinc-500 font-medium">{filtered.length} customers</span>
         </div>
         <button 
           onClick={() => setIsModalOpen(true)}
           className="px-5 py-2.5 rounded-xl bg-accent text-black text-xs font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all"
         >
           + Register Client
         </button>
      </div>

      {/* Data Table */}
      <div className="bg-zinc-900/30 border border-white/[0.06] rounded-2xl overflow-hidden flex-1 flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-900/60 sticky top-0 z-10 border-b border-white/[0.06]">
              <tr>
                <th className="px-6 py-4 text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">Serial</th>
                <th className="px-6 py-4 text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">Reference</th>
                <th className="px-6 py-4 text-[11px] text-zinc-400 font-semibold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <Users className="mx-auto text-zinc-700 mb-3" size={32} />
                    <p className="text-zinc-600 text-sm font-medium">No customers found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                       <span className="text-[11px] font-mono text-accent/70">{item.serial_number}</span>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-sm font-semibold text-white">{item.name}</span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <Phone size={12} className="text-zinc-600" />
                          <span className="text-sm text-zinc-300 tabular-nums">{item.phone || '—'}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <MapPin size={12} className="text-zinc-600" />
                          <span className="text-sm text-zinc-400">{item.location || '—'}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-sm text-zinc-500">{item.reference || '—'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                          <button 
                            onClick={() => { navigator.clipboard.writeText(item.serial_number); }}
                            className="px-3 py-1.5 rounded-lg text-[10px] font-semibold text-zinc-400 bg-zinc-800 hover:text-accent hover:bg-zinc-700 transition-all"
                          >
                            Copy ID
                          </button>
                          <button 
                            onClick={() => { setSelectedCustomer(item); loadCustomerFiles(item.serial_number); }} 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
                          >
                             <FileText size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.serial_number)} 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
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

      {/* Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-8">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
           <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
              <h2 className="text-xl font-bold mb-6">Register Client</h2>
              <form onSubmit={handleCreateCustomer} className="space-y-4">
                 <input name="name" placeholder="Full Name" required className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-sm focus:border-accent transition-all outline-none" />
                 <div className="grid grid-cols-2 gap-3">
                    <input name="phone" placeholder="Phone" className="bg-black/50 border border-white/10 rounded-xl p-3.5 text-sm outline-none focus:border-accent transition-all" />
                    <input name="location" placeholder="City / Area" className="bg-black/50 border border-white/10 rounded-xl p-3.5 text-sm outline-none focus:border-accent transition-all" />
                 </div>
                 <input name="address" placeholder="Full Address" className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-sm outline-none focus:border-accent transition-all" />
                 <input name="reference" placeholder="Reference (optional)" className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-sm outline-none focus:border-accent transition-all" />
                 <button type="submit" className="w-full bg-accent text-black font-bold py-3.5 rounded-xl shadow-lg active:scale-[0.98] transition-all text-sm">Register</button>
              </form>
           </div>
        </div>
      )}

      {/* File Vault Modal */}
      {isFileModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-8">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsFileModalOpen(false)} />
           <div className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
              <div className="flex justify-between items-start mb-6">
                 <div>
                    <h2 className="text-xl font-bold">{selectedCustomer.name}'s Files</h2>
                    <p className="text-xs text-zinc-500 mt-1">{selectedCustomer.serial_number} · {customerFiles.length} documents</p>
                 </div>
              </div>

              <div className="space-y-2 max-h-[50vh] overflow-auto">
                 {customerFiles.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
                       <FileText className="mx-auto text-zinc-700 mb-3" size={28} />
                       <p className="text-zinc-600 text-sm">No documents yet</p>
                    </div>
                 ) : (
                    customerFiles.map((file, i) => (
                       <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-black/30 border border-white/5 hover:border-accent/30 transition-colors">
                          <div className="flex items-center gap-3">
                             <FileText size={16} className="text-zinc-500" />
                             <span className="text-sm text-zinc-300 font-mono">{file}</span>
                          </div>
                          <a 
                            href={`${import.meta.env.VITE_API_URL}/api/files/${selectedCustomer.serial_number}/${file}`} 
                            target="_blank"
                            className="flex items-center gap-1.5 text-[10px] font-semibold text-accent hover:underline"
                          >
                             <Download size={12} /> Download
                          </a>
                       </div>
                    ))
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
