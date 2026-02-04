import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';

// ============================================================================
// CUSTOM SHADERS
// ============================================================================

// Neural Network Shader for AI Brain Core
const neuralShaderMaterial = {
  uniforms: {
    time: { value: 0 },
    color1: { value: new THREE.Color('#00f5d4') },
    color2: { value: new THREE.Color('#9b5de5') },
    color3: { value: new THREE.Color('#ff206e') },
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    uniform float time;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      vUv = uv;

      // Add subtle pulsing displacement
      vec3 newPosition = position + normal * sin(time * 2.0 + position.y * 3.0) * 0.05;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform vec3 color1;
    uniform vec3 color2;
    uniform vec3 color3;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;

    void main() {
      // Neural network pattern
      float pattern = sin(vPosition.x * 10.0 + time) * sin(vPosition.y * 10.0 + time * 0.5) * sin(vPosition.z * 10.0 + time * 0.3);

      // Fresnel effect for edge glow
      float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);

      // Color mixing based on position and time
      vec3 color = mix(color1, color2, sin(time * 0.5 + vPosition.y) * 0.5 + 0.5);
      color = mix(color, color3, pattern * 0.3 + 0.3);

      // Add fresnel glow
      color += fresnel * color1 * 0.8;

      // Pulsing effect
      float pulse = sin(time * 2.0) * 0.2 + 0.8;
      color *= pulse;

      gl_FragColor = vec4(color, 0.9);
    }
  `,
};

// Energy Flow Shader for particle streams (reserved for future use)
// Uncomment and use when implementing energy stream effects
// const energyFlowShader = {
//   uniforms: {
//     time: { value: 0 },
//     color: { value: new THREE.Color('#00f5d4') },
//   },
//   vertexShader: `
//     varying vec2 vUv;
//     void main() {
//       vUv = uv;
//       gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
//     }
//   `,
//   fragmentShader: `
//     uniform float time;
//     uniform vec3 color;
//     varying vec2 vUv;
//
//     void main() {
//       // Flowing energy effect
//       float flow = sin(vUv.y * 10.0 - time * 3.0) * 0.5 + 0.5;
//       float alpha = flow * (1.0 - vUv.y);
//
//       gl_FragColor = vec4(color, alpha);
//     }
//   `,
// };

// ============================================================================
// COMPONENTS
// ============================================================================

// AI Neural Core - The intelligent brain at the center
function NeuralCore() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const neuronGroupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }

    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }

    if (neuronGroupRef.current) {
      neuronGroupRef.current.rotation.y += 0.005;
      neuronGroupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  useEffect(() => {
    if (meshRef.current) {
      gsap.fromTo(
        meshRef.current.scale,
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 1, z: 1, duration: 2, ease: 'elastic.out(1, 0.5)', delay: 0.5 }
      );
    }
  }, []);

  return (
    <group>
      {/* Central Neural Sphere */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.2, 4]} />
        <shaderMaterial
          ref={materialRef}
          {...neuralShaderMaterial}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Inner glow sphere */}
      <mesh scale={0.95}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshBasicMaterial color="#00f5d4" transparent opacity={0.1} side={THREE.BackSide} />
      </mesh>

      {/* Outer glow rings */}
      {[1.5, 1.7, 1.9].map((scale, i) => (
        <mesh key={`glow-${i}`} scale={scale}>
          <sphereGeometry args={[1.2, 16, 16]} />
          <meshBasicMaterial
            color={i === 0 ? '#00f5d4' : i === 1 ? '#9b5de5' : '#ff206e'}
            transparent
            opacity={0.05 - i * 0.01}
            side={THREE.BackSide}
            wireframe
          />
        </mesh>
      ))}

      {/* Neural Connection Nodes */}
      <group ref={neuronGroupRef}>
        {Array.from({ length: 24 }).map((_, i) => {
          const theta = (i / 24) * Math.PI * 2;
          const phi = Math.acos(2 * (i / 24) - 1);
          const radius = 2.2;

          return (
            <group
              key={`neuron-${i}`}
              position={[
                radius * Math.sin(phi) * Math.cos(theta),
                radius * Math.sin(phi) * Math.sin(theta),
                radius * Math.cos(phi),
              ]}
            >
              <mesh>
                <sphereGeometry args={[0.05, 8, 8]} />
                <meshBasicMaterial color="#00f5d4" />
              </mesh>
              <pointLight intensity={0.5} distance={1} color="#00f5d4" />
            </group>
          );
        })}
      </group>
    </group>
  );
}

