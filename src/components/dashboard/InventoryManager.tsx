import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Check, Package } from 'lucide-react';

interface Props {
  selectedItems: any[];
  setSelectedItems: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function InventoryManager({ selectedItems, setSelectedItems }: Props) {
  const [materials, setMaterials] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const matsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/materials?category=inventory`);
      setMaterials(await matsRes.json());
      
      const invRes = await fetch(`${import.meta.env.VITE_API_URL}/api/inventory`);
      const allInv = await invRes.json();
      setInventory(allInv.filter((i: any) => i.material_category === 'inventory'));
    } catch (err) {
      console.error('Failed to fetch inventory data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Are you sure you want to delete this inventory item?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/inventory/${id}`, { method: 'DELETE' });
      if ((await res.json()).success) fetchData();
    } catch (err) { alert('Delete failed'); }
  };

  const handleCreateMaterial = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category: 'inventory', properties: {} })
      });
      if ((await res.json()).success) {
        setIsMaterialModalOpen(false);
        fetchData();
      } else {
        alert('Failed to add material type');
      }
    } catch (err) { alert('Create failed'); }
  };

  const handleCreateItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const material_name = formData.get('material_name') as string;
    const quantity = parseInt(formData.get('quantity') as string) || 0;
    const price = parseFloat(formData.get('price') as string) || 0;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ material_name, quantity, price, category: 'inventory' })
      });
      if ((await res.json()).success) {
        setIsItemModalOpen(false);
        fetchData();
      } else {
        alert('Failed to add inventory item');
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

  const filtered = inventory.filter((item) => {
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
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-accent transition-colors" size={16} />
               <input 
                 type="text" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Search by name or ID..." 
                 className="bg-zinc-900/60 border border-white/10 rounded-xl pl-12 pr-6 py-3 text-sm focus:outline-none focus:border-accent/50 transition-all w-full placeholder:text-zinc-600"
               />
            </div>
            <span className="text-xs text-zinc-500 font-medium">{filtered.length} items</span>
         </div>
         <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMaterialModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-zinc-800 border border-white/10 text-white text-xs font-semibold hover:bg-zinc-700 transition-all"
            >
              + New Category
            </button>
            <button 
              onClick={() => setIsItemModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-accent text-black text-xs font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all"
            >
              + Add Stock Item
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
                <th className="px-6 py-4 text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">Item Name</th>
                <th className="px-6 py-4 text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">Properties</th>
                <th className="px-6 py-4 text-[11px] text-zinc-400 font-semibold uppercase tracking-wider text-right">Qty</th>
                <th className="px-6 py-4 text-[11px] text-zinc-400 font-semibold uppercase tracking-wider text-right">Price / Unit</th>
                <th className="px-6 py-4 text-[11px] text-zinc-400 font-semibold uppercase tracking-wider text-right w-20">Actions</th>
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
                    <Package className="mx-auto text-zinc-700 mb-3" size={32} />
                    <p className="text-zinc-600 text-sm font-medium">No inventory items found</p>
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
                          className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${isSelected ? 'bg-accent border-accent text-black' : 'border-zinc-700 hover:border-zinc-500'}`}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col">
                            <span className="text-sm font-semibold text-white">{item.material_name}</span>
                            <span className="text-[11px] text-zinc-500 mt-0.5">ID: MK-{String(item.id).padStart(4, '0')}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-wrap gap-1.5">
                            {propEntries.length > 0 ? propEntries.map(([k, v]: any) => (
                               <span key={k} className="text-[10px] text-zinc-400 bg-zinc-800 border border-zinc-700/50 px-2 py-0.5 rounded-md">{k}: {v}</span>
                            )) : (
                               <span className="text-[11px] text-zinc-600 italic">—</span>
                            )}
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <span className={`text-sm font-semibold tabular-nums ${item.quantity < 5 ? 'text-red-400' : 'text-white'}`}>{item.quantity}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <span className="text-sm text-zinc-300 tabular-nums">PKR {Number(item.price).toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <button 
                           onClick={() => handleDeleteItem(item.id)} 
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

      {/* Add Category Modal */}
      {isMaterialModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-8">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMaterialModalOpen(false)} />
           <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
              <h2 className="text-xl font-bold mb-6">New Category</h2>
              <form onSubmit={handleCreateMaterial} className="space-y-4">
                 <input name="name" placeholder="Category Name (e.g. Solar Plate)" required className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-sm focus:border-accent transition-all outline-none" />
                 <button type="submit" className="w-full bg-accent text-black font-bold py-3.5 rounded-xl shadow-lg active:scale-[0.98] transition-all text-sm">Create Category</button>
              </form>
           </div>
        </div>
      )}

      {/* Add Stock Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-8">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsItemModalOpen(false)} />
           <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
              <h2 className="text-xl font-bold mb-6">Add Stock Item</h2>
              <form onSubmit={handleCreateItem} className="space-y-4">
                 <select name="material_name" required className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-sm focus:border-accent transition-all text-white outline-none">
                    <option value="">Select Category...</option>
                    {materials.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                 </select>
                 <div className="grid grid-cols-2 gap-3">
                    <input name="quantity" type="number" placeholder="Stock Qty" required className="bg-black/50 border border-white/10 rounded-xl p-3.5 text-sm outline-none focus:border-accent transition-all" />
                    <input name="price" type="number" step="0.01" placeholder="Unit Price (PKR)" required className="bg-black/50 border border-white/10 rounded-xl p-3.5 text-sm outline-none focus:border-accent transition-all" />
                 </div>
                 <button type="submit" className="w-full bg-accent text-black font-bold py-3.5 rounded-xl shadow-lg active:scale-[0.98] transition-all text-sm">Add to Inventory</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
