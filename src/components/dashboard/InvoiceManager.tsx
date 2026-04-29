import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, FileText, Users, ShoppingCart, Receipt, Download, Database } from 'lucide-react';

export default function InvoiceManager() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [repairs, setRepairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // View state
  const [viewMode, setViewMode] = useState<'builder' | 'history'>('builder');
  const [historyFiles, setHistoryFiles] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Invoice builder state
  const [billType, setBillType] = useState<'invoice' | 'quotation' | 'repair'>('invoice');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [miscItems, setMiscItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [generating, setGenerating] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'bill' | 'quotation' | 'repair'>('all');

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (viewMode === 'history') fetchHistory();
  }, [viewMode]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/files/all`);
      setHistoryFiles(await res.json());
    } catch (err) { console.error(err); }
    finally { setHistoryLoading(false); }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [custRes, invRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/customers`),
        fetch(`${import.meta.env.VITE_API_URL}/api/inventory`),
      ]);
      const custs = await custRes.json();
      const allInv = await invRes.json();
      setCustomers(custs);
      setInventory(allInv.filter((i: any) => i.material_category === 'inventory'));
      setRepairs(allInv.filter((i: any) => i.material_category === 'repair'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const availableItems = billType === 'repair' ? repairs : inventory;

  const filteredItems = availableItems.filter((item) => {
    if (!searchQuery) return true;
    return (item.material_name || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  const addToCart = (item: any) => {
    if (cartItems.find(c => c.id === item.id)) return;
    setCartItems([...cartItems, { ...item, selectedQty: 1 }]);
  };

  const removeFromCart = (id: number) => {
    setCartItems(cartItems.filter(c => c.id !== id));
  };

  const updateCartQty = (id: number, qty: number) => {
    setCartItems(cartItems.map(c => c.id === id ? { ...c, selectedQty: qty } : c));
  };

  const addMiscItem = () => {
    setMiscItems([...miscItems, { id: Date.now(), description: '', price: 0, quantity: 1 }]);
  };

  const updateMiscItem = (id: number, field: string, value: any) => {
    setMiscItems(miscItems.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const removeMiscItem = (id: number) => {
    setMiscItems(miscItems.filter(m => m.id !== id));
  };

  const cartTotal = cartItems.reduce((sum, i) => sum + (i.price * (i.selectedQty || 1)), 0);
  const miscTotal = miscItems.reduce((sum, i) => sum + (i.price * (i.quantity || 1)), 0);
  const grandTotal = cartTotal + miscTotal;

  const handleGenerate = async () => {
    const serial = selectedCustomer || (document.getElementById('manual-serial') as HTMLInputElement)?.value;
    if (!serial) { alert('Please select or enter a customer serial number.'); return; }
    if (cartItems.length === 0 && miscItems.length === 0) { alert('Add at least one item.'); return; }

    setGenerating(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/generate-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_serial: serial,
          items: cartItems.map(i => ({
            id: i.id,
            material: i.material_name,
            quantity: i.selectedQty || 1,
            price: i.price,
            total: (i.selectedQty || 1) * i.price
          })),
          misc_items: miscItems.map(i => ({
            description: i.description,
            price: i.price,
            quantity: i.quantity || 1,
            total: (i.quantity || 1) * i.price
          })),
          type: billType
        })
      });
      const result = await res.json();
      if (result.success) {
        alert('Document generated successfully!\n\nSaved to: ' + result.pdf_path);
        setCartItems([]);
        setMiscItems([]);
        setSelectedCustomer('');
        fetchHistory();
      } else {
        alert('Generation failed: ' + result.message);
      }
    } catch (err) {
      alert('Failed to connect to the server.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      {/* Mode & Type Selector */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-center justify-between">
           <div className="flex bg-zinc-900/60 p-1.5 rounded-2xl border border-white/[0.05]">
              <button 
                onClick={() => setViewMode('builder')}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'builder' ? 'bg-white text-black shadow-xl' : 'text-zinc-500 hover:text-white'}`}
              >
                New Document
              </button>
              <button 
                onClick={() => setViewMode('history')}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'history' ? 'bg-white text-black shadow-xl' : 'text-zinc-500 hover:text-white'}`}
              >
                History Vault
              </button>
           </div>
           
           {viewMode === 'builder' && (
             <div className="flex items-center gap-3">
                {(['invoice', 'quotation', 'repair'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => { setBillType(type); setCartItems([]); }}
                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      billType === type 
                        ? type === 'repair' ? 'bg-red-500 text-white shadow-lg' : 'bg-accent text-black shadow-lg'
                        : 'bg-zinc-800/40 text-zinc-500 hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
             </div>
           )}
        </div>
      </div>

      {viewMode === 'builder' ? (
        <div className="flex gap-6 flex-1 min-h-0">
          
          {/* Left: Item Selection Panel */}
          <div className="flex-1 flex flex-col bg-zinc-900/30 border border-white/[0.06] rounded-2xl overflow-hidden">
            {/* Search */}
            <div className="p-4 border-b border-white/[0.06]">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${billType === 'repair' ? 'repairs' : 'inventory'}...`}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-accent/50 transition-all placeholder:text-zinc-600"
                />
              </div>
            </div>

            {/* Item List */}
            <div className="flex-1 overflow-auto">
              {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-600">
                  <ShoppingCart size={28} className="mb-2" />
                  <p className="text-sm">No items found</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {filteredItems.map((item) => {
                    const inCart = cartItems.find(c => c.id === item.id);
                    return (
                      <div 
                        key={item.id} 
                        className={`flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors cursor-pointer ${inCart ? 'bg-accent/5' : ''}`}
                        onClick={() => !inCart && addToCart(item)}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white">{item.material_name}</span>
                          <span className="text-[11px] text-zinc-500">
                            Stock: {item.quantity} · PKR {Number(item.price).toLocaleString()} / unit
                          </span>
                        </div>
                        {inCart ? (
                          <span className="text-[10px] font-semibold text-accent bg-accent/10 px-2.5 py-1 rounded-md">Added</span>
                        ) : (
                          <Plus size={16} className="text-zinc-600 hover:text-accent transition-colors" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) }
            </div>
          </div>

          {/* Right: Cart & Generation Panel */}
          <div className="w-[380px] flex flex-col bg-zinc-900/30 border border-white/[0.06] rounded-2xl overflow-hidden">
            
            {/* Customer Selection */}
            <div className="p-4 border-b border-white/[0.06] space-y-3">
              <label className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider block">Customer</label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-accent/50 transition-all"
              >
                <option value="">Select customer...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.serial_number}>{c.name} ({c.serial_number})</option>
                ))}
              </select>
              {!selectedCustomer && (
                <input 
                  id="manual-serial"
                  type="text" 
                  placeholder="Or enter serial manually..." 
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-accent/50 transition-all font-mono placeholder:text-zinc-600"
                />
              )}
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-auto p-4 space-y-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">
                  Cart ({cartItems.length + miscItems.length} items)
                </span>
              </div>

              {cartItems.length === 0 && miscItems.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
                  <Receipt size={24} className="mb-2" />
                  <p className="text-xs">Click items on the left to add</p>
                </div>
              )}

              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-black/30 border border-white/[0.05] rounded-xl group">
                  <div className="flex flex-col flex-1 min-w-0 mr-3">
                    <span className="text-sm font-medium text-white truncate">{item.material_name}</span>
                    <span className="text-[11px] text-zinc-500">
                      PKR {Number(item.price).toLocaleString()} × {item.selectedQty || 1} = PKR {((item.selectedQty || 1) * item.price).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number"
                      min={1}
                      value={item.selectedQty || 1}
                      onChange={(e) => updateCartQty(item.id, parseInt(e.target.value) || 1)}
                      className="w-14 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-center text-xs outline-none focus:border-accent/50"
                    />
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Misc Items */}
              {miscItems.map((item) => (
                <div key={item.id} className="p-3 bg-black/30 border border-dashed border-white/10 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500 font-semibold uppercase">Misc Item</span>
                    <button onClick={() => removeMiscItem(item.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <input 
                    type="text"
                    placeholder="Description (e.g. Labor charge)"
                    value={item.description}
                    onChange={(e) => updateMiscItem(item.id, 'description', e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700/50 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-accent/50"
                  />
                  <div className="flex gap-2">
                    <input 
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateMiscItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-16 bg-zinc-800 border border-zinc-700/50 rounded-lg px-2 py-1.5 text-xs text-center outline-none focus:border-accent/50"
                    />
                    <input 
                      type="number"
                      placeholder="Price"
                      value={item.price || ''}
                      onChange={(e) => updateMiscItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                      className="flex-1 bg-zinc-800 border border-zinc-700/50 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-accent/50"
                    />
                  </div>
                </div>
              ))}

              <button
                onClick={addMiscItem}
                className="w-full py-2.5 border border-dashed border-zinc-700 rounded-xl text-xs text-zinc-500 hover:text-accent hover:border-accent/40 transition-all"
              >
                + Add Misc Item
              </button>
            </div>

            {/* Total & Generate */}
            <div className="p-4 border-t border-white/[0.06] space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-400 font-semibold uppercase">Grand Total</span>
                <span className="text-xl font-bold text-accent tabular-nums">PKR {grandTotal.toLocaleString()}</span>
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating || (cartItems.length === 0 && miscItems.length === 0)}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${
                  billType === 'repair' 
                    ? 'bg-red-500 text-white shadow-lg hover:brightness-110'
                    : 'bg-accent text-black shadow-lg hover:brightness-110'
                }`}
              >
                {generating ? 'Generating...' : `Generate ${billType.charAt(0).toUpperCase() + billType.slice(1)} PDF`}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto bg-zinc-900/30 border border-white/[0.06] rounded-[2rem] p-10 backdrop-blur-3xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
           <div className="relative z-10 flex flex-col h-full">
              <div className="flex flex-col gap-8 mb-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-4xl font-black uppercase tracking-tighter italic flex items-center gap-4">
                    <Receipt className="text-accent" size={32} /> Document Vault
                  </h3>
                  <div className="relative w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input 
                      type="text"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder="Search vault (serial or name)..."
                      className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-accent/50 transition-all font-mono placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                   {(['all', 'bill', 'quotation', 'repair'] as const).map(f => (
                     <button
                       key={f}
                       onClick={() => setHistoryFilter(f)}
                       className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                         historyFilter === f ? 'bg-accent text-black shadow-lg' : 'bg-white/5 text-zinc-500 hover:text-white hover:bg-white/10'
                       }`}
                     >
                       {f === 'bill' ? 'Final Bills' : f === 'quotation' ? 'Quotations' : f === 'repair' ? 'Repair Bills' : 'Show All'}
                     </button>
                   ))}
                </div>
              </div>
              
              <div className="flex-1 overflow-auto">
                {historyLoading ? (
                   <div className="py-20 text-center">
                      <div className="animate-spin w-10 h-10 border-4 border-accent border-t-transparent rounded-full mx-auto mb-4" />
                      <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest text-glow">Decrypting Archives...</span>
                   </div>
                ) : historyFiles.filter(file => {
                    const matchesSearch = file.filename.toLowerCase().includes(historySearch.toLowerCase()) || 
                                         file.serial.toLowerCase().includes(historySearch.toLowerCase());
                    if (historyFilter === 'all') return matchesSearch;
                    if (historyFilter === 'bill') return matchesSearch && file.filename.toLowerCase().includes('final_bill');
                    if (historyFilter === 'quotation') return matchesSearch && file.filename.toLowerCase().includes('quotation');
                    if (historyFilter === 'repair') return matchesSearch && file.filename.toLowerCase().includes('repair');
                    return matchesSearch;
                }).length === 0 ? (
                   <div className="py-32 text-center bg-black/20 rounded-[3rem] border border-dashed border-white/5">
                      <Database size={48} className="mx-auto text-zinc-800 mb-6" />
                      <p className="text-zinc-600 font-black uppercase tracking-widest text-xs">No entries found matching filters</p>
                   </div>
                ) : (
                   <div className="grid grid-cols-1 gap-4 pr-4">
                      {historyFiles.filter(file => {
                          const matchesSearch = file.filename.toLowerCase().includes(historySearch.toLowerCase()) || 
                                               file.serial.toLowerCase().includes(historySearch.toLowerCase());
                          if (historyFilter === 'all') return matchesSearch;
                          if (historyFilter === 'bill') return matchesSearch && file.filename.toLowerCase().includes('final_bill');
                          if (historyFilter === 'quotation') return matchesSearch && file.filename.toLowerCase().includes('quotation');
                          if (historyFilter === 'repair') return matchesSearch && file.filename.toLowerCase().includes('repair');
                          return matchesSearch;
                      }).map((file, i) => (
                         <div key={i} className="group p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-accent/40 hover:bg-accent/[0.02] transition-all duration-500 flex items-center justify-between">
                            <div className="flex items-center gap-8">
                               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                                 file.filename.includes('repair') ? 'bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white' : 
                                 file.filename.includes('quotation') ? 'bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white' :
                                 'bg-accent/10 text-accent group-hover:bg-accent group-hover:text-black'
                               }`}>
                                  <FileText size={24} />
                               </div>
                               <div className="flex flex-col">
                                  <span className="text-sm font-black uppercase tracking-widest text-white group-hover:translate-x-1 transition-transform">{file.filename}</span>
                                  <div className="flex items-center gap-5 mt-2 text-[10px] font-mono text-zinc-500">
                                     <div className="flex items-center gap-2">
                                       <Users size={12} className="text-accent/40" />
                                       <span className="text-accent/60">{file.serial}</span>
                                     </div>
                                     <div className="flex items-center gap-2">
                                       <Database size={12} className="text-zinc-700" />
                                       <span>{(file.size / 1024).toFixed(1)} KB</span>
                                     </div>
                                     <div className="flex items-center gap-2">
                                       < Receipt size={12} className="text-zinc-700" />
                                       <span>{file.created_at}</span>
                                     </div>
                                  </div>
                               </div>
                            </div>
                            <a 
                              href={`${import.meta.env.VITE_API_URL}/api/files/${file.serial}/${file.filename}`}
                              target="_blank"
                              className="px-8 py-4 rounded-2xl bg-white/5 hover:bg-white text-zinc-400 hover:text-black text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl hover:-translate-y-1 active:translate-y-0"
                            >
                               Retrieve Node
                            </a>
                         </div>
                      ))}
                   </div>
                )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
