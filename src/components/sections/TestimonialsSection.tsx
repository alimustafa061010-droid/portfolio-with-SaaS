import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const testimonials = [
  { quote: "The most fluid and immersive web experience our agency has ever delivered. Pure magic.", author: "Sarah J.", role: "Creative Director" },
  { quote: "Flawless execution of complex 3D interactions. High-end development at its finest.", author: "Mike T.", role: "Founder, Tech Startup" },
];

export default function TestimonialsSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from('.test-card', {
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 70%',
      },
      y: 50,
      opacity: 0,
      duration: 1,
      stagger: 0.3,
      ease: 'power3.out'
    });
  }, { scope: containerRef });

  return (
    <section id="testimonials" className="w-full py-24 bg-zinc-50 dark:bg-transparent transition-colors px-4 md:px-12 lg:px-24" ref={containerRef}>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white font-display mb-16 text-center">Words.</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
          {testimonials.map((test, i) => (
            <div key={i} className="test-card relative p-12 bg-white dark:bg-zinc-900/50 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-zinc-100 dark:border-white/5">
              <div className="text-indigo-500 text-6xl font-serif absolute top-6 left-6 opacity-20">"</div>
              <p className="text-xl md:text-2xl font-light text-zinc-700 dark:text-zinc-300 mb-8 relative z-10">
                {test.quote}
              </p>
              <div className="flex flex-col">
                <span className="font-semibold text-zinc-900 dark:text-white tracking-wide">{test.author}</span>
                <span className="text-sm font-mono text-indigo-500">{test.role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
