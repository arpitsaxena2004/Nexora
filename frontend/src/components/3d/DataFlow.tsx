import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DataFlowProps {
  start: [number, number, number];
  end: [number, number, number];
  speed?: number;
  active?: boolean;
  color?: string;
}

export const DataFlow: React.FC<DataFlowProps> = ({
  start,
  end,
  speed = 0.4,
  active = true,
  color = '#06b6d4',
}) => {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (!meshRef.current || !active) return;
    const t = clock.getElapsedTime();
    const progress = (t * speed) % 1;
    const x = start[0] + (end[0] - start[0]) * progress;
    const y = start[1] + (end[1] - start[1]) * progress + Math.sin(progress * Math.PI) * 0.1;
    const z = start[2] + (end[2] - start[2]) * progress;
    meshRef.current.position.set(x, y, z);

    // Scale pulse at midpoint
    const scaleFactor = 0.8 + Math.sin(progress * Math.PI) * 0.4;
    meshRef.current.scale.setScalar(scaleFactor);

    // Fade at edges
    const material = meshRef.current.material as THREE.MeshBasicMaterial;
    material.opacity = Math.sin(progress * Math.PI) * 0.9;
  });

  if (!active) return null;

  return (
    <mesh ref={meshRef} position={start}>
      <sphereGeometry args={[0.04, 8, 8]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};
