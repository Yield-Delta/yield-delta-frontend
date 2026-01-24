#!/usr/bin/env python3
"""
Generate a 3D AI Orb model using Blender Python API

Requirements:
    pip install bpy (Blender as a Python module)
    or run this script inside Blender's text editor

Usage:
    # Inside Blender:
    python generate_orb_model.py

    # Or run Blender headless:
    blender --background --python generate_orb_model.py

Output:
    - orb_model.glb (optimized for Three.js)
    - orb_model.fbx (alternative format)
"""

import bpy
import math
import os

def clear_scene():
    """Remove all objects from the scene"""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

def create_ai_orb():
    """Create a sophisticated AI orb with multiple layers"""

    # Clear existing scene
    clear_scene()

    # ===== MAIN ORB SPHERE =====
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=64,
        ring_count=32,
        radius=1.0,
        location=(0, 0, 0)
    )
    main_orb = bpy.context.active_object
    main_orb.name = "MainOrb"

    # Create glass-like material for main orb
    main_mat = bpy.data.materials.new(name="OrbMaterial")
    main_mat.use_nodes = True
    main_orb.data.materials.append(main_mat)

    nodes = main_mat.node_tree.nodes
    nodes.clear()

    # Material nodes setup
    output = nodes.new('ShaderNodeOutputMaterial')
    glass = nodes.new('ShaderNodeBsdfGlass')
    emission = nodes.new('ShaderNodeEmission')
    mix_shader = nodes.new('ShaderNodeMixShader')
    color_ramp = nodes.new('ShaderNodeValToRGB')
    fresnel = nodes.new('ShaderNodeFresnel')

    # Configure Fresnel for edge glow
    fresnel.inputs['IOR'].default_value = 1.45

    # Configure emission color (cyan/teal)
    emission.inputs['Color'].default_value = (0.0, 0.96, 0.83, 1.0)  # #00f5d4
    emission.inputs['Strength'].default_value = 2.0

    # Configure glass
    glass.inputs['Color'].default_value = (0.0, 0.96, 0.83, 1.0)
    glass.inputs['Roughness'].default_value = 0.1
    glass.inputs['IOR'].default_value = 1.45

    # Connect nodes
    links = main_mat.node_tree.links
    links.new(fresnel.outputs['Fac'], mix_shader.inputs['Fac'])
    links.new(glass.outputs['BSDF'], mix_shader.inputs[1])
    links.new(emission.outputs['Emission'], mix_shader.inputs[2])
    links.new(mix_shader.outputs['Shader'], output.inputs['Surface'])

    # ===== INNER GLOW SPHERE =====
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=32,
        ring_count=16,
        radius=0.85,
        location=(0, 0, 0)
    )
    inner_glow = bpy.context.active_object
    inner_glow.name = "InnerGlow"

    # Inner glow material (emissive)
    inner_mat = bpy.data.materials.new(name="InnerGlowMaterial")
    inner_mat.use_nodes = True
    inner_glow.data.materials.append(inner_mat)

    inner_nodes = inner_mat.node_tree.nodes
    inner_nodes.clear()

    inner_output = inner_nodes.new('ShaderNodeOutputMaterial')
    inner_emission = inner_nodes.new('ShaderNodeEmission')
    inner_transparent = inner_nodes.new('ShaderNodeBsdfTransparent')
    inner_mix = inner_nodes.new('ShaderNodeMixShader')
    inner_gradient = inner_nodes.new('ShaderNodeTexGradient')

    # Gradient texture for color variation
    inner_emission.inputs['Color'].default_value = (0.61, 0.36, 0.90, 1.0)  # #9b5de5
    inner_emission.inputs['Strength'].default_value = 1.5

    inner_links = inner_mat.node_tree.links
    inner_links.new(inner_gradient.outputs['Fac'], inner_mix.inputs['Fac'])
    inner_links.new(inner_transparent.outputs['BSDF'], inner_mix.inputs[1])
    inner_links.new(inner_emission.outputs['Emission'], inner_mix.inputs[2])
    inner_links.new(inner_mix.outputs['Shader'], inner_output.inputs['Surface'])

    # ===== OUTER RING 1 =====
    bpy.ops.mesh.primitive_torus_add(
        major_radius=1.5,
        minor_radius=0.05,
        location=(0, 0, 0),
        rotation=(math.radians(90), 0, 0)
    )
    ring1 = bpy.context.active_object
    ring1.name = "Ring1"

    # Ring material
    ring_mat = bpy.data.materials.new(name="RingMaterial")
    ring_mat.use_nodes = True
    ring1.data.materials.append(ring_mat)

    ring_nodes = ring_mat.node_tree.nodes
    ring_nodes.clear()

    ring_output = ring_nodes.new('ShaderNodeOutputMaterial')
    ring_emission = ring_nodes.new('ShaderNodeEmission')

    ring_emission.inputs['Color'].default_value = (1.0, 0.13, 0.43, 1.0)  # #ff206e
    ring_emission.inputs['Strength'].default_value = 3.0

    ring_links = ring_mat.node_tree.links
    ring_links.new(ring_emission.outputs['Emission'], ring_output.inputs['Surface'])

    # ===== OUTER RING 2 (ROTATED) =====
    bpy.ops.mesh.primitive_torus_add(
        major_radius=1.7,
        minor_radius=0.03,
        location=(0, 0, 0),
        rotation=(math.radians(45), math.radians(45), 0)
    )
    ring2 = bpy.context.active_object
    ring2.name = "Ring2"
    ring2.data.materials.append(ring_mat)

    # ===== PARTICLES/DOTS =====
    for i in range(20):
        theta = (i / 20) * 2 * math.pi
        phi = math.sin(i * 0.5) * math.pi
        radius = 2.0

        x = radius * math.sin(theta) * math.cos(phi)
        y = radius * math.sin(theta) * math.sin(phi)
        z = radius * math.cos(theta)

        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=8,
            ring_count=8,
            radius=0.05,
            location=(x, y, z)
        )
        particle = bpy.context.active_object
        particle.name = f"Particle_{i}"

        # Random color for each particle
        particle_mat = bpy.data.materials.new(name=f"ParticleMat_{i}")
        particle_mat.use_nodes = True
        particle.data.materials.append(particle_mat)

        p_nodes = particle_mat.node_tree.nodes
        p_nodes.clear()

        p_output = p_nodes.new('ShaderNodeOutputMaterial')
        p_emission = p_nodes.new('ShaderNodeEmission')

        # Alternate between the three colors
        colors = [
            (0.0, 0.96, 0.83, 1.0),   # cyan
            (0.61, 0.36, 0.90, 1.0),  # purple
            (1.0, 0.13, 0.43, 1.0)    # pink
        ]
        p_emission.inputs['Color'].default_value = colors[i % 3]
        p_emission.inputs['Strength'].default_value = 2.0

        p_links = particle_mat.node_tree.links
        p_links.new(p_emission.outputs['Emission'], p_output.inputs['Surface'])

    # ===== LIGHTING =====
    # Add point lights
    bpy.ops.object.light_add(type='POINT', location=(3, 3, 3))
    light1 = bpy.context.active_object
    light1.data.energy = 500
    light1.data.color = (0.0, 0.96, 0.83)  # cyan

    bpy.ops.object.light_add(type='POINT', location=(-3, -3, 3))
    light2 = bpy.context.active_object
    light2.data.energy = 400
    light2.data.color = (0.61, 0.36, 0.90)  # purple

    bpy.ops.object.light_add(type='POINT', location=(0, 3, -3))
    light3 = bpy.context.active_object
    light3.data.energy = 300
    light3.data.color = (1.0, 0.13, 0.43)  # pink

    # ===== CAMERA =====
    bpy.ops.object.camera_add(location=(0, -5, 0))
    camera = bpy.context.active_object
    camera.rotation_euler = (math.radians(90), 0, 0)
    bpy.context.scene.camera = camera

    # ===== RENDER SETTINGS =====
    bpy.context.scene.render.engine = 'CYCLES'
    bpy.context.scene.cycles.samples = 128
    bpy.context.scene.render.film_transparent = True

    print("✓ AI Orb model created successfully!")

