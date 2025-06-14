import React from 'react';
import { TopBar } from './TopBar';
import { Canvas } from './Canvas';
import { Sidebar } from './Sidebar';
import { NodesList } from './NodesList';
import SetApiKey from './SetApiKey';

export function AppLayout() {
    return (
        <div className="flex flex-col h-screen">
            <TopBar />
            <SetApiKey />
            {/* <NodesList /> */}
            <div className="flex flex-1">
                <Canvas />
                <Sidebar />
            </div>
        </div>
    );
}
