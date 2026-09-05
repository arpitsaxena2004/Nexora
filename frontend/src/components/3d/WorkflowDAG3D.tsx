import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { ConnectionLine } from './ConnectionLine';
import { AICore } from './AICore';

export interface DAGTask3D {
  taskId: string;
  title: string;
  agent: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'approval_required';
  dependencies: string[];
  duration?: number;
  outputPreview?: string;
  layerIndex?: number;
  posIndex?: number;
}

interface WorkflowDAG3DProps {
  tasks: DAGTask3D[];
  selectedTaskId?: string | null;
  onSelectTask?: (task: DAGTask3D) => void;
  onGenerateSample?: () => void;
}

const STATUS_THEME: Record<string, { color: string; emissive: number; icon: string }> = {
  pending: { color: '#64748b', emissive: 0.4, icon: '⏳' },
  running: { color: '#06b6d4', emissive: 1.8, icon: '⚡' },
  completed: { color: '#10b981', emissive: 1.2, icon: '✓' },
  failed: { color: '#ef4444', emissive: 1.4, icon: '✕' },
  approval_required: { color: '#f59e0b', emissive: 1.6, icon: '🛡' },
};

// Single 3D DAG Task Node Pod
const TaskNode3D: React.FC<{
  task: DAGTask3D;
  position: [number, number, number];
  isSelected: boolean;
  onClick: () => void;
}> = ({ task, position, isSelected, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const haloRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  const theme = STATUS_THEME[task.status] || STATUS_THEME.pending;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();

    // Floating bob
    const floatY = Math.sin(t * 1.5 + position[0]) * 0.05;
    meshRef.current.position.y = position[1] + floatY;

    // Pulse animation for running/approval
    if (task.status === 'running') {
      const p = 1 + Math.sin(t * 4) * 0.15;
      meshRef.current.scale.setScalar(p * (hovered || isSelected ? 1.25 : 1.05));
    } else {
      meshRef.current.scale.setScalar(hovered || isSelected ? 1.2 : 1.0);
    }

    meshRef.current.rotation.y = t * 0.3;

    if (haloRef.current) {
      haloRef.current.position.y = position[1] + floatY;
      haloRef.current.rotation.z = t * 0.6;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 3D Geometry */}
      <mesh
        ref={meshRef}
        position={position}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
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
        <octahedronGeometry args={[0.24, 0]} />
        <meshStandardMaterial
          color={theme.color}
          emissive={theme.color}
          emissiveIntensity={hovered || isSelected ? 1.8 : theme.emissive}
          roughness={0.2}
          metalness={0.8}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* Orbiting Halo Ring */}
      <mesh ref={haloRef} position={position}>
        <torusGeometry args={[0.34, 0.01, 12, 32]} />
        <meshBasicMaterial
          color={theme.color}
          transparent
          opacity={hovered || isSelected ? 0.9 : task.status === 'running' ? 0.8 : 0.4}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 3D HTML Info Label */}
      <Html
        position={[position[0], position[1] - 0.45, position[2]]}
        center
        distanceFactor={8}
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <div
          className={`transition-all duration-200 transform ${
            hovered || isSelected ? 'scale-110 z-20' : 'scale-95 opacity-90'
          }`}
        >
          <div
            className="flex flex-col items-center gap-1 p-2 rounded-xl backdrop-blur-md border shadow-xl text-center min-w-[130px] max-w-[160px]"
            style={{
              backgroundColor: hovered || isSelected ? 'rgba(15, 23, 42, 0.95)' : 'rgba(9, 13, 22, 0.85)',
              borderColor: hovered || isSelected ? theme.color : `${theme.color}50`,
              boxShadow: isSelected ? `0 0 20px ${theme.color}80` : `0 4px 12px rgba(0,0,0,0.6)`,
            }}
          >
            <div className="flex items-center gap-1.5 w-full justify-center">
              <span className="text-xs">{theme.icon}</span>
              <span className="text-[11px] font-bold text-white truncate max-w-[110px]">{task.title}</span>
            </div>
            <div className="flex items-center gap-1 text-[9px] text-slate-300">
              <span className="px-1 py-0.2 rounded bg-white/10 font-mono">{task.agent}</span>
              <span
                className="uppercase font-bold px-1 rounded"
                style={{ backgroundColor: `${theme.color}20`, color: theme.color }}
              >
                {task.status}
              </span>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
};

