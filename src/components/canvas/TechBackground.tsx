import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Grid, Sparkles, Icosahedron, Float } from '@react-three/drei';
import * as THREE from 'three';

export default function TechBackground() {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Slowly move the data packets (Grid and Sparkles) up to simulate scrolling forward through tech space
      groupRef.current.position.y = window.scrollY * 0.005;
    }
    if (coreRef.current) {
      coreRef.current.rotation.x = state.clock.elapsedTime * 0.1;
      coreRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      
      {/* Abstract Tech Grid (Digital Floor) */}
      <Grid
        position={[0, -5, -10]}
        rotation={[Math.PI / 2.5, 0, 0]} // Tilted into distance
        args={[50, 50]}
        cellSize={1} // Small squares
        cellThickness={1}
        cellColor="#1e1b4b" // Very dark indigo
        sectionSize={5} // Large squares
        sectionThickness={1.5}
        sectionColor="#312e81" // Lighter indigo for architectural line
        fadeDistance={30}
        fadeStrength={2}
      />

      {/* Interstellar/Data Packets (Subtle structural dots) */}
      <Sparkles 
        count={200} 
        scale={30} 
        size={2} 
        speed={0.2} 
        opacity={0.3} 
        color="#818cf8" 
      />

      {/* Main Abstract Technological Core — More Visible */}
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1} position={[0, 0, -5]}>
        <Icosahedron ref={coreRef} args={[3.8, 2]}> {/* Slightly larger globe */}
          <meshStandardMaterial 
            color="#6366f1" 
            emissive="#4f46e5"
            emissiveIntensity={1.2} /* Stronger glow */
            wireframe 
            transparent 
            opacity={0.4} /* Significantly increased opacity */
          />
        </Icosahedron>
      </Float>

    </group>
  );
}
