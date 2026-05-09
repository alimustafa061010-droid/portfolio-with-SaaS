import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float, Environment, TorusKnot, Box } from '@react-three/drei';
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

      {/* --- Robot Midgets --- */}

      {/* 1. Footballer Robot - Kicking a ball */}
      <RobotMidget 
        position={[-4, 2, -2]} 
        type="soccer" 
        color="#818cf8" 
        rotation={[0, Math.PI / 4, 0]}
      />

      {/* 2. Zen Robot - Floating peacefully */}
      <RobotMidget 
        position={[4, -1, -3]} 
        type="zen" 
        color="#c084fc" 
        rotation={[0, -Math.PI / 6, 0]}
      />

      {/* 3. Random Explorer - Zooming around */}
      <RobotMidget 
        position={[-3, -3, -4]} 
        type="float" 
        color="#2dd4bf" 
        rotation={[0, Math.PI / 2, 0]}
      />

      <Environment preset="city" environmentIntensity={1.5} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Robot Midget Component
// ─────────────────────────────────────────────────────────────────────────────

interface RobotProps {
  position: [number, number, number];
  type: 'soccer' | 'zen' | 'float';
  color: string;
  rotation?: [number, number, number];
}

function RobotMidget({ position, type, color, rotation = [0, 0, 0] }: RobotProps) {
  const groupRef = useRef<THREE.Group>(null);
  const legRef = useRef<THREE.Group>(null);
  const ballRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    // Base floating motion
    groupRef.current.position.y += Math.sin(t * 2) * 0.005;

    if (type === 'soccer') {
      // Kick animation
      if (legRef.current) {
         legRef.current.rotation.x = Math.sin(t * 8) * 0.5 - 0.5;
      }
      // Ball bounce animation
      if (ballRef.current) {
         ballRef.current.position.x = Math.sin(t * 8) * 0.8 + 1.2;
         ballRef.current.position.y = Math.abs(Math.sin(t * 16)) * 0.3;
      }
    }

    if (type === 'zen') {
      // Gentle meditative rotation/waver
      groupRef.current.rotation.z = Math.sin(t) * 0.1;
      groupRef.current.rotation.y += 0.01;
    }

    if (type === 'float') {
       // Drifting motion
       groupRef.current.position.x += Math.sin(t * 0.5) * 0.01;
    }
  });

  return (
    <group position={position} rotation={rotation} ref={groupRef} scale={0.4}>
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        
        {/* Head */}
        <Box args={[0.5, 0.4, 0.4]} position={[0, 0.6, 0]}>
          <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
          {/* Eyes */}
          <Box args={[0.1, 0.05, 0.05]} position={[0.12, 0.05, 0.2]}>
            <meshStandardMaterial color="white" emissive="white" emissiveIntensity={2} />
          </Box>
          <Box args={[0.1, 0.05, 0.05]} position={[-0.12, 0.05, 0.2]}>
            <meshStandardMaterial color="white" emissive="white" emissiveIntensity={2} />
          </Box>
        </Box>

        {/* Body */}
        <Box args={[0.6, 0.7, 0.4]} position={[0, 0, 0]}>
          <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
        </Box>

        {/* Arms */}
        <Box args={[0.15, 0.5, 0.15]} position={[0.4, 0.1, 0]}>
          <meshStandardMaterial color="#27272a" />
        </Box>
        <Box args={[0.15, 0.5, 0.15]} position={[-0.4, 0.1, 0]}>
          <meshStandardMaterial color="#27272a" />
        </Box>

        {/* Legs / Lower half */}
        {type === 'zen' ? (
          // Crossed legs
          <group position={[0, -0.4, 0.1]}>
             <Box args={[0.6, 0.15, 0.15]} rotation={[0, 0, 0.2]}>
                <meshStandardMaterial color="#27272a" />
             </Box>
          </group>
        ) : (
          <group>
             <group ref={type === 'soccer' ? legRef : null} position={[0.15, -0.35, 0]}>
                <Box args={[0.2, 0.5, 0.2]} position={[0, -0.2, 0]}>
                  <meshStandardMaterial color="#27272a" />
                </Box>
             </group>
             <Box args={[0.2, 0.5, 0.2]} position={[-0.15, -0.55, 0]}>
                <meshStandardMaterial color="#27272a" />
             </Box>
          </group>
        )}

        {/* Soccer Ball */}
        {type === 'soccer' && (
          <Sphere ref={ballRef} args={[0.15, 16, 16]} position={[1.2, -0.7, 0]}>
            <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
          </Sphere>
        )}

      </Float>
    </group>
  );
}
