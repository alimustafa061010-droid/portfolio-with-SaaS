import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float, Environment, TorusKnot } from '@react-three/drei';
import * as THREE from 'three';

export default function HeroScene() {
  const groupRef = useRef<THREE.Group>(null);
  const knotRef = useRef<THREE.Mesh>(null);

  // Tie rotation and position to the scroll to simulate an interactive "character"
  useFrame((state) => {
    const scrollY = window.scrollY;
    
    if (groupRef.current) {
      // Rotate the entire avatar group based on scroll
      groupRef.current.rotation.y = scrollY * 0.002;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.2 - (scrollY * 0.005);
    }
    
    if (knotRef.current) {
      // Inner character core spins
      knotRef.current.rotation.x = state.clock.elapsedTime * 0.5;
      knotRef.current.rotation.z = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={2} />
      
      <group ref={groupRef} position={[0, 0, 0]}>
        <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
          {/* Outer Halo (Smoked Glass) */}
          <Sphere args={[2.2, 32, 32]}>
            <meshPhysicalMaterial 
              color="#1a1a1f" /* Brighter than #09090b */
              transmission={1} 
              opacity={1} 
              roughness={0.05} /* Sweeter reflections */
              ior={1.8} 
              thickness={2.5} 
              transparent 
            />
          </Sphere>
          
          {/* Inner Avatar/Character Core */}
          <TorusKnot ref={knotRef} args={[0.8, 0.3, 128, 32]} position={[0, 0, 0]}>
            <MeshDistortMaterial
              color="#4f46e5" /* indigo-600 */
              emissive="#1e1b4b"
              envMapIntensity={2}
              clearcoat={1}
              metalness={0.9}
              roughness={0.1}
              distort={0.3}
              speed={3}
            />
          </TorusKnot>
        </Float>
      </group>

      <Environment preset="city" environmentIntensity={1.5} />
    </>
  );
}
