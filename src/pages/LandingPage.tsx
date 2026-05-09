import { useEffect } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import HeroSection from '../components/sections/HeroSection';
import AboutSection from '../components/sections/AboutSection';
import ProjectsBento from '../components/sections/ProjectsBento';
import SkillsSection from '../components/sections/SkillsSection';
import PortalsSection from '../components/sections/PortalsSection';
import CoursesSection from '../components/sections/CoursesSection';
import ContactSection from '../components/sections/ContactSection';

export default function LandingPage({ isLoaded }: { isLoaded: boolean }) {
  useEffect(() => {
    // Force refresh ScrollTrigger to account for pinning/layout shifts
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <HeroSection isLoaded={isLoaded} />
      <AboutSection />
      <ProjectsBento />
      <SkillsSection />
      <PortalsSection />
      <CoursesSection />
      <ContactSection />
    </>
  );
}
