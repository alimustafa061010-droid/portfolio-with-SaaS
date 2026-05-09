import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Grid, Sparkles, Icosahedron, Float, Box, Sphere } from '@react-three/drei';
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
        <Icosahedron ref={coreRef} args={[3.5, 2]}> {/* Increased size for better presence */}
          <meshStandardMaterial 
            color="#6366f1" /* Slightly brighter indigo */
            emissive="#4f46e5"
            emissiveIntensity={0.5} /* Subtle glow */
            wireframe 
            transparent 
            opacity={0.15} /* Increased from 0.08 */
          />
        </Icosahedron>
      </Float>

      {/* --- Robot Midgets (Live background actors) --- */}

      {/* 1. Footballer Robot */}
      <RobotMidget 
        position={[-5, 3, -10]} 
        type="soccer" 
        color="#818cf8" 
        rotation={[0, Math.PI / 4, 0]}
      />

      {/* 2. Zen Robot */}
      <RobotMidget 
        position={[5, -2, -8]} 
        type="zen" 
        color="#c084fc" 
        rotation={[0, -Math.PI / 6, 0]}
      />

      {/* 3. Random Explorer */}
      <RobotMidget 
        position={[-4, -4, -12]} 
        type="float" 
        color="#2dd4bf" 
        rotation={[0, Math.PI / 2, 0]}
      />

    </group>
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
    <group position={position} rotation={rotation} ref={groupRef} scale={0.6}>
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
