import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ConnectionLineProps {
  start: [number, number, number];
  end: [number, number, number];
  active?: boolean;
  color?: string;
  particleSpeed?: number;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({
  start,
  end,
  active = false,
  color = '#6366f1',
  particleSpeed = 0.8,
}) => {
  const particlesRef = useRef<THREE.Group>(null!);

  const activeColor = active ? '#06b6d4' : color;

  const geometry = useMemo(() => {
    const points = [];
    const segments = 24;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = start[0] + (end[0] - start[0]) * t;
      const y = start[1] + (end[1] - start[1]) * t;
      const z = start[2] + (end[2] - start[2]) * t;
      // Parabolic subtle arc
      const arc = Math.sin(t * Math.PI) * 0.2;
      points.push(new THREE.Vector3(x, y + arc, z));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [start, end]);

  // Data flow energy packet offsets
  const packetCount = active ? 5 : 2;
  const packetOffsets = useMemo(() => {
    return Array.from({ length: packetCount }, (_, i) => i / packetCount);
  }, [packetCount]);

  useFrame(({ clock }) => {
    if (!particlesRef.current) return;
    const t = clock.getElapsedTime() * particleSpeed;

    particlesRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const progress = (t + packetOffsets[i]) % 1;
      const x = start[0] + (end[0] - start[0]) * progress;
      const y = start[1] + (end[1] - start[1]) * progress + Math.sin(progress * Math.PI) * 0.2;
      const z = start[2] + (end[2] - start[2]) * progress;
      mesh.position.set(x, y, z);

      // Fade smoothly near endpoints
      const fade = Math.sin(progress * Math.PI);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = active ? fade * 0.95 : fade * 0.4;
      mesh.scale.setScalar(0.7 + fade * 0.5);
    });
  });

  const lineObject = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({
      color: activeColor,
      transparent: true,
      opacity: active ? 0.65 : 0.22,
      blending: THREE.AdditiveBlending,
    });
    return new THREE.Line(geometry, mat);
  }, [geometry, activeColor, active]);

  return (
    <group>
      {/* Curved laser line */}
      <primitive object={lineObject} />

      {/* Streaming glowing photon packets */}
      <group ref={particlesRef}>
        {packetOffsets.map((_, i) => (
          <mesh key={i} position={start}>
            <sphereGeometry args={[0.038, 12, 12]} />
            <meshBasicMaterial
              color={active ? '#22d3ee' : color}
              transparent
              opacity={0.8}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
};
