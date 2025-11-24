'use client';

import React from 'react';
import { Canvas, RootState } from '@react-three/fiber';
import * as THREE from 'three';
import useDesignStore from '@/store/useDesignStore';
import { Workspace } from '@/components/Scene/Workspace';

interface DesignCanvasProps {
  bgColor: string;
  onPointerMissed?: (event: MouseEvent) => void;
}

function DesignCanvas({ bgColor, onPointerMissed }: DesignCanvasProps) {
  const handleCreated = (state: RootState) => {
    try {
      const canvasEl = state.gl.domElement;
      if (!canvasEl) return;

      const collectDiagnostics = (reason?: string) => {
        try {
          const diag: Record<string, unknown> = { timestamp: new Date().toISOString() };

          // Store snapshot
          try {
            const store = useDesignStore.getState();
            diag.store = {
              width: store.width,
              height: store.height,
              depth: store.depth,
              profileType: store.profileType,
              layoutCount: Array.isArray(store.layout) ? store.layout.length : 0,
              hasLeftWall: store.hasLeftWall,
              hasRightWall: store.hasRightWall,
            };
          } catch { /* ignore */ }

          // Renderer info
          try {
            if (state && state.gl && state.gl.info) {
              const info = state.gl.info;
              diag.renderer = {
                memory: info.memory,
                render: info.render,
                autoReset: info.autoReset
              };
            }
          } catch { /* ignore */ }

          // Scene counts
          try {
            const scene = state.scene;
            if (scene) {
              let meshCount = 0;
              const geometryIds = new Set<number>();
              const materialIds = new Set<number>();
              const textureIds = new Set<number>();
              let totalFaces = 0;

              scene.traverse((obj: THREE.Object3D) => {
                if (obj && (obj as THREE.Mesh).isMesh) {
                  meshCount++;
                  const mesh = obj as THREE.Mesh;
                  const geom = mesh.geometry;
                  if (geom) geometryIds.add(geom.id);

                  const material = mesh.material;
                  const mats = Array.isArray(material) ? material : [material];

                  mats.forEach((m) => {
                    if (!m) return;
                    const matId = (m as unknown as { id?: number }).id;
                    if (matId !== undefined) materialIds.add(matId);
                    const maps = ['map', 'emissiveMap', 'roughnessMap', 'metalnessMap', 'alphaMap', 'normalMap'];
                    for (const key of maps) {
                      const t = (m as unknown as Record<string, unknown>)[key] as THREE.Texture | undefined;
                      if (t) textureIds.add(t.id);
                    }
                  });

                  // estimate vertex count
                  try {
                    const g = mesh.geometry;
                    if (g && g.attributes && g.attributes.position) {
                      const posCount = g.attributes.position.count ?? 0;
                      totalFaces += Math.floor(posCount / 3);
                    }
                  } catch { /* ignore */ }
                }
              });

              diag.scene = {
                children: scene.children?.length ?? 0,
                meshCount,
                geometries: geometryIds.size,
                materials: materialIds.size,
                textures: textureIds.size,
                totalFaces
              };
            }
          } catch { /* ignore */ }

          // WebGL Context properties
          try {
            const gl = state.gl.getContext();
            if (gl) {
              const ext = gl.getExtension('WEBGL_debug_renderer_info');
              diag.gl = {
                version: gl.getParameter(gl.VERSION),
                vendor: gl.getParameter(gl.VENDOR),
                renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
              };
            }
          } catch { /* ignore */ }

          if (reason) diag.reason = reason;
          return diag;
        } catch {
          return { error: 'failed to collect diagnostics' };
        }
      };

      const onContextLost = (ev: Event) => {
        ev.preventDefault();
        const diag = collectDiagnostics('contextlost');
        const isConnected = state.gl.domElement.isConnected;
        console.error('🚨 WebGL Context Lost!', {
          inDOM: isConnected,
          timestamp: new Date().toISOString(),
          diagnostics: diag
        });
      };

      const onContextRestored = () => {
        const diag = collectDiagnostics('contextrestored');
        console.info('WebGL context restored; diagnostics snapshot:', diag);
      };

      canvasEl.addEventListener('webglcontextlost', onContextLost as EventListener);
      canvasEl.addEventListener('webglcontextrestored', onContextRestored as EventListener);

      // Clean up listeners
      (state as RootState & { __onDispose?: () => void }).__onDispose = () => {
        canvasEl.removeEventListener('webglcontextlost', onContextLost as EventListener);
        canvasEl.removeEventListener('webglcontextrestored', onContextRestored as EventListener);
      };

    } catch (err) {
      console.warn('Failed to attach WebGL context event listeners', err);
    }
  };

  // Monitor lifecycle
  React.useEffect(() => {
    console.log('[DesignCanvas] Mount (Component Mounted)');
    return () => console.log('[DesignCanvas] Unmount (Component Unmounted/Destroyed)');
  }, []);

  return (
    <Canvas
      shadows
      camera={{ position: [1500, 1500, 1500], fov: 45, near: 10, far: 20000 }}
      onPointerMissed={onPointerMissed}
      onCreated={handleCreated}
    >
      <color attach="background" args={[bgColor]} />
      <fog attach="fog" args={[bgColor, 2000, 5000]} />
      <Workspace />
    </Canvas>
  );
}

export default DesignCanvas;
