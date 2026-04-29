import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Check, Wrench } from 'lucide-react';

interface Props {
  selectedItems: any[];
  setSelectedItems: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function RepairManager({ selectedItems, setSelectedItems }: Props) {
  const [repairTypes, setRepairTypes] = useState<any[]>([]);
  const [repairs, setRepairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const typeRes = await fetch(`${import.meta.env.VITE_API_URL}/api/materials?category=repair`);
      setRepairTypes(await typeRes.json());
      
      const invRes = await fetch(`${import.meta.env.VITE_API_URL}/api/inventory`);
      const allInv = await invRes.json();
      setRepairs(allInv.filter((i: any) => i.material_category === 'repair'));
    } catch (err) {
      console.error('Failed to fetch repair data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteRepair = async (id: number) => {
    if (!confirm('Are you sure you want to remove this repair record?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/inventory/${id}`, { method: 'DELETE' });
      if ((await res.json()).success) fetchData();
    } catch (err) { alert('Delete failed'); }
  };

  const handleCreateType = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            name, 
            category: 'repair', 
            properties: { "Fault": "", "Technician": "", "Repair Cost": "" } 
        })
      });
      if ((await res.json()).success) {
        setIsTypeModalOpen(false);
        fetchData();
      } else {
        alert('Failed to add repair type');
      }
    } catch (err) { alert('Create failed'); }
  };

  const handleCreateRepair = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const material_name = formData.get('material_name') as string;
    const quantity = parseInt(formData.get('quantity') as string) || 1;
    const price = parseFloat(formData.get('price') as string) || 0;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ material_name, quantity, price, category: 'repair' })
      });
      if ((await res.json()).success) {
        setIsRepairModalOpen(false);
        fetchData();
      } else {
        alert('Failed to log repair item');
      }
    } catch (err) { alert('Create failed'); }
  };

  const parseProps = (props: any) => {
    if (!props) return {};
    if (typeof props === 'string') {
      try { return JSON.parse(props); } catch { return {}; }
    }
    return props;
  };

  const filtered = repairs.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (item.material_name || '').toLowerCase().includes(q) || String(item.id).includes(q);
  });

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      {/* Action Bar */}
      <div className="flex justify-between items-center mb-8">
         <div className="flex items-center gap-4">
            <div className="relative group w-80">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-red-400 transition-colors" size={16} />
               <input 
                 type="text" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Search repairs..." 
                 className="bg-zinc-900/60 border border-white/10 rounded-xl pl-12 pr-6 py-3 text-sm focus:outline-none focus:border-red-400/50 transition-all w-full placeholder:text-zinc-600"
               />
            </div>
            <span className="text-xs text-zinc-500 font-medium">{filtered.length} repairs</span>
         </div>
         <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsTypeModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-zinc-800 border border-white/10 text-white text-xs font-semibold hover:bg-zinc-700 transition-all"
            >
              + New Type
            </button>
            <button 
              onClick={() => setIsRepairModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all"
            >
              + Log Repair
            </button>
         </div>
      </div>

      {/* Data Table */}
      <div className="bg-zinc-900/30 border border-white/[0.06] rounded-2xl overflow-hidden flex-1 flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-900/60 sticky top-0 z-10 border-b border-white/[0.06]">
              <tr>
                <th className="pl-6 pr-2 py-4 w-12"></th>
                <th className="px-6 py-4 text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">Appliance</th>
                <th className="px-6 py-4 text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">Diagnosis</th>
                <th className="px-6 py-4 text-[11px] text-zinc-400 font-semibold uppercase tracking-wider text-right">Qty</th>
                <th className="px-6 py-4 text-[11px] text-zinc-400 font-semibold uppercase tracking-wider text-right">Cost</th>
                <th className="px-6 py-4 text-[11px] text-zinc-400 font-semibold uppercase tracking-wider text-right w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-red-400 border-t-transparent rounded-full mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <Wrench className="mx-auto text-zinc-700 mb-3" size={32} />
                    <p className="text-zinc-600 text-sm font-medium">No repair records found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const props = parseProps(item.properties);
                  const propEntries = Object.entries(props).filter(([, v]) => v);
                  const isSelected = selectedItems.find(si => si.id === item.id);
                  
                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="pl-6 pr-2 py-4">
                        <button 
                          onClick={() => {
                            if (isSelected) {
                               setSelectedItems(selectedItems.filter(si => si.id !== item.id));
                            } else {
                               setSelectedItems([...selectedItems, item]);
                            }
                          }}
                          className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${isSelected ? 'bg-red-500 border-red-500 text-white' : 'border-zinc-700 hover:border-zinc-500'}`}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col">
                            <span className="text-sm font-semibold text-white">{item.material_name}</span>
                            <span className="text-[11px] text-zinc-500 mt-0.5">Ticket: REP-{String(item.id).padStart(4, '0')}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-wrap gap-1.5">
                            {propEntries.length > 0 ? propEntries.map(([k, v]: any) => (
                               <span key={k} className="text-[10px] text-zinc-400 bg-zinc-800 border border-zinc-700/50 px-2 py-0.5 rounded-md">{k}: {v}</span>
                            )) : (
                               <span className="text-[11px] text-zinc-600 italic">Awaiting diagnosis</span>
                            )}
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <span className="text-sm font-semibold text-white tabular-nums">{item.quantity}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <span className="text-sm text-zinc-300 tabular-nums">PKR {Number(item.price).toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <button 
                           onClick={() => handleDeleteRepair(item.id)} 
                           className="w-8 h-8 rounded-lg bg-transparent border border-transparent flex items-center justify-center text-zinc-600 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:border-red-400/30 hover:bg-red-400/10 transition-all"
                         >
                            <Trash2 size={14} />
                         </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Type Modal */}
      {isTypeModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-8">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsTypeModalOpen(false)} />
           <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
              <h2 className="text-xl font-bold mb-6">New Appliance Type</h2>
              <form onSubmit={handleCreateType} className="space-y-4">
                 <input name="name" placeholder="e.g. Inverter, UPS, Motor" required className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-sm focus:border-red-400 transition-all outline-none" />
                 <button type="submit" className="w-full bg-red-500 text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-[0.98] transition-all text-sm">Add Type</button>
              </form>
           </div>
        </div>
      )}

      {/* Log Repair Modal */}
      {isRepairModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-8">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsRepairModalOpen(false)} />
           <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
              <h2 className="text-xl font-bold mb-6">Log Repair Ticket</h2>
              <form onSubmit={handleCreateRepair} className="space-y-4">
                 <select name="material_name" required className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-sm focus:border-red-400 transition-all text-white outline-none">
                    <option value="">Select Appliance Type...</option>
                    {repairTypes.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                 </select>
                 <div className="grid grid-cols-2 gap-3">
                    <input name="quantity" type="number" defaultValue={1} placeholder="Qty" required className="bg-black/50 border border-white/10 rounded-xl p-3.5 text-sm outline-none focus:border-red-400 transition-all" />
                    <input name="price" type="number" step="0.01" placeholder="Cost (PKR)" required className="bg-black/50 border border-white/10 rounded-xl p-3.5 text-sm outline-none focus:border-red-400 transition-all" />
                 </div>
                 <button type="submit" className="w-full bg-red-500 text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-[0.98] transition-all text-sm">Submit Ticket</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
