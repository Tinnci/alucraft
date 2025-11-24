'use client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { DrawerUnit } from '@/components/DrawerUnit';

export default function Workbench() {
    return (
        <div className="h-screen w-screen bg-gray-100">
            <Canvas camera={{ position: [500, 500, 500] }}>
                <ambientLight />
                <pointLight position={[100, 100, 100]} />

                {/* Component under development */}
                <DrawerUnit
                    width={400}
                    height={200}
                    depth={500}
                    position={[0, 0, 0]}
                    isColliding={false}
                />

                <OrbitControls />
                <gridHelper args={[1000, 10]} />
            </Canvas>
        </div>
    );
}
