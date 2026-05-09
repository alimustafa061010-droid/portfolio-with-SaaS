import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      // On touch/mobile we let native scroll happen so GSAP ScrollTrigger
      // reads the real scroll position — prevents distortion on scroll-up
      wheelMultiplier: isTouchDevice ? 0 : 1,
      touchMultiplier: isTouchDevice ? 0 : 2,
    });

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // Normalise scroll on mobile so ScrollTrigger handles momentum correctly
    if (isTouchDevice) {
      ScrollTrigger.normalizeScroll(true);
    }

    return () => {
      lenis.destroy();
      gsap.ticker.remove(lenis.raf);
      ScrollTrigger.normalizeScroll(false);
    };
  }, []);

  return <>{children}</>;
}