// Orbiting Vault - Represents different liquidity strategies
function OrbitingVault({
  position,
  color,
  delay = 0,
  radius = 5,
  speed = 1,
}: {
  position: number;
  color: string;
  delay?: number;
  radius?: number;
  speed?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const vaultRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      const angle = state.clock.elapsedTime * speed * 0.3 + position;
      groupRef.current.position.x = Math.cos(angle) * radius;
      groupRef.current.position.z = Math.sin(angle) * radius;
      groupRef.current.position.y = Math.sin(angle * 0.5) * 1.5;
    }

    if (vaultRef.current) {
      vaultRef.current.rotation.x += 0.01;
      vaultRef.current.rotation.y += 0.015;
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.02;
    }
  });

  useEffect(() => {
    if (vaultRef.current) {
      gsap.fromTo(
        vaultRef.current.scale,
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 1, z: 1, duration: 1.5, delay, ease: 'back.out(1.7)' }
      );
    }
  }, [delay]);

  return (
    <group ref={groupRef}>
      {/* Vault Sphere with glassmorphic effect */}
      <mesh ref={vaultRef}>
        <dodecahedronGeometry args={[0.6, 0]} />
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.8}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* Outer glass shell */}
      <mesh scale={1.15}>
        <dodecahedronGeometry args={[0.6, 0]} />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={0.15}
          metalness={0.1}
          roughness={0.1}
          transmission={0.9}
          thickness={0.5}
        />
      </mesh>

      {/* Orbiting particles around vault */}
      <group ref={particlesRef}>
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const particleRadius = 1.2;
          return (
            <mesh
              key={i}
              position={[
                Math.cos(angle) * particleRadius,
                Math.sin(angle * 2) * 0.3,
                Math.sin(angle) * particleRadius,
              ]}
            >
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshBasicMaterial color={color} transparent opacity={0.8} />
            </mesh>
          );
        })}
      </group>

      {/* Glow effect */}
      <pointLight intensity={2} distance={3} color={color} />
    </group>
  );
}

// Instanced Energy Particles - Optimized particle system
function EnergyParticles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particleCount = 300;

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < particleCount; i++) {
      temp.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          Math.random() * 0.03,
          (Math.random() - 0.5) * 0.02
        ),
        scale: Math.random() * 0.5 + 0.5,
        color: new THREE.Color(
          Math.random() > 0.5 ? '#00f5d4' : Math.random() > 0.5 ? '#9b5de5' : '#ff206e'
        ),
      });
    }
    return temp;
  }, []);

  useFrame(() => {
    if (meshRef.current) {
      const matrix = new THREE.Matrix4();

      particles.forEach((particle, i) => {
        // Update position
        particle.position.add(particle.velocity);

        // Boundary check and reset
        if (particle.position.y > 10) {
          particle.position.y = -10;
        }
        if (Math.abs(particle.position.x) > 10) {
          particle.position.x = (Math.random() - 0.5) * 20;
        }
        if (Math.abs(particle.position.z) > 10) {
          particle.position.z = (Math.random() - 0.5) * 20;
        }

        // Apply matrix
        matrix.setPosition(particle.position);
        matrix.scale(new THREE.Vector3(particle.scale, particle.scale, particle.scale));
        meshRef.current!.setMatrixAt(i, matrix);
        meshRef.current!.setColorAt(i, particle.color);
      });

      meshRef.current.instanceMatrix.needsUpdate = true;
      if (meshRef.current.instanceColor) {
        meshRef.current.instanceColor.needsUpdate = true;
      }
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]}>
      <sphereGeometry args={[0.03, 8, 8]} />
      <meshBasicMaterial transparent opacity={0.6} />
    </instancedMesh>
  );
}

