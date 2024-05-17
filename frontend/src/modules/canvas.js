import React from 'react';
import '../styles/canvas.css';
import { CanvasProvider } from './canvas_context';
import CanvasDisplay from './canvas_display';
import CanvasControlPanel from './canvas_control_panel';

function Canvas() {

    
    return (
        <CanvasProvider>
            <div>
                <div className="canvas-frame">
                    <CanvasDisplay />
                </div>
                <CanvasControlPanel />
            </div>
        </CanvasProvider>
    );
};

export default Canvas;