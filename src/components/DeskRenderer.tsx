import React from 'react';
import { Html } from '@react-three/drei';
import { ItemRendererProps } from './itemRegistry';

export const DeskRenderer: React.FC<ItemRendererProps> = ({ dims, position }) => {
    const [w, h, d] = dims;
    return (
        <group position={position}>
            <mesh>
                <boxGeometry args={[w, h, d]} />
                <meshStandardMaterial color="blue" opacity={0.5} transparent />
            </mesh>
            <Html center>
                <div className="bg-blue-500 text-white p-1 rounded text-xs">Desk Unit</div>
            </Html>
        </group>
    );
};

export default DeskRenderer;