export const WorkflowDAG3D: React.FC<WorkflowDAG3DProps> = ({
  tasks,
  selectedTaskId,
  onSelectTask,
  onGenerateSample,
}) => {
  // If tasks is empty, show a stunning 3D Standby Orchestrator Core with floating satellite rings!
  if (tasks.length === 0) {
    return (
      <group>
        <AICore intensity={0.9} scale={1.1} />
        <Html center position={[0, -1.5, 0]}>
          <div className="text-center p-3 rounded-2xl bg-surface-950/90 backdrop-blur-md border border-brand-500/30 shadow-2xl space-y-2 min-w-[220px]">
            <div className="text-xs font-bold text-slate-200">Neural Orchestrator Ready</div>
            <p className="text-[10px] text-slate-400">No active tasks in current pipeline</p>
            {onGenerateSample && (
              <button
                onClick={onGenerateSample}
                className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-[11px] font-bold shadow-glow transition-all"
              >
                Assemble Demo Pipeline ⚡
              </button>
            )}
          </div>
        </Html>
      </group>
    );
  }

  // Compute positions for tasks organized in 3D dependency layers
  const { nodePositions, connections } = useMemo(() => {
    const posMap = new Map<string, [number, number, number]>();
    const connList: Array<{
      start: [number, number, number];
      end: [number, number, number];
      active: boolean;
      color: string;
    }> = [];

    // Group tasks by layer
    const layers: DAGTask3D[][] = [];
    const taskMap = new Map<string, DAGTask3D>();
    tasks.forEach((t) => taskMap.set(t.taskId, t));

    // Simple layering algorithm
    const taskLayer = new Map<string, number>();
    const getLayer = (taskId: string, visited = new Set<string>()): number => {
      if (taskLayer.has(taskId)) return taskLayer.get(taskId)!;
      if (visited.has(taskId)) return 0;
      visited.add(taskId);

      const task = taskMap.get(taskId);
      if (!task || !task.dependencies || task.dependencies.length === 0) {
        taskLayer.set(taskId, 0);
        return 0;
      }

      let maxDepLayer = -1;
      for (const depId of task.dependencies) {
        maxDepLayer = Math.max(maxDepLayer, getLayer(depId, new Set(visited)));
      }
      const myLayer = maxDepLayer + 1;
      taskLayer.set(taskId, myLayer);
      return myLayer;
    };

    tasks.forEach((t) => getLayer(t.taskId));

    tasks.forEach((t) => {
      const l = taskLayer.get(t.taskId) || 0;
      if (!layers[l]) layers[l] = [];
      layers[l].push(t);
    });

    const totalLayers = Math.max(layers.length, 1);
    const layerSpacingX = 2.4;

    layers.forEach((layerTasks, lIndex) => {
      const x = (lIndex - (totalLayers - 1) / 2) * layerSpacingX;
      const count = layerTasks.length;
      layerTasks.forEach((task, pIndex) => {
        const y = (pIndex - (count - 1) / 2) * 1.5;
        const z = (Math.sin(lIndex + pIndex) * 0.4);
        posMap.set(task.taskId, [x, y, z]);
      });
    });

    // Build connections from dependencies
    tasks.forEach((task) => {
      const endPos = posMap.get(task.taskId);
      if (!endPos) return;

      (task.dependencies || []).forEach((depId) => {
        const startPos = posMap.get(depId);
        if (startPos) {
          const isFlowing = task.status === 'running' || taskMap.get(depId)?.status === 'running';
          connList.push({
            start: startPos,
            end: endPos,
            active: isFlowing,
            color: task.status === 'completed' ? '#10b981' : '#6366f1',
          });
        }
      });
    });

    return { nodePositions: posMap, connections: connList };
  }, [tasks]);

  return (
    <group>
      {/* Dependency Laser Lines */}
      {connections.map((c, idx) => (
        <ConnectionLine
          key={idx}
          start={c.start}
          end={c.end}
          active={c.active}
          color={c.color}
          particleSpeed={1.0}
        />
      ))}

      {/* 3D Task Pods */}
      {tasks.map((task) => {
        const pos = nodePositions.get(task.taskId) || [0, 0, 0];
        return (
          <TaskNode3D
            key={task.taskId}
            task={task}
            position={pos}
            isSelected={selectedTaskId === task.taskId}
            onClick={() => onSelectTask?.(task)}
          />
        );
      })}
    </group>
  );
};
