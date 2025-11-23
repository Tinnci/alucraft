'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export interface HeavySpawnerProps {
  enabled?: boolean;
  boxes?: number; // number of unique boxes to spawn
  textureSize?: number; // size of generated canvas textures
}

export default function HeavySpawner({ enabled = false, boxes = 300, textureSize = 2048 }: HeavySpawnerProps) {
  const { scene } = useThree();

  useEffect(() => {
    if (!enabled) return;

    const textures: THREE.Texture[] = [];
    const meshes: THREE.Mesh[] = [];

    // Helper: create a large canvas-based texture
    function makeBigCanvasTexture(size: number, seed: number) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return undefined;

        // Draw a simple but content-heavy pattern
        ctx.fillStyle = `hsl(${(seed * 47) % 360}, 60%, 55%)`;
        ctx.fillRect(0, 0, size, size);
        ctx.globalAlpha = 0.12;
        for (let i = 0; i < 200; i++) {
          ctx.fillStyle = `hsl(${(seed * i) % 360}, 40%, ${30 + (i % 60)}%)`;
          const x = (i * 37) % size;
          const y = (i * 71) % size;
          const w = 150 + (i % 200);
          const h = 150 + ((i * 2) % 350);
          ctx.fillRect(x - w / 2, y - h / 2, w, h);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.needsUpdate = true;
        return tex;
      } catch {
        return undefined;
      }
    }

    try {
      // Create a pool of textures to be reused by materials
      const textureCount = Math.min(48, Math.max(4, Math.floor(boxes / 8)));
      for (let t = 0; t < textureCount; t++) {
        const tex = makeBigCanvasTexture(textureSize, t) ?? new THREE.Texture();
        textures.push(tex);
      }

      const geoTemplate = new THREE.BoxGeometry(200, 200, 200, 24, 24, 24);

      for (let i = 0; i < boxes; i++) {
        const mat = new THREE.MeshStandardMaterial({
          color: '#ffffff',
          roughness: 0.8,
          metalness: 0.1,
          map: textures[i % textures.length]
        });
        const geom = geoTemplate.clone();
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(
          (Math.random() - 0.5) * 2000,
          (Math.random() - 0.5) * 2000,
          (Math.random() - 0.5) * 2000
        );
        // Don't cast shadows for performance; just create geometry/material/state
        scene.add(mesh);
        meshes.push(mesh);
      }

      // Force a couple of frames to render (if someone wants to call gl.render etc.), but
      // our Playwright test can just wait and watch for console messages.
    } catch {
      // swallow errors; the heavy spawner is meant to stress the renderer, not break the app
      console.warn('HeavySpawner: error while creating heavy scene');
    }

    return () => {
      try {
        for (const m of meshes) {
          if (!m) continue;
          try {
            scene.remove(m);
            m.geometry?.dispose?.();
            const mats = (Array.isArray(m.material) ? m.material : [m.material]) as Array<THREE.Material | undefined>;
            for (const mm of mats) {
              if (!mm) continue;
              try {
                // dispose texture maps if present
                const map = (mm as THREE.MeshStandardMaterial).map;
                if (map) map.dispose();
              } catch { /* ignore */ }
              try {
                // dispose the material itself
                mm.dispose();
              } catch { /* ignore */ }
            }
          } catch { /* ignore */ }
        }
        for (const tx of textures) {
          try { tx.dispose(); } catch { }
        }
      } catch {
        // ignore
      }
    };
  }, [enabled, boxes, textureSize, scene]);

  return null;
}
