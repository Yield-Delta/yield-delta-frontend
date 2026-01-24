# 3D AI Orb Implementation Guide

This guide explains how to create and customize the 3D AI Orb used in the Yield Delta landing page.

## Overview

We've implemented two approaches for creating the 3D orb:

1. **Three.js Component (AIOrb3D.tsx)** - Real-time 3D rendering (Recommended)
2. **Blender Python Script (generate_orb_model.py)** - Pre-rendered 3D models

---

## Option 1: Three.js Component (Current Implementation)

### Location
`/yield-delta-frontend/src/components/AIOrb3D.tsx`

### Features

✅ **Real-time 3D rendering** with WebGL
✅ **Custom shader effects** for glowing appearance
✅ **Animated particles** orbiting the sphere
✅ **Dynamic lighting** that responds to time
✅ **Fresnel effect** for realistic edge glow
✅ **Smooth animations** with rotation and color cycling

### Usage

```tsx
import AIOrb3D from '@/components/AIOrb3D';

// Basic usage
<AIOrb3D />

// With custom props
<AIOrb3D
  size={300}           // Size in pixels (default: 200)
  color="#00f5d4"      // Primary color (default: cyan)
  animated={true}      // Enable animations (default: true)
/>
```

### Customization Options

#### 1. Change Colors

```tsx
<AIOrb3D
  color="#ff206e"      // Pink orb
  size={400}
/>
```

The component uses three colors defined in the shader:
- **colorPrimary**: Main orb color (controlled by `color` prop)
- **colorSecondary**: `#9b5de5` (purple)
- **colorTertiary**: `#ff206e` (pink)

#### 2. Adjust Size

```tsx
<AIOrb3D size={500} />  // Larger orb
<AIOrb3D size={150} />  // Smaller orb
```

#### 3. Disable Animation

```tsx
<AIOrb3D animated={false} />
```

Useful for performance optimization or static screenshots.

#### 4. Advanced Customization

To modify shader effects, edit `/components/AIOrb3D.tsx`:

**Change glow intensity:**
```tsx
// In fragmentShader (line ~120)
vec3 glow = finalColor * fresnel * 3.0;  // Increase from 2.0 to 3.0
```

**Adjust animation speed:**
```tsx
// In animate() function (line ~190)
sphere.rotation.y += 0.005;  // Faster rotation (was 0.002)
```

**Modify particle count:**
```tsx
// Change particleCount (line ~145)
const particleCount = 200;  // More particles (was 100)
```

### Performance Considerations

The Three.js orb is optimized for performance:

- ✅ Uses `requestAnimationFrame` for smooth 60fps
- ✅ Cleans up Three.js resources on unmount
- ✅ Limits pixel ratio to avoid over-rendering
- ✅ Uses efficient geometry (SphereGeometry with LOD)

**Performance Tips:**
- Reduce particle count for mobile devices
- Use lower geometry resolution (32 segments instead of 64)
- Disable animation on low-end devices

---

## Option 2: Blender Python Script (Advanced)

### Location
`/scripts/generate_orb_model.py`

### When to Use This Approach

Use Blender script generation when you need:
- 🎨 Custom artistic designs
- 📦 Pre-rendered models for faster loading
- 🖼️ Complex geometries that are expensive to render in real-time
- 🔄 Multiple orb variations with different designs

### Requirements

```bash
# Install Blender as a Python module
pip install bpy

# Or use system Blender (recommended)
# Download from: https://www.blender.org/download/
```

### Usage

#### Method 1: Run in Blender GUI

1. Open Blender
2. Go to **Scripting** tab
3. Click **Open** and select `generate_orb_model.py`
4. Click **Run Script** (▶️ button)
5. Models will be exported to `/yield-delta-frontend/public/models/`

#### Method 2: Run Headless (Command Line)

```bash
# Navigate to project root
cd /workspaces/yield-delta-protocol

# Run Blender in background mode
blender --background --python scripts/generate_orb_model.py

# Output:
# - ai_orb.glb (for Three.js)
# - ai_orb.fbx (alternative format)
```

### Customize the Blender Script

#### Change Colors

Edit the emission colors in `create_ai_orb()`:

```python
# Main orb color (line ~70)
emission.inputs['Color'].default_value = (1.0, 0.0, 0.5, 1.0)  # Pink

# Inner glow color (line ~110)
inner_emission.inputs['Color'].default_value = (0.0, 0.5, 1.0, 1.0)  # Blue

# Particles colors (line ~190)
colors = [
    (1.0, 1.0, 0.0, 1.0),   # Yellow
    (1.0, 0.0, 1.0, 1.0),   # Magenta
    (0.0, 1.0, 1.0, 1.0)    # Cyan
]
```

#### Adjust Geometry

```python
# Main sphere resolution (line ~30)
bpy.ops.mesh.primitive_uv_sphere_add(
    segments=128,    # Higher = smoother (was 64)
    ring_count=64,   # Higher = smoother (was 32)
    radius=1.5       # Larger sphere (was 1.0)
)

# Number of rings (line ~120)
for i in range(5):  # More rings (was 2)
    ...
```

#### Add More Particles

```python
# Particle count (line ~155)
for i in range(50):  # More particles (was 20)
    ...
```

### Load Blender Model in Three.js

Once you've generated the GLB file, load it in React:

