import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleFieldProps {
  count?: number;
  radius?: number;
}

export const ParticleField: React.FC<ParticleFieldProps> = ({ count = 250, radius = 16 }) => {
  const pointsRef = useRef<THREE.Points>(null!);

  const actualCount = typeof window !== 'undefined' && window.innerWidth < 768 ? Math.floor(count * 0.4) : count;

  const { positions, colors, speeds } = useMemo(() => {
    const pos = new Float32Array(actualCount * 3);
    const cols = new Float32Array(actualCount * 3);
    const spd = new Float32Array(actualCount);

    const cyan = new THREE.Color('#38bdf8');
    const indigo = new THREE.Color('#818cf8');
    const violet = new THREE.Color('#c084fc');

    for (let i = 0; i < actualCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * radius * 2;
      pos[i * 3 + 1] = (Math.random() - 0.5) * radius * 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * radius * 2;

      const pick = Math.random();
      const col = pick < 0.33 ? cyan : pick < 0.66 ? indigo : violet;
      cols[i * 3] = col.r;
      cols[i * 3 + 1] = col.g;
      cols[i * 3 + 2] = col.b;

      spd[i] = 0.003 + Math.random() * 0.008;
    }
    return { positions: pos, colors: cols, speeds: spd };
  }, [actualCount, radius]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const t = clock.getElapsedTime();

    for (let i = 0; i < actualCount; i++) {
      const i3 = i * 3;
      posArray[i3 + 1] += Math.sin(t * speeds[i] * 8 + i) * 0.0015;
      posArray[i3] += Math.cos(t * speeds[i] * 6 + i * 0.5) * 0.0008;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={actualCount}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={actualCount}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        vertexColors
        transparent
        opacity={0.45}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
