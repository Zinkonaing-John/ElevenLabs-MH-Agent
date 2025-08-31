"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

interface ParticleProps {
  count: number;
  size?: number;
  color?: string;
  speed?: number;
}

function ParticleField({
  count = 200,
  size = 0.03,
  color = "#4f46e5",
  speed = 0.3,
}: ParticleProps) {
  const mesh = useRef<THREE.Points>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Generate random particles in a beautiful pattern
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      // Create a more organic, flowing pattern
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 15 + 5;
      const height = (Math.random() - 0.5) * 8;

      positions[i] = Math.cos(angle) * radius; // X
      positions[i + 1] = height; // Y
      positions[i + 2] = Math.sin(angle) * radius; // Z

      // Gentle velocities for smooth movement
      velocities[i] = (Math.random() - 0.5) * 0.005;
      velocities[i + 1] = (Math.random() - 0.5) * 0.003;
      velocities[i + 2] = (Math.random() - 0.5) * 0.005;
    }

    return { positions, velocities };
  }, [count]);

  // Handle mouse movement
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const { clientX, clientY } = event;
      const width = window.innerWidth;
      const height = window.innerHeight;

      setMousePosition({
        x: (clientX / width) * 2 - 1,
        y: -(clientY / height) * 2 + 1,
      });
    };

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseenter", handleMouseEnter);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseenter", handleMouseEnter);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // Animation loop
  useFrame((state) => {
    if (!mesh.current) return;

    const time = state.clock.getElapsedTime();
    const positions = mesh.current.geometry.attributes.position
      .array as Float32Array;

    for (let i = 0; i < count * 3; i += 3) {
      // Add mouse interaction
      const dx = mousePosition.x - positions[i] * 0.1;
      const dy = mousePosition.y - positions[i + 1] * 0.1;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 3 && isHovered) {
        // Gentle attraction to mouse
        positions[i] += dx * 0.008;
        positions[i + 1] += dy * 0.008;
      } else {
        // Natural floating motion
        positions[i] += Math.sin(time + i * 0.1) * 0.002;
        positions[i + 1] += Math.cos(time + i * 0.1) * 0.001;
      }

      // Boundary wrapping with gentle bounce
      if (Math.abs(positions[i]) > 20) positions[i] *= -0.95;
      if (Math.abs(positions[i + 1]) > 12) positions[i + 1] *= -0.95;
      if (Math.abs(positions[i + 2]) > 20) positions[i + 2] *= -0.95;
    }

    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <Points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles.positions, 3]}
        />
      </bufferGeometry>
      <PointMaterial
        transparent
        size={size}
        sizeAttenuation={true}
        depthWrite={false}
        color={color}
        opacity={0.6}
      />
    </Points>
  );
}

function Scene() {
  const { camera } = useThree();

  // Set up camera
  useEffect(() => {
    camera.position.z = 25;
    camera.lookAt(0, 0, 0);
  }, [camera]);

  // Gentle camera movement
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    camera.position.x = Math.sin(time * 0.05) * 1;
    camera.position.y = Math.cos(time * 0.07) * 0.5;
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <ambientLight intensity={0.8} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#4f46e5" />

      {/* Multiple particle fields with different behaviors */}
      <ParticleField count={300} size={0.04} color="#4f46e5" speed={0.2} />
      <ParticleField count={200} size={0.03} color="#7c3aed" speed={0.15} />
      <ParticleField count={150} size={0.05} color="#06b6d4" speed={0.25} />
      <ParticleField count={100} size={0.02} color="#10b981" speed={0.3} />
    </>
  );
}

interface ParticleSystemProps {
  className?: string;
}

export default function ParticleSystem({
  className = "",
}: ParticleSystemProps) {
  return (
    <div className={`fixed inset-0 pointer-events-none z-0 ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 25], fov: 60 }}
        style={{ background: "transparent" }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
