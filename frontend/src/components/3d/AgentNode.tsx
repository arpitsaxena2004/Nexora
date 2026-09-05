import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed' | 'approval_required';

interface AgentNodeProps {
  name: string;
  displayName: string;
  position: [number, number, number];
  status?: AgentStatus;
  category?: string;
  isSelected?: boolean;
  onClick?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  career: '#06b6d4',
  startup: '#10b981',
  core: '#8b5cf6',
  default: '#6366f1',
};

export const AgentNode: React.FC<AgentNodeProps> = ({
  name,
  displayName,
  position,
  status = 'idle',
  category = 'core',
  isSelected = false,
  onClick,
}) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);
  const haloPingRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const [floatState, setFloatState] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Outward direction from center (0,0)
  const { dirX, dirY } = useMemo(() => {
    const dist = Math.hypot(position[0], position[1]) || 1;
    return { dirX: position[0] / dist, dirY: position[1] / dist };
  }, [position]);

  // Determine base and accent colors
  const themeColor = useMemo(() => {
    if (status === 'running') return '#06b6d4';
    if (status === 'completed') return '#10b981';
    if (status === 'failed') return '#ef4444';
    if (status === 'approval_required') return '#f59e0b';
    return CATEGORY_COLORS[category] || '#818cf8';
  }, [status, category]);

  const emissivePower = useMemo(() => {
    if (hovered || isSelected) return 1.8;
    if (status === 'running') return 1.6;
    if (status === 'completed') return 1.2;
    if (status === 'approval_required') return 1.4;
    return 0.7;
  }, [status, hovered, isSelected]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Gentle organic floating levitation (independent from globe rotation)
    const floatY = Math.sin(t * 1.3 + position[0] * 1.7 + position[1]) * 0.08;
    const floatX = Math.cos(t * 1.0 + position[1] * 1.4 + position[0]) * 0.04;
    setFloatState({ x: floatX, y: floatY });

    if (meshRef.current) {
      meshRef.current.position.set(position[0] + floatX, position[1] + floatY, position[2]);

      // Pulse scale when running or hovered
      if (status === 'running') {
        const pulse = 1 + Math.sin(t * 3.5) * 0.12;
        meshRef.current.scale.setScalar(pulse * (hovered || isSelected ? 1.2 : 1.05));
      } else if (status === 'completed') {
        const pulse = 1 + Math.sin(t * 1.8) * 0.05;
        meshRef.current.scale.setScalar(pulse * (hovered || isSelected ? 1.18 : 1.0));
      } else {
        meshRef.current.scale.setScalar(hovered || isSelected ? 1.2 : 1.0);
      }

      // Polyhedral slow spin
      meshRef.current.rotation.y = t * 0.4;
      meshRef.current.rotation.x = Math.sin(t * 0.3) * 0.2;
    }

    // Spin outer halo ring
    if (ringRef.current) {
      ringRef.current.position.set(position[0] + floatX, position[1] + floatY, position[2]);
      ringRef.current.rotation.z = t * 0.8;
      ringRef.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.5) * 0.2;
    }

    if (haloPingRef.current) {
      haloPingRef.current.position.set(position[0] + floatX, position[1] + floatY, position[2]);
    }
  });

  return (
    <group>
      {/* 3D Polyhedral Node */}
      <mesh
        ref={meshRef}
        position={position}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        onPointerOver={() => {
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <dodecahedronGeometry args={[0.15, 0]} />
        <meshStandardMaterial
          color={themeColor}
          emissive={themeColor}
          emissiveIntensity={emissivePower}
          roughness={0.2}
          metalness={0.8}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Orbiting Halo Ring */}
      <mesh ref={ringRef} position={position}>
        <torusGeometry args={[0.22, 0.006, 12, 36]} />
        <meshBasicMaterial
          color={themeColor}
          transparent
          opacity={hovered || isSelected ? 0.9 : status === 'running' ? 0.75 : 0.35}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Outer Status Ping Ring for Running / Approvals */}
      {(status === 'running' || status === 'approval_required' || isSelected) && (
        <mesh ref={haloPingRef} position={position}>
          <ringGeometry args={[0.25, 0.29, 32]} />
          <meshBasicMaterial
            color={themeColor}
            transparent
            opacity={0.25}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Floating Holographic HTML Name Badge */}
      <Html
        position={[
          position[0] + floatState.x + dirX * 0.32,
          position[1] + floatState.y + dirY * 0.32,
          position[2] + 0.05,
        ]}
        center
        distanceFactor={8.5}
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
          transition: 'transform 0.15s ease-out',
        }}
      >
        <div
          className={`text-center transition-transform duration-200 ${
            hovered || isSelected ? 'scale-110 z-30' : 'scale-100'
          }`}
        >
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md backdrop-blur-md border shadow-md text-[10px] font-bold whitespace-nowrap"
            style={{
              backgroundColor: hovered || isSelected ? 'rgba(15, 23, 42, 0.95)' : 'rgba(9, 13, 22, 0.85)',
              borderColor: hovered || isSelected ? themeColor : `${themeColor}40`,
              boxShadow: hovered || isSelected ? `0 0 12px ${themeColor}60` : `0 2px 4px rgba(0,0,0,0.4)`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{
                backgroundColor: themeColor,
                boxShadow: `0 0 5px ${themeColor}`,
              }}
            />
            <span className="text-slate-100 font-bold tracking-tight">{displayName}</span>
            {status !== 'idle' && (
              <span
                className="text-[8px] uppercase px-1 rounded font-bold"
                style={{
                  backgroundColor: `${themeColor}25`,
                  color: themeColor,
                }}
              >
                {status}
              </span>
            )}
          </div>
        </div>
      </Html>
    </group>
  );
};
