import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { X, Send, CheckCircle2, Loader2 } from 'lucide-react';

interface EnrollmentFormProps {
  courseName: string;
  onClose: () => void;
}

export default function EnrollmentForm({ courseName, onClose }: EnrollmentFormProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Entrance animation
    gsap.fromTo(modalRef.current, 
      { opacity: 0 }, 
      { opacity: 1, duration: 0.4, ease: 'power2.out' }
    );
    gsap.fromTo(contentRef.current,
      { y: 50, scale: 0.95, opacity: 0 },
      { y: 0, scale: 1, opacity: 1, duration: 0.6, ease: 'power3.out', delay: 0.1 }
    );
    
    // Lock scroll
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleClose = () => {
    gsap.to(contentRef.current, {
      y: 50,
      scale: 0.95,
      opacity: 0,
      duration: 0.4,
      ease: 'power3.in',
      onComplete: onClose
    });
    gsap.to(modalRef.current, {
      opacity: 0,
      duration: 0.4,
      ease: 'power2.in'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    
    try {
      const response = await fetch('/api/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          course: courseName
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        // Reset form or auto-close after delay
        setTimeout(handleClose, 3000);
      } else {
        setStatus('error');
        setErrorMessage(data.message || 'Something went wrong. Please try again.');
        setTimeout(() => setStatus('idle'), 3000);
      }
    } catch (err) {
      console.error('Enrollment error:', err);
      setStatus('error');
      setErrorMessage('Could not connect to the server. Is the backend running?');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div 
      ref={modalRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
    >
      <div 
        ref={contentRef}
        className="relative w-full max-w-xl bg-zinc-950 border border-white/10 rounded-[40px] shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <button 
          onClick={handleClose}
          className="sticky top-8 float-right mr-8 p-3 rounded-full bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all duration-300 z-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-10 md:p-14 pt-0">
          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mb-8">
                <CheckCircle2 className="w-10 h-10 text-accent" />
              </div>
              <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Application Received</h3>
              <p className="text-zinc-400 max-w-xs mx-auto leading-relaxed">
                Thank you for choosing {courseName}. Our academic advisor will contact you shortly.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-10">
                <span className="text-[10px] font-mono text-accent uppercase tracking-[0.3em] mb-4 block">Enrollment Form</span>
                <h3 className="text-4xl font-black text-white uppercase tracking-tighter leading-tight mb-2">
                  Join {courseName}
                </h3>
                <p className="text-zinc-500 text-sm font-medium">Take the first step towards your new career path.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest pl-1">Full Name</label>
                    <input 
                      required
                      type="text"
                      placeholder="Enter your name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-accent/40 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest pl-1">Email Address</label>
                    <input 
                      required
                      type="email"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-accent/40 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest pl-1">Phone Number</label>
                  <input 
                    type="tel"
                    placeholder="+92 XXX XXXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-accent/40 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest pl-1">Questions or Comments (Optional)</label>
                  <textarea 
                    rows={3}
                    placeholder="Tell us about your background or goals..."
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-accent/40 transition-colors resize-none"
                  />
                </div>

                {status === 'error' && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold text-center uppercase tracking-wider">
                    {errorMessage}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full bg-accent text-zinc-950 flex items-center justify-center gap-3 py-6 rounded-2xl font-black uppercase text-sm tracking-[0.2em] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {status === 'submitting' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Submit Application
                      <Send className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
