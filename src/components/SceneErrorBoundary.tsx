import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Html } from '@react-three/drei';
import { AlertTriangle } from 'lucide-react';

interface Props { children: ReactNode; nodeId?: string }
interface State { hasError: boolean }

export class SceneErrorBoundary extends Component<Props, State> {
    state = { hasError: false };

    static getDerivedStateFromError(_: Error) {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error("3D Render Error in node:", this.props.nodeId, error, info);
    }

    render() {
        if (this.state.hasError) {
            // Render a red 3D error placeholder instead of crashing the Canvas
            return (
                <group>
                    <mesh>
                        <boxGeometry args={[100, 100, 100]} />
                        <meshStandardMaterial color="#ef4444" wireframe />
                    </mesh>
                    <Html center>
                        <div className="flex flex-col items-center bg-destructive/90 text-white p-2 rounded shadow-lg text-xs backdrop-blur whitespace-nowrap">
                            <AlertTriangle size={16} className="mb-1" />
                            <span>Error: {this.props.nodeId}</span>
                        </div>
                    </Html>
                </group>
            );
        }
        return this.props.children;
    }
}