```tsx
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export default function BlenderOrb() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true });

        renderer.setSize(400, 400);
        containerRef.current.appendChild(renderer.domElement);

        camera.position.z = 5;

        // Load the GLB model
        const loader = new GLTFLoader();
        loader.load('/models/ai_orb.glb', (gltf) => {
            scene.add(gltf.scene);

            // Animate the loaded model
            const animate = () => {
                requestAnimationFrame(animate);
                gltf.scene.rotation.y += 0.01;
                renderer.render(scene, camera);
            };
            animate();
        });

        return () => {
            renderer.dispose();
        };
    }, []);

    return <div ref={containerRef} />;
}
```

---

## Comparison: Three.js vs Blender

| Feature | Three.js Component | Blender Model |
|---------|-------------------|---------------|
| **Real-time Customization** | ✅ Easy via props | ❌ Need to regenerate |
| **Performance** | 🟡 Depends on device | ✅ Pre-rendered (faster) |
| **File Size** | ✅ Small (~50KB code) | 🟡 Larger GLB file (~500KB) |
| **Artistic Control** | 🟡 Limited by code | ✅ Full Blender capabilities |
| **Animations** | ✅ Smooth, dynamic | 🟡 Pre-baked animations |
| **Maintenance** | ✅ Easy to update | 🟡 Requires Blender |
| **Setup Time** | ✅ Already done | 🟡 Needs Blender setup |

**Recommendation:**
✅ Use **Three.js component** for most cases (current implementation)
🎨 Use **Blender script** if you need highly custom designs

---

## Troubleshooting

### Three.js Orb Not Showing

**Issue:** Blank space where orb should be

**Solutions:**
1. Check browser console for errors
2. Verify Three.js is installed: `npm list three`
3. Ensure component is client-side: wrapped in `"use client"`
4. Check container has dimensions (width/height)

```tsx
// Debug version
<div style={{ width: '400px', height: '400px', border: '1px solid red' }}>
    <AIOrb3D size={400} />
</div>
```

### Performance Issues

**Issue:** Orb causes lag or stuttering

**Solutions:**
1. Reduce particle count:
   ```tsx
   const particleCount = 50; // Reduce from 100
   ```

2. Lower geometry resolution:
   ```tsx
   const geometry = new THREE.SphereGeometry(1, 32, 32); // Was 64, 64
   ```

3. Disable animation on mobile:
   ```tsx
   const isMobile = window.innerWidth < 768;
   <AIOrb3D animated={!isMobile} />
   ```

### Blender Script Errors

**Issue:** `ModuleNotFoundError: No module named 'bpy'`

**Solution:** Use system Blender instead:
```bash
blender --background --python scripts/generate_orb_model.py
```

**Issue:** "No such file or directory: models/"

**Solution:** Script creates directory automatically, but ensure permissions:
```bash
mkdir -p yield-delta-frontend/public/models
chmod 755 yield-delta-frontend/public/models
```

---

## Alternative: Use Online 3D Model Generators

If you want to create custom models without Blender:

### 1. **Spline** (https://spline.design)
- Browser-based 3D design tool
- Export to GLB/GLTF
- Easy to use, no installation

### 2. **Vectary** (https://www.vectary.com)
- Web-based 3D modeling
- Great for parametric designs
- Export options for Three.js

### 3. **Clara.io** (https://clara.io)
- Online 3D modeling and rendering
- Good for organic shapes
- Direct Three.js export

### 4. **Poly** (https://poly.pizza)
- Free 3D model library
- Many pre-made orb/sphere models
- Download GLB files directly

**Workflow:**
1. Create orb in online tool
2. Export as GLB
3. Place in `/public/models/`
4. Load with GLTFLoader (see code above)

---

## Examples & Variations

### Variation 1: Pulsing Orb

```tsx
// Add pulsing scale animation
const animate = () => {
    const scale = 1 + Math.sin(time * 2) * 0.1;
    sphere.scale.set(scale, scale, scale);
    // ... rest of animation
};
```

### Variation 2: Color-Shifting Orb

```tsx
// Change colors over time
material.uniforms.colorPrimary.value.setHSL(
    (time * 0.1) % 1,  // Hue cycles 0-1
    0.8,               // Saturation
    0.6                // Lightness
);
```

### Variation 3: Multi-Orb System

```tsx
<div className="flex gap-8">
    <AIOrb3D size={200} color="#00f5d4" />  {/* Cyan */}
    <AIOrb3D size={200} color="#9b5de5" />  {/* Purple */}
    <AIOrb3D size={200} color="#ff206e" />  {/* Pink */}
</div>
```

---

## Next Steps

1. **Current Implementation:**
   The Three.js orb is already integrated in `FeatureHighlight.tsx`

2. **Test It:**
   ```bash
   cd yield-delta-frontend
   bun dev
   # Visit http://localhost:3001 and scroll to "Next-Generation Features"
   ```

3. **Customize:**
   - Edit colors in `AIOrb3D.tsx`
   - Adjust size/animations
   - Add interaction (mouse tracking, click effects)

4. **Optimize:**
   - Profile performance with Chrome DevTools
   - Add loading states
   - Implement lazy loading for off-screen orbs

---

## Resources

### Three.js Documentation
- Official Docs: https://threejs.org/docs/
- Examples: https://threejs.org/examples/
- Shaders: https://thebookofshaders.com/

### Blender Python API
- API Docs: https://docs.blender.org/api/current/
- Tutorials: https://www.blender.org/support/tutorials/

### WebGL Shaders
- Shader Toy: https://www.shadertoy.com/
- GLSL Sandbox: https://glslsandbox.com/

---

**Created:** 2026-01-13
**Last Updated:** 2026-01-13
**Maintainer:** Yield Delta Team
