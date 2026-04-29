import { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Users, Package, LogOut, Bell, FileText, ChevronRight, X, Wrench, Trash2, Settings, ShieldAlert, Database, History } from 'lucide-react';
import InventoryManager from '../components/dashboard/InventoryManager';
import RepairManager from '../components/dashboard/RepairManager';
import CustomerCRM from '../components/dashboard/CustomerCRM';
import InvoiceManager from '../components/dashboard/InvoiceManager';

export default function MktDashboard() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'customers' | 'repairs' | 'invoices' | 'settings'>('inventory');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [billType, setBillType] = useState<'invoice' | 'quotation' | 'repair'>('invoice');
  const [targetCustomer, setTargetCustomer] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/stats`);
      setStats(await statsRes.json());
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Fetch customers once for the POS select
    const fetchCustomers = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/customers`);
        setCustomers(await res.json());
      } catch (err) { console.error(err); }
    };
    
    fetchCustomers();
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('mkt_user');
    window.location.href = '/auth';
  };

  // Removed legacy handleCreate mapping since component sub-pages handle creation directly

  const generateBill = async (customerSerial: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/generate-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_serial: customerSerial,
          items: selectedItems.filter((i: any) => !i.isMisc).map((i: any) => ({
            id: i.id,
            material: i.material_name,
            quantity: i.selectedQty || 1,
            price: i.price,
            total: (i.selectedQty || 1) * i.price
          })),
          misc_items: selectedItems.filter((i: any) => i.isMisc).map((i: any) => ({
             description: i.name,
             price: i.price,
             quantity: i.selectedQty || 1,
             total: (i.selectedQty || 1) * i.price
          })),
          type: billType
        })
      });
      const result = await res.json();
      if (result.success) {
        alert('Invoice generated successfully at: ' + result.pdf_path);
        setSelectedItems([]);
        setShowCheckout(false);
      }
    } catch (err) { alert('Invoice generation failed'); }
  };

  return (
    <div ref={containerRef} className="flex min-h-screen bg-black text-white selection:bg-accent selection:text-black font-sans">
      {/* Sidebar */}
      <aside className="w-72 border-r border-white/5 bg-zinc-950 flex flex-col p-8 space-y-10 z-20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-black font-black text-2xl shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)]">M</div>
          <div className="flex flex-col">
            <span className="font-black uppercase tracking-tighter text-2xl italic leading-none">Modern Mkt</span>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">Enterprise Core</span>
          </div>
        </div>

        <nav className="flex-1 space-y-3">
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-500 group ${activeTab === 'inventory' ? 'bg-white/10 text-accent shadow-inner' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
          >
            <div className="flex items-center gap-4">
               <Package size={20} className={activeTab === 'inventory' ? 'animate-pulse' : ''} />
               <span className="text-xs font-black uppercase tracking-[0.2em]">Inventory</span>
            </div>
            {activeTab === 'inventory' && <div className="w-1.5 h-1.5 rounded-full bg-accent" />}
          </button>
          <button 
            onClick={() => setActiveTab('customers')}
            className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-500 group ${activeTab === 'customers' ? 'bg-white/10 text-accent shadow-inner' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
          >
            <div className="flex items-center gap-4">
               <Users size={20} className={activeTab === 'customers' ? 'animate-pulse' : ''} />
               <span className="text-xs font-black uppercase tracking-[0.2em]">Customers</span>
            </div>
            {activeTab === 'customers' && <div className="w-1.5 h-1.5 rounded-full bg-accent" />}
          </button>
          <button 
            onClick={() => setActiveTab('repairs')}
            className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-500 group ${activeTab === 'repairs' ? 'bg-red-500/10 text-red-500 shadow-inner' : 'text-zinc-500 hover:text-red-400 hover:bg-red-500/5'}`}
          >
            <div className="flex items-center gap-4">
               <Wrench size={20} className={activeTab === 'repairs' ? 'animate-pulse' : ''} />
               <span className="text-xs font-black uppercase tracking-[0.2em]">Repairs</span>
            </div>
            {activeTab === 'repairs' && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
          </button>
          <button 
            onClick={() => setActiveTab('invoices')}
            className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-500 group ${activeTab === 'invoices' ? 'bg-white/10 text-accent shadow-inner' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
          >
            <div className="flex items-center gap-4">
               <FileText size={20} className={activeTab === 'invoices' ? 'animate-pulse' : ''} />
               <span className="text-xs font-black uppercase tracking-[0.2em]">Invoices</span>
            </div>
            {activeTab === 'invoices' && <div className="w-1.5 h-1.5 rounded-full bg-accent" />}
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-500 group ${activeTab === 'settings' ? 'bg-white/10 text-accent shadow-inner' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
          >
            <div className="flex items-center gap-4">
               <Settings size={20} className={activeTab === 'settings' ? 'animate-spin-slow' : ''} />
               <span className="text-xs font-black uppercase tracking-[0.2em]">Settings</span>
            </div>
            {activeTab === 'settings' && <div className="w-1.5 h-1.5 rounded-full bg-accent" />}
          </button>
        </nav>

        <div className="pt-8 border-t border-white/5 space-y-4">
           <button 
             onClick={handleLogout}
             className="w-full flex items-center gap-4 px-6 py-4 text-zinc-500 hover:text-red-400 transition-all duration-300 rounded-2xl hover:bg-red-400/10 active:scale-95"
           >
             <LogOut size={16} /> Logout
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto relative">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-zinc-900/20 rounded-full blur-[120px] pointer-events-none" />

        <header className="flex justify-between items-end mb-16 relative z-10">
          <div>
            <h1 className="text-6xl font-black uppercase tracking-tighter italic leading-none drop-shadow-2xl">{activeTab} Hub</h1>
            <div className="flex items-center gap-3 mt-4">
               <div className="w-2 h-2 rounded-full bg-accent animate-ping" />
               <span className="text-xs font-mono text-zinc-400 uppercase tracking-[0.3em]">System Node 024 // Online</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             {selectedItems.length > 0 && (
                <button 
                  onClick={() => setShowCheckout(true)}
                  className="flex items-center gap-3 px-6 py-3 rounded-full bg-white text-black font-black uppercase text-[10px] tracking-widest shadow-xl animate-bounce hover:animate-none scale-110 active:scale-95 transition-all"
                >
                  <FileText size={16} /> Create Bill ({selectedItems.length})
                </button>
             )}
             <div className="w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all cursor-pointer backdrop-blur-xl">
               <Bell size={20} className="text-zinc-400" />
             </div>
          </div>
        </header>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              { label: 'Total Inventory Items', value: stats.inventory_items, icon: Package, color: 'text-white' },
              { label: 'Active Customers', value: stats.customers, icon: Users, color: 'text-white' },
              { label: 'Total Stock Units', value: stats.total_stock, icon: LayoutDashboard, color: 'text-accent' }
            ].map((stat, i) => (
              <div key={i} className="group p-10 rounded-[2.5rem] bg-zinc-900/30 border border-white/5 backdrop-blur-3xl overflow-hidden relative transition-all duration-700 hover:border-accent/40 hover:-translate-y-2">
                 <div className="absolute top-0 right-0 p-10 opacity-5 scale-[2] rotate-12 group-hover:rotate-0 group-hover:scale-[2.2] transition-all duration-1000 ease-out text-accent">
                    <stat.icon size={100} />
                 </div>
                 <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em] font-bold">{stat.label}</span>
                 <h2 className={`text-6xl font-black mt-4 italic tracking-tighter ${stat.color}`}>{stat.value}</h2>
                 <div className="mt-6 flex items-center gap-2 text-accent opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <span className="text-[10px] font-black uppercase tracking-widest">View Details</span>
                    <ChevronRight size={14} />
                 </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab Content Routing */}
        {loading ? (
           <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin w-12 h-12 border-4 border-accent border-t-transparent rounded-full" />
           </div>
        ) : (
           <>
              {activeTab === 'inventory' && <InventoryManager selectedItems={selectedItems} setSelectedItems={setSelectedItems} />}
              {activeTab === 'repairs' && <RepairManager selectedItems={selectedItems} setSelectedItems={setSelectedItems} />}
              {activeTab === 'customers' && <CustomerCRM />}
              {activeTab === 'invoices' && <InvoiceManager />}
              {activeTab === 'settings' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in slide-in-from-bottom-8 duration-700">
                   <div className="p-10 rounded-[3rem] bg-zinc-900/30 border border-white/5 backdrop-blur-3xl space-y-8">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-500 flex items-center justify-center"><ShieldAlert /></div>
                         <h3 className="text-2xl font-black uppercase tracking-tighter italic">Critical Operations</h3>
                      </div>
                      <p className="text-sm text-zinc-500 font-medium">Resetting the system will permanently wipe all inventory, customers, and history nodes. This action is irreversible.</p>
                      <button 
                        onClick={async () => {
                           const pin = prompt('Enter Admin PIN to confirm factory reset:');
                           if (!pin) return;
                           try {
                              const res = await fetch(`${import.meta.env.VITE_API_URL}/api/system/reset`, {
                                 method: 'POST',
                                 headers: { 'Content-Type': 'application/json' },
                                 body: JSON.stringify({ pin })
                              });
                              const data = await res.json();
                              if (data.success) {
                                 alert('System Reset Successful. Logic core purged.');
                                 window.location.reload();
                              } else {
                                 alert('Access Denied: ' + data.message);
                              }
                           } catch (err) { alert('Operation Failed'); }
                        }}
                        className="w-full py-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95"
                      >
                         Factory Reset Core
                      </button>
                   </div>

                   <div className="p-10 rounded-[3rem] bg-zinc-900/30 border border-white/5 backdrop-blur-3xl space-y-8">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-accent/20 text-accent flex items-center justify-center"><ShieldAlert /></div>
                         <h3 className="text-2xl font-black uppercase tracking-tighter italic">System Node</h3>
                      </div>
                      <div className="space-y-4">
                         <div className="flex justify-between items-center text-sm font-mono uppercase tracking-widest text-zinc-500">
                            <span>Status</span>
                            <span className="text-green-400">Authenticated</span>
                         </div>
                         <div className="flex justify-between items-center text-sm font-mono uppercase tracking-widest text-zinc-500">
                            <span>Type</span>
                            <span>Enterprise Core</span>
                         </div>
                         <div className="flex justify-between items-center text-sm font-mono uppercase tracking-widest text-zinc-500">
                            <span>Integration</span>
                            <span className="text-white">Active</span>
                         </div>
                         <div className="flex justify-between items-center text-sm font-mono uppercase tracking-widest text-zinc-500">
                            <span>Temporal Limit</span>
                            <span>Infinite Horizon</span>
                         </div>
                      </div>
                   </div>

                   <div className="p-10 rounded-[3rem] bg-zinc-900/30 border border-white/5 backdrop-blur-3xl space-y-8">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-accent/20 text-accent flex items-center justify-center"><Database /></div>
                         <h3 className="text-2xl font-black uppercase tracking-tighter italic">Data Synchronization</h3>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                         <button 
                           onClick={() => window.open(`${import.meta.env.VITE_API_URL}/api/system/backup`, '_blank')}
                           className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-accent/40 transition-all group"
                         >
                            <div className="flex items-center gap-4">
                               <History className="text-zinc-500 group-hover:text-accent transition-colors" />
                               <span className="text-xs font-black uppercase tracking-widest">Backup Database</span>
                            </div>
                            <ChevronRight size={16} className="text-zinc-600" />
                         </button>
                         <label className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-accent/40 transition-all group cursor-pointer">
                            <div className="flex items-center gap-4">
                               <Database className="text-zinc-500 group-hover:text-accent transition-colors" />
                               <span className="text-xs font-black uppercase tracking-widest">Restore Node Data</span>
                               <input type="file" className="hidden" onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const formData = new FormData();
                                  formData.append('file', file);
                                  try {
                                     const res = await fetch(`${import.meta.env.VITE_API_URL}/api/system/restore`, {
                                        method: 'POST',
                                        body: formData
                                     });
                                     const data = await res.json();
                                     alert(data.message);
                                     if (data.success) window.location.reload();
                                  } catch (err) { alert('Restore Failed'); }
                               }} />
                            </div>
                            <ChevronRight size={16} className="text-zinc-600" />
                         </label>
                      </div>
                   </div>
                </div>
              )}
           </>
        )}
      </main>


      {/* Checkout Drawer for Bill Generation */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex justify-end">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowCheckout(false)} />
           <aside className="relative w-[500px] h-full bg-zinc-950 border-l border-white/10 p-12 flex flex-col shadow-3xl">
              <div className="flex justify-between items-center mb-12">
                 <h2 className="text-4xl font-black uppercase tracking-tighter italic">Generation Node</h2>
                 <button onClick={() => setShowCheckout(false)} className="text-zinc-500 hover:text-white"><X /></button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6">
                 <div className="flex bg-white/5 p-1 rounded-2xl mb-8">
                    {(['invoice', 'quotation', 'repair'] as const).map((type) => (
                       <button 
                         key={type}
                         onClick={() => setBillType(type)}
                         className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${billType === type ? 'bg-accent text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                       >
                         {type}
                       </button>
                    ))}
                 </div>

                 <div className="space-y-4">
                    <p className="text-xs font-mono text-zinc-500 uppercase tracking-[.3em]">Items in Cart</p>
                    {selectedItems.map((item, i) => (
                       <div key={i} className="flex justify-between items-center p-6 bg-white/5 rounded-3xl border border-white/5 group hover:border-accent/30 transition-all">
                          <div className="flex flex-col">
                             <span className="font-black uppercase tracking-tighter italic text-lg">{item.material_name || item.name}</span>
                             <span className="text-[10px] font-mono text-zinc-400 uppercase mt-1">Rate: {item.price}</span>
                          </div>
                          <div className="flex items-center gap-4">
                             <input 
                               type="number" 
                               defaultValue={item.selectedQty || 1}
                               className="w-16 bg-black border border-white/10 rounded-lg px-2 py-1 text-center font-mono text-xs focus:border-accent"
                               onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  const newItems = [...selectedItems];
                                  newItems[i].selectedQty = val;
                                  setSelectedItems(newItems);
                               }}
                             />
                             <button onClick={() => setSelectedItems(selectedItems.filter((_, idx) => idx !== i))} className="text-zinc-500 hover:text-red-500 transition-colors">
                                <Trash2 size={16} />
                             </button>
                          </div>
                       </div>
                    ))}
                    <button 
                      onClick={() => setSelectedItems([...selectedItems, { name: 'New Item', price: 0, selectedQty: 1, isMisc: true }])}
                      className="w-full py-4 border-2 border-dashed border-white/10 rounded-3xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:border-accent hover:text-accent transition-all"
                    >
                       Add Misc Item
                    </button>
                 </div>
              </div>

              <div className="mt-12 pt-8 border-t border-white/5">
                 <div className="flex justify-between items-center mb-8">
                    <span className="text-sm font-black uppercase tracking-widest">Grand Total</span>
                    <span className="text-3xl font-black text-accent italic">
                       PKR {selectedItems.reduce((acc, i) => acc + (i.price * (i.selectedQty || 1)), 0).toLocaleString()}
                    </span>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block mb-2">Select Target Client</label>
                    <div className="relative group">
                       <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-accent" size={16} />
                       <select 
                         value={targetCustomer}
                         onChange={(e) => setTargetCustomer(e.target.value)}
                         className="w-full bg-black border border-white/10 rounded-2xl p-4 pl-12 text-xs font-mono appearance-none focus:border-accent"
                       >
                          <option value="">Manual Entry / Walk-in</option>
                          {customers.map(c => (
                             <option key={c.id} value={c.serial_number}>{c.name} ({c.serial_number})</option>
                          ))}
                       </select>
                    </div>
                    {!targetCustomer && (
                       <input 
                         id="checkout-serial" 
                         type="text" 
                         placeholder="OR Enter Serial Hash Manually..." 
                         className="w-full bg-black border border-white/10 rounded-2xl p-4 text-xs font-mono focus:border-accent" 
                       />
                    )}
                    <button 
                      onClick={() => generateBill(targetCustomer || (document.getElementById('checkout-serial') as HTMLInputElement).value)}
                      disabled={selectedItems.length === 0}
                      className="w-full bg-white text-black font-black uppercase tracking-[.2em] py-6 rounded-2xl hover:bg-accent transition-all text-sm mt-4 shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                       Initialize PDF Stream
                    </button>
                 </div>
              </div>
           </aside>
        </div>
      )}

      {/* NOTE: Modals for creating inventory items and customers have been moved to their respective manager components */}
    </div>
  );
}
