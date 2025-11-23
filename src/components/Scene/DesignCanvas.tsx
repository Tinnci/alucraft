'use client';

import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import useDesignStore from '@/store/useDesignStore';
import { Workspace } from '@/components/Scene/Workspace';

interface DesignCanvasProps {
  bgColor: string;
  onPointerMissed?: (event: MouseEvent) => void;
}

function DesignCanvas({ bgColor, onPointerMissed }: DesignCanvasProps) {
  const handleCreated = (state: any) => {
    try {
      const canvasEl = state.gl?.domElement as HTMLCanvasElement | undefined;
      if (!canvasEl) return;
        const collectDiagnostics = (reason?: string) => {
          try {
            const diag: Record<string, any> = { timestamp: new Date().toISOString() };
            // Add store snapshot
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
            } catch { /* ignore errors */ }

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
              const scene = state && (state.scene as THREE.Scene);
              if (scene) {
                let meshCount = 0;
                const geometryIds = new Set<number>();
                const materialIds = new Set<number>();
                const textureIds = new Set<number>();
                let totalFaces = 0;
                scene.traverse((obj: any) => {
                  if (obj && obj.isMesh) {
                    meshCount++;
                    const geom = obj.geometry as THREE.BufferGeometry | undefined;
                    if (geom) geometryIds.add((geom as any).id);
                    const material = obj.material as THREE.Material | THREE.Material[];
                    const mats = Array.isArray(material) ? material : [material];
                    mats.forEach((m: any) => {
                      if (!m) return;
                      materialIds.add((m as any).id);
                      // map is typical texture property
                      const maps = ['map', 'emissiveMap', 'roughnessMap', 'metalnessMap', 'alphaMap', 'normalMap'];
                      for (const key of maps) {
                        const t = (m as any)[key] as THREE.Texture | undefined;
                        if (t) textureIds.add((t as any).id);
                      }
                      // estimate vertex count
                      try {
                        const g = (obj.geometry as THREE.BufferGeometry);
                        if (g && g.attributes && g.attributes.position) {
                          const posCount = (g.attributes.position as any).count ?? 0;
                          totalFaces += Math.floor(posCount / 3);
                        }
                      } catch { /* ignore */ }
                    });
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
              const gl = state?.gl?.getContext();
              if (gl) {
                const ext = gl.getExtension && gl.getExtension('WEBGL_debug_renderer_info');
                diag.gl = {
                  version: gl.getParameter(gl.VERSION),
                  vendor: gl.getParameter(gl.VENDOR),
                  renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
                };
              }
            } catch { /* ignore */ }

            // Browser memory stats (if available)
            try {
              if (typeof window !== 'undefined' && (window as any).performance && (window as any).performance.memory) {
                diag.performanceMemory = (window as any).performance.memory;
              }
              if (navigator && (navigator as any).deviceMemory) diag.deviceMemory = (navigator as any).deviceMemory;
            } catch { /* ignore */ }

            if (reason) diag.reason = reason;
            return diag;
          } catch (err) {
            return { error: 'failed to collect diagnostics', err };
          }
        };

        const onContextLost = (ev: Event) => {
          ev.preventDefault();
          const diag = collectDiagnostics('contextlost');
          // eslint-disable-next-line no-console
          console.error('WebGL context lost on canvas; diagnostics:', diag);
        };
      const onContextRestored = () => {
        const diag = collectDiagnostics('contextrestored');
        // eslint-disable-next-line no-console
        console.info('WebGL context restored; diagnostics snapshot:', diag);
      };
      canvasEl.addEventListener('webglcontextlost', onContextLost as EventListener);
      canvasEl.addEventListener('webglcontextrestored', onContextRestored as EventListener);
      // Clean up listeners on destruction
      // This will be handled in React's lifecycle when Canvas unmounts, but we attach to state for completeness
      (state as any).__onDispose = () => {
        canvasEl.removeEventListener('webglcontextlost', onContextLost as EventListener);
        canvasEl.removeEventListener('webglcontextrestored', onContextRestored as EventListener);
        if (intervalId) clearInterval(intervalId);
        if (state?.gl && state.gl.info) {
          // Final log of render info for debugging
          // eslint-disable-next-line no-console
          console.info('WebGL Renderer info (dispose):', state.gl.info);
        }
        // Also log final scene snapshot
        try {
          const finalDiag = collectDiagnostics('dispose');
          // eslint-disable-next-line no-console
          console.info('WebGL final diagnostics (dispose):', finalDiag);
        } catch { /* ignore */ }
      };
      let intervalId: number | undefined;
      try {
        if (typeof window !== 'undefined') {
          const doPeriodic = process.env.NODE_ENV === 'development';
          if (doPeriodic && state && state.gl && state.gl.info) {
            // Periodically log renderer's memory and render info to help diagnose context loss
            intervalId = window.setInterval(() => {
              try {
                // eslint-disable-next-line no-console
                console.debug('WebGL renderer info (periodic):', state.gl.info);
                const diag = collectDiagnostics('periodic');
                // eslint-disable-next-line no-console
                console.debug('WebGL periodic diagnostics snapshot:', diag);
              } catch (err) {
                // ignore
              }
            }, 10000);
          }
        }
      } catch (err) { /* ignore */ }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Failed to attach WebGL context event listeners', err);
    }
  };

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
