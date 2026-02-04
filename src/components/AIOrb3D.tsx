"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface AIOrb3DProps {
    size?: number;
    color?: string;
    animated?: boolean;
}

export default function AIOrb3D({
    size = 200,
    color = '#00f5d4',
    animated = true
}: AIOrb3DProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const animationFrameRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        if (!containerRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // Camera
        const camera = new THREE.PerspectiveCamera(
            75,
            1, // aspect ratio (square)
            0.1,
            1000
        );
        camera.position.z = 3;

        // Renderer
        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true
        });
        renderer.setSize(size, size);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const pointLight1 = new THREE.PointLight(color, 1, 100);
        pointLight1.position.set(5, 5, 5);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight('#9b5de5', 0.8, 100);
        pointLight2.position.set(-5, -5, 5);
        scene.add(pointLight2);

        const pointLight3 = new THREE.PointLight('#ff206e', 0.6, 100);
        pointLight3.position.set(0, 5, -5);
        scene.add(pointLight3);

        // Create the main orb sphere
        const geometry = new THREE.SphereGeometry(1, 64, 64);

        // Create custom shader material for glowing effect
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                colorPrimary: { value: new THREE.Color(color) },
                colorSecondary: { value: new THREE.Color('#9b5de5') },
                colorTertiary: { value: new THREE.Color('#ff206e') }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                uniform float time;

                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;

                    // Add subtle wave animation
                    vec3 pos = position;
                    float wave = sin(pos.y * 3.0 + time) * 0.02;
                    pos += normal * wave;

                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 colorPrimary;
                uniform vec3 colorSecondary;
                uniform vec3 colorTertiary;
                uniform float time;
                varying vec3 vNormal;
                varying vec3 vPosition;

                void main() {
                    // Fresnel effect
                    vec3 viewDirection = normalize(cameraPosition - vPosition);
                    float fresnel = pow(1.0 - dot(viewDirection, vNormal), 3.0);

                    // Animated color mixing
                    float mixFactor1 = sin(time * 0.5 + vPosition.y * 2.0) * 0.5 + 0.5;
                    float mixFactor2 = cos(time * 0.3 + vPosition.x * 2.0) * 0.5 + 0.5;

                    vec3 color1 = mix(colorPrimary, colorSecondary, mixFactor1);
                    vec3 finalColor = mix(color1, colorTertiary, mixFactor2);

                    // Add glow
                    vec3 glow = finalColor * fresnel * 2.0;

                    // Combine base color and glow
                    vec3 result = finalColor * 0.6 + glow;

                    gl_FragColor = vec4(result, 0.9);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });

        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);

        // Add inner glow sphere
        const innerGlowGeometry = new THREE.SphereGeometry(0.92, 32, 32);
        const innerGlowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        const innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
        scene.add(innerGlow);

        // Add outer glow
        const outerGlowGeometry = new THREE.SphereGeometry(1.15, 32, 32);
        const outerGlowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.1,
            side: THREE.FrontSide
        });
        const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
        scene.add(outerGlow);

        // Add particles around the orb
        const particleCount = 100;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 2;
            const radius = 1.5 + Math.random() * 0.5;

            particlePositions[i * 3] = radius * Math.sin(theta) * Math.cos(phi);
            particlePositions[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
            particlePositions[i * 3 + 2] = radius * Math.cos(theta);
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

        const particleMaterial = new THREE.PointsMaterial({
            color: color,
            size: 0.05,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(particles);

        // Animation
        let time = 0;
        const animate = () => {
            if (!animated) return;

            animationFrameRef.current = requestAnimationFrame(animate);
            time += 0.01;

            // Update shader uniforms
            if (material.uniforms) {
                material.uniforms.time.value = time;
            }

            // Rotate the main sphere
            sphere.rotation.y += 0.002;
            sphere.rotation.x += 0.001;

            // Rotate glows in opposite directions
            innerGlow.rotation.y -= 0.003;
            outerGlow.rotation.x += 0.002;

            // Rotate particles
            particles.rotation.y += 0.001;
            particles.rotation.x -= 0.0005;

            // Animate point lights
            pointLight1.position.x = Math.sin(time * 0.5) * 5;
            pointLight1.position.y = Math.cos(time * 0.3) * 5;

            pointLight2.position.x = Math.cos(time * 0.4) * 5;
            pointLight2.position.z = Math.sin(time * 0.6) * 5;

            renderer.render(scene, camera);
        };

        animate();

        // Handle window resize
        const handleResize = () => {
            if (!containerRef.current || !renderer) return;

            const newSize = Math.min(size, containerRef.current.clientWidth);
            camera.aspect = 1;
            camera.updateProjectionMatrix();
            renderer.setSize(newSize, newSize);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);

            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }

            // Store ref in variable to avoid stale closure warning
            const container = containerRef.current;
            if (container && renderer.domElement) {
                container.removeChild(renderer.domElement);
            }

            // Dispose of Three.js objects
            geometry.dispose();
            material.dispose();
            innerGlowGeometry.dispose();
            innerGlowMaterial.dispose();
            outerGlowGeometry.dispose();
            outerGlowMaterial.dispose();
            particleGeometry.dispose();
            particleMaterial.dispose();
            renderer.dispose();
        };
    }, [size, color, animated]);

    return (
        <div
            ref={containerRef}
            className="relative"
            style={{
                width: size,
                height: size,
                margin: '0 auto'
            }}
        />
    );
}
