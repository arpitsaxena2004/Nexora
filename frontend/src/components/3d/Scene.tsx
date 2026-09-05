import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ParticleField } from './ParticleField';

interface SceneProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  orbit?: boolean;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  cameraPosition?: [number, number, number];
  particleCount?: number;
  showParticles?: boolean;
  enableZoom?: boolean;
}

// Loading fallback inside the canvas
const CanvasLoader: React.FC = () => {
  return (
    <mesh>
      <octahedronGeometry args={[0.4, 0]} />
      <meshStandardMaterial
        color="#6366f1"
        emissive="#818cf8"
        emissiveIntensity={0.8}
        wireframe
      />
    </mesh>
  );
};

// Error boundary for WebGL failures
class WebGLErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="w-full h-full flex items-center justify-center bg-surface-950/50 rounded-2xl border border-white/5">
            <div className="text-center space-y-2 p-8">
              <div className="text-3xl animate-pulse">⚡</div>
              <p className="text-xs text-slate-300 font-bold">3D Canvas Acceleration</p>
              <p className="text-[10px] text-slate-500">WebGL fallback mode active</p>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

export const Scene: React.FC<SceneProps> = ({
  children,
  className = '',
  style,
  orbit = true,
  autoRotate = true,
  autoRotateSpeed = 0.35,
  cameraPosition = [0, 0, 7.5],
  particleCount = 200,
  showParticles = true,
  enableZoom = false,
}) => {
  return (
    <WebGLErrorBoundary>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: cameraPosition, fov: 45 }}
        className={className}
        style={{ background: 'transparent', ...style }}
        gl={{ antialias: true, alpha: true, powerPreference: 'default' }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener(
            'webglcontextlost',
            (event) => {
              event.preventDefault();
            },
            false
          );
        }}
      >
        {/* Cinematic Studio Lighting */}
        <ambientLight intensity={0.4} color="#c7d2fe" />
        <pointLight position={[6, 6, 6]} intensity={1.5} color="#818cf8" />
        <pointLight position={[-6, -4, 4]} intensity={0.9} color="#06b6d4" />
        <pointLight position={[0, -6, -4]} intensity={0.6} color="#10b981" />
        <directionalLight position={[0, 10, 5]} intensity={0.5} color="#ffffff" />

        {/* Camera Controls */}
        {orbit && (
          <OrbitControls
            enableZoom={enableZoom}
            enablePan={false}
            autoRotate={autoRotate}
            autoRotateSpeed={autoRotateSpeed}
            maxPolarAngle={Math.PI / 1.4}
            minPolarAngle={Math.PI / 3.5}
            dampingFactor={0.05}
          />
        )}

        {/* Ambient cosmic particles */}
        {showParticles && <ParticleField count={particleCount} />}

        {/* Scene Children */}
        <Suspense fallback={<CanvasLoader />}>
          {children}
        </Suspense>
      </Canvas>
    </WebGLErrorBoundary>
  );
};
