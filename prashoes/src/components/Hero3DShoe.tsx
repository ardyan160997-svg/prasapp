"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Float, Environment } from "@react-three/drei";

// Placeholder 3D shoe geometry using basic primitives
// Replace with a real .glb/.gltf model later using useGLTF
function ShoePlaceholder() {
  return (
    <group>
      {/* Sole */}
      <mesh position={[0, -0.3, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[2.2, 0.25, 1]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} />
      </mesh>
      {/* Upper shoe body */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[1.8, 0.5, 0.9]} />
        <meshStandardMaterial color="#facc15" roughness={0.3} metalness={0.1} />
      </mesh>
      {/* Toe box */}
      <mesh position={[-0.8, -0.05, 0]}>
        <sphereGeometry args={[0.45, 32, 32]} />
        <meshStandardMaterial color="#facc15" roughness={0.3} metalness={0.1} />
      </mesh>
      {/* Heel */}
      <mesh position={[0.75, 0.15, 0]}>
        <boxGeometry args={[0.4, 0.6, 0.85]} />
        <meshStandardMaterial color="#eab308" roughness={0.3} metalness={0.1} />
      </mesh>
    </group>
  );
}

export default function Hero3DShoe() {
  return (
    <section className="relative w-full py-16">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <p className="mb-2 text-sm font-medium uppercase tracking-widest text-yellow-300/70">
          Area 3D Sepatu
        </p>
        <p className="mb-8 text-xs text-zinc-500">
          Placeholder untuk model .glb/.gltf — akan diganti dengan model 3D
          asli
        </p>
        <div className="mx-auto h-[350px] w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.03] sm:h-[420px]">
          <Canvas
            camera={{ position: [3, 2, 5], fov: 40 }}
            gl={{ antialias: true }}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} intensity={1} />
            <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
              <ShoePlaceholder />
            </Float>
            <OrbitControls
              enableZoom={false}
              autoRotate
              autoRotateSpeed={2}
            />
            <Environment preset="city" />
          </Canvas>
        </div>
      </div>
    </section>
  );
}