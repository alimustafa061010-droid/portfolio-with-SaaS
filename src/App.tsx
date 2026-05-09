import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { ThemeProvider } from './context/ThemeContext';
import Preloader from './components/ui/Preloader';
import ScrollProgress from './components/ui/ScrollProgress';
import Navbar from './components/layout/Navbar';
import SmoothScroll from './components/layout/SmoothScroll';
import CustomCursor from './components/ui/CustomCursor';
import TechBackground from './components/canvas/TechBackground';

import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import MktDashboard from './pages/MktDashboard';

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <ThemeProvider>
      <BrowserRouter>
        {!isLoaded && <Preloader onComplete={() => setIsLoaded(true)} />}

        <SmoothScroll>
          <ScrollProgress />
          <CustomCursor />
          <Navbar />
          
          <main className="relative w-full bg-transparent overflow-hidden">
            
            {/* Global Background Layers */}
            <div className="fixed inset-0 z-0 bg-dark pointer-events-none overflow-hidden">
              {/* Dot Grid Layer */}
              <div className="absolute inset-0 bg-dot-grid opacity-20" />
            
              {/* Optional: Subtle Vignette / Gradient Overlay */}
              <div className="absolute inset-0 bg-radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)" />
              
              {/* Interactive Canvas Background Layer */}
              <Canvas camera={{ position: [0, 0, 5], fov: 45 }} className="opacity-70">
                <TechBackground />
              </Canvas>
            </div>

            <div className="relative z-10 w-full min-h-screen">
              <Routes>
                <Route path="/" element={<LandingPage isLoaded={isLoaded} />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/portal/mkt" element={<MktDashboard />} />
              </Routes>
            </div>

          </main>
        </SmoothScroll>
      </BrowserRouter>
    </ThemeProvider>
  );
}