def export_model():
    """Export the model in multiple formats"""

    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(script_dir, "..", "yield-delta-frontend", "public", "models")

    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)

    # Select all objects
    bpy.ops.object.select_all(action='SELECT')

    # Export as GLB (recommended for Three.js)
    glb_path = os.path.join(output_dir, "ai_orb.glb")
    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format='GLB',
        export_lights=True,
        export_cameras=False,
        export_apply=True
    )
    print(f"✓ Exported GLB to: {glb_path}")

    # Export as FBX (alternative)
    fbx_path = os.path.join(output_dir, "ai_orb.fbx")
    bpy.ops.export_scene.fbx(
        filepath=fbx_path,
        use_selection=True,
        global_scale=1.0
    )
    print(f"✓ Exported FBX to: {fbx_path}")

    print("\n✓ Models exported successfully!")
    print(f"  - {glb_path}")
    print(f"  - {fbx_path}")

def main():
    """Main execution function"""
    print("=== AI Orb 3D Model Generator ===\n")

    print("Creating AI Orb model...")
    create_ai_orb()

    print("\nExporting models...")
    export_model()

    print("\n=== Done! ===")
    print("\nNext steps:")
    print("1. Load the GLB file in Three.js using GLTFLoader")
    print("2. Add animations using Three.js AnimationMixer")
    print("3. Customize materials and lighting as needed")

if __name__ == "__main__":
    main()
