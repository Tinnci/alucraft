'use client';

import { Canvas } from '@react-three/fiber';
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
      const onContextLost = (ev: Event) => {
        ev.preventDefault();
        // Context lost is often caused by GPU resets or heavy rendering.
        // Log to aid debugging; optionally show a UI message or attempt restore.
        // We avoid automatically reloading the page; it may trigger loops in dev.
        // If desired, dispatch a small store action to show a user-facing toast.
        // eslint-disable-next-line no-console
        console.warn('WebGL context lost on canvas; please reload the page to reinitialize the 3D view.');
      };
      const onContextRestored = () => {
        // eslint-disable-next-line no-console
        console.info('WebGL context restored.');
      };
      canvasEl.addEventListener('webglcontextlost', onContextLost as EventListener);
      canvasEl.addEventListener('webglcontextrestored', onContextRestored as EventListener);
      // Clean up listeners on destruction
      // This will be handled in React's lifecycle when Canvas unmounts, but we attach to state for completeness
      (state as any).__onDispose = () => {
        canvasEl.removeEventListener('webglcontextlost', onContextLost as EventListener);
        canvasEl.removeEventListener('webglcontextrestored', onContextRestored as EventListener);
      };
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
