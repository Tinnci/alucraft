'use client';

import React from 'react';
import { HierarchyTree } from './HierarchyTree';
import { ComponentLibrary } from './ComponentLibrary';

export function LeftSidebar() {
    return (
        <div className="w-64 h-full flex flex-col glass-panel border-y-0 border-l-0 rounded-none shadow-none z-40">
            <div className="flex-1 overflow-hidden">
                <HierarchyTree />
            </div>
            <ComponentLibrary />
        </div>
    );
}
