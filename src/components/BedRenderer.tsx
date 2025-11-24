import React from 'react';
import { Html } from '@react-three/drei';
import { ItemRendererProps } from './itemRegistry';

export const BedRenderer: React.FC<ItemRendererProps> = ({ dims, position }) => {
    const [w, h, d] = dims;
    return (
        <group position={position}>
            <mesh>
                <boxGeometry args={[w, h, d]} />
                <meshStandardMaterial color="orange" opacity={0.5} transparent />
            </mesh>
            <Html center>
                <div className="bg-orange-500 text-white p-1 rounded text-xs">Bed Frame</div>
            </Html>
        </group>
    );
};

export default BedRenderer;
