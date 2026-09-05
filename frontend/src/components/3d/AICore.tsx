import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AICoreProps {
  intensity?: number;
  scale?: number;
  activeCategory?: string | null;
}

export const AICore: React.FC<AICoreProps> = ({ intensity = 0.9, scale = 1, activeCategory }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const ring1Ref = useRef<THREE.Mesh>(null!);
  const ring2Ref = useRef<THREE.Mesh>(null!);
  const ring3Ref = useRef<THREE.Mesh>(null!);
  const ring4Ref = useRef<THREE.Mesh>(null!);
  const coreRef = useRef<THREE.Mesh>(null!);
  const outerGlowRef = useRef<THREE.Mesh>(null!);
  const innerParticlesRef = useRef<THREE.Points>(null!);

  // Category dynamic color shift
  const coreColor = useMemo(() => {
    if (activeCategory === 'career') return new THREE.Color('#06b6d4');
    if (activeCategory === 'startup') return new THREE.Color('#10b981');
    if (activeCategory === 'core') return new THREE.Color('#8b5cf6');
    return new THREE.Color('#6366f1');
  }, [activeCategory]);

  // Inner particle cloud positions & colors
  const { innerPositions, innerColors } = useMemo(() => {
    const count = 90;
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    const baseCol = new THREE.Color('#818cf8');
    const accentCol = new THREE.Color('#38bdf8');

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.2 + Math.random() * 0.45;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      const mixed = Math.random() > 0.5 ? baseCol : accentCol;
      cols[i * 3] = mixed.r;
      cols[i * 3 + 1] = mixed.g;
      cols[i * 3 + 2] = mixed.b;
    }
    return { innerPositions: pos, innerColors: cols };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Multi-axis gyroscopic rotation of containment rings
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * 0.4;
      ring1Ref.current.rotation.y = t * 0.25;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = -t * 0.35;
      ring2Ref.current.rotation.z = t * 0.2;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.x = -t * 0.3;
      ring3Ref.current.rotation.z = -t * 0.25;
    }
    if (ring4Ref.current) {
      ring4Ref.current.rotation.y = t * 0.5;
      ring4Ref.current.rotation.x = Math.sin(t * 0.5) * 0.3;
    }

    // Dynamic core pulse with breathing intensity
    if (coreRef.current) {
      const pulseFactor = 1 + Math.sin(t * 2.2) * 0.08 + Math.cos(t * 3.5) * 0.03;
      coreRef.current.scale.setScalar(pulseFactor);
      const mat = coreRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.8 + Math.sin(t * 2.5) * 0.4 * intensity;
      coreRef.current.rotation.y = t * 0.3;
      coreRef.current.rotation.x = t * 0.15;
    }

    // Outer glow breathing
    if (outerGlowRef.current) {
      const glowScale = 1.2 + Math.sin(t * 1.8) * 0.08;
      outerGlowRef.current.scale.setScalar(glowScale);
    }

    // Inner quantum particle swirl
    if (innerParticlesRef.current) {
      innerParticlesRef.current.rotation.y = -t * 0.4;
      innerParticlesRef.current.rotation.x = Math.sin(t * 0.4) * 0.2;
      innerParticlesRef.current.rotation.z = Math.cos(t * 0.3) * 0.15;
    }
  });

  return (
    <group ref={groupRef} scale={scale}>
      {/* Central Geometric Core */}
      <mesh ref={coreRef}>
        <octahedronGeometry args={[0.48, 2]} />
        <meshStandardMaterial
          color={coreColor}
          emissive={coreColor}
          emissiveIntensity={1.0 * intensity}
          roughness={0.15}
          metalness={0.85}
          wireframe={false}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Internal Core Wireframe Cage */}
      <mesh scale={1.05}>
        <icosahedronGeometry args={[0.5, 1]} />
        <meshBasicMaterial
          color="#c7d2fe"
          wireframe
          transparent
          opacity={0.35 * intensity}
        />
      </mesh>

      {/* Outer Volumetric Glow Sphere */}
      <mesh ref={outerGlowRef} scale={1.25}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color={coreColor}
          emissive={coreColor}
          emissiveIntensity={0.5 * intensity}
          transparent
          opacity={0.18}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Ring 1 - Cyan primary accelerator */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[0.85, 0.016, 16, 80]} />
        <meshStandardMaterial
          color="#06b6d4"
          emissive="#22d3ee"
          emissiveIntensity={1.2 * intensity}
          transparent
          opacity={0.85}
          roughness={0.2}
        />
      </mesh>

      {/* Ring 2 - Violet orbital harmonic */}
      <mesh ref={ring2Ref} rotation={[Math.PI / 3, 0, Math.PI / 6]}>
        <torusGeometry args={[1.05, 0.013, 16, 80]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#c084fc"
          emissiveIntensity={1.0 * intensity}
          transparent
          opacity={0.75}
          roughness={0.2}
        />
      </mesh>

      {/* Ring 3 - Indigo wide orbit */}
      <mesh ref={ring3Ref} rotation={[Math.PI / 4, Math.PI / 5, 0]}>
        <torusGeometry args={[1.25, 0.011, 16, 80]} />
        <meshStandardMaterial
          color="#6366f1"
          emissive="#818cf8"
          emissiveIntensity={0.8 * intensity}
          transparent
          opacity={0.6}
          roughness={0.2}
        />
      </mesh>

      {/* Ring 4 - Emerald quantum stabilizer */}
      <mesh ref={ring4Ref} rotation={[-Math.PI / 6, Math.PI / 3, Math.PI / 4]}>
        <torusGeometry args={[1.45, 0.008, 16, 80]} />
        <meshStandardMaterial
          color="#10b981"
          emissive="#34d399"
          emissiveIntensity={0.7 * intensity}
          transparent
          opacity={0.45}
          roughness={0.3}
        />
      </mesh>

      {/* Inner Quantum Particle Cloud */}
      <points ref={innerParticlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[innerPositions, 3]}
            count={90}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[innerColors, 3]}
            count={90}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          vertexColors
          transparent
          opacity={0.85 * intensity}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
};
