'use client';

import React from 'react';
import { HierarchyTree } from './HierarchyTree';
import { ComponentLibrary } from './ComponentLibrary';

export function LeftSidebar() {
    return (
        <div className="w-64 h-full flex flex-col bg-slate-900/90 backdrop-blur-xl border-r border-white/10 z-40">
            <div className="flex-1 overflow-hidden">
                <HierarchyTree />
            </div>
            <ComponentLibrary />
        </div>
    );
}