// Data Flow Streams - Connection lines between core and vaults
function DataFlowStreams() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: 4 }).map((_, i) => {
        const angle = (i / 4) * Math.PI * 2;
        const radius = 5;

        return (
          <group key={`stream-${i}`}>
            <mesh
              position={[
                Math.cos(angle) * (radius / 2),
                0,
                Math.sin(angle) * (radius / 2),
              ]}
              rotation={[0, -angle, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.01, 0.01, radius, 8]} />
              <meshBasicMaterial
                color={i % 2 === 0 ? '#00f5d4' : '#9b5de5'}
                transparent
                opacity={0.3}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// Holographic Grid - Advanced background
function HolographicGrid() {
  const gridRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (gridRef.current) {
      gridRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
      gridRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.05) * 0.1;
    }
  });

  return (
    <group ref={gridRef} position={[0, 0, -8]}>
      {/* Horizontal lines */}
      {Array.from({ length: 15 }).map((_, i) => (
        <mesh key={`h-${i}`} position={[0, (i - 7) * 1.5, 0]}>
          <boxGeometry args={[25, 0.01, 0.01]} />
          <meshBasicMaterial color="#00f5d4" transparent opacity={0.08} />
        </mesh>
      ))}
      {/* Vertical lines */}
      {Array.from({ length: 15 }).map((_, i) => (
        <mesh key={`v-${i}`} position={[(i - 7) * 1.5, 0, 0]}>
          <boxGeometry args={[0.01, 20, 0.01]} />
          <meshBasicMaterial color="#9b5de5" transparent opacity={0.08} />
        </mesh>
      ))}
      {/* Central ring */}
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[8, 0.02, 16, 100]} />
        <meshBasicMaterial color="#ff206e" transparent opacity={0.1} />
      </mesh>
    </group>
  );
}

// Mouse tracking for interactive parallax
function MouseTracker() {
  const { camera } = useThree();

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;

      gsap.to(camera.position, {
        x: x * 0.5,
        y: y * 0.3 + 1,
        duration: 1.5,
        ease: 'power2.out',
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [camera]);

  return null;
}

// Main Scene Component
function Scene() {
  return (
    <>
      {/* Lighting setup */}
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#00f5d4" />
      <pointLight position={[-10, -10, -10]} intensity={1} color="#9b5de5" />
      <pointLight position={[0, 10, -10]} intensity={0.8} color="#ff206e" />
      <spotLight
        position={[0, 15, 0]}
        intensity={1.5}
        angle={Math.PI / 6}
        penumbra={1}
        color="#00f5d4"
        castShadow
      />

      {/* Background */}
      <HolographicGrid />

      {/* Central AI Neural Core */}
      <NeuralCore />

      {/* Data Flow Streams */}
      <DataFlowStreams />

      {/* Orbiting Vaults - Represents different yield strategies */}
      <OrbitingVault position={0} color="#00f5d4" delay={0.5} radius={5} speed={1} />
      <OrbitingVault position={Math.PI / 2} color="#9b5de5" delay={0.8} radius={5.5} speed={0.8} />
      <OrbitingVault position={Math.PI} color="#ff206e" delay={1.1} radius={5} speed={1.2} />
      <OrbitingVault position={(3 * Math.PI) / 2} color="#fbae3c" delay={1.4} radius={5.5} speed={0.9} />

      {/* Energy Particles */}
      <EnergyParticles />

      {/* Mouse tracking for parallax */}
      <MouseTracker />
    </>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Hero3D() {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scene entrance animation
    if (canvasRef.current) {
      gsap.fromTo(
        canvasRef.current,
        { opacity: 0, scale: 0.95, filter: 'blur(10px)' },
        { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 2, ease: 'power3.out' }
      );
    }
  }, []);

  return (
    <div
      ref={canvasRef}
      className="w-full h-full relative min-h-full"
      style={{ minHeight: 'inherit' }}
    >
      <Canvas
        camera={{ position: [0, 1, 8], fov: 60 }}
        style={{ background: 'transparent', width: '100%', height: '100%', minHeight: 'inherit' }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]} // Responsive pixel ratio for performance
      >
        <Scene />
      </Canvas>

      {/* Subtle overlay gradient for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.2) 100%)',
        }}
      />
    </div>
  );
}
