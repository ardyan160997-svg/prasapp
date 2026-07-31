"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float, Environment, Html } from "@react-three/drei";

export function Hero3DPlaceholder() {
  return (
    <Canvas
      camera={{ position: [0, 1.5, 4], fov: 45 }}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      style={{ width: "100%", height: "100%", maxWidth: "100%", display: "block" }}
    >
      <Float rotationIntensity={0.3} floatIntensity={0.5} speed={1.2}>
        <group>
          <Environment
            preset="city"
            background={false}
            ground={{ radius: 20, height: 0.1 }}
          />

          {/* Main creative cube - represents creative station */}
          <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[2, 1.5, 2]} />
            <meshStandardMaterial
              color="#facc15"
              metalness={0.1}
              roughness={0.3}
              transparent
              opacity={0.9}
            />
          </mesh>

          {/* Top accent */}
          <mesh position={[0, 1.5, 0]} castShadow>
            <cylinderGeometry args={[1.8, 1.2, 0.4, 16]} />
            <meshStandardMaterial color="#18181b" metalness={0.2} roughness={0.4} />
          </mesh>

          {/* Floating creative elements around */}
          <CreativeOrbit radius={3} count={6} />
        </group>
      </Float>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={true}
        autoRotateSpeed={0.5}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 2}
      />

      <Html
        position={[0, -2.5, 0]}
        style={{
          fontSize: "0.85rem",
          color: "#facc15",
          textAlign: "center",
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        Area 3D Prastation · Placeholder .glb/.gltf
      </Html>

      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 7]} intensity={1.2} castShadow />
      <directionalLight position={[-5, 5, -7]} intensity={0.5} />
    </Canvas>
  );
}

function CreativeOrbit({ radius = 3, count = 6 }) {
  const group = useRef<THREE.Group>(null);
  const [, forceUpdate] = useState(0);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.15;
    }
  });

  useEffect(() => {
    const interval = setInterval(() => forceUpdate((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const items = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const shapes = [
      <mesh key={`cube-${i}`} position={[x, 1.5, z]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#facc15" metalness={0.1} roughness={0.3} />
      </mesh>,
      <mesh key={`sphere-${i}`} position={[x, 0.8, z]} castShadow>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color="#18181b" metalness={0.2} roughness={0.4} />
      </mesh>,
      <mesh key={`cone-${i}`} position={[x, 2.2, z]} castShadow>
        <coneGeometry args={[0.3, 0.7, 16]} />
        <meshStandardMaterial color="#facc15" metalness={0.1} roughness={0.3} />
      </mesh>,
    ];
    return shapes[i % shapes.length];
  });

  return <group ref={group}>{items}</group>;
}