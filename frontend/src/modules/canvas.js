import React, { useRef, useEffect, useState, useCallback } from 'react';
import '../styles/canvas.css';
import Toggle from '../components/toggle';

function Canvas() {

    const canvasRef = useRef(null);
    const [points, setPoints] = useState([]);
    const [lines, setLines] = useState([]);
    const [scale, setScale] = useState(1);
    const [addPointState, setAddPointState] = useState(false);


    const draw = useCallback((ctx) => {
        const centerX = ctx.canvas.width / 2;
        const centerY = ctx.canvas.height / 2;

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        ctx.translate(-centerX, -centerY);
    
        points.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 2 / scale, 0, 2 * Math.PI);
            ctx.fill();
        });
    
        lines.forEach(line => {
            ctx.beginPath();
            ctx.moveTo(line.start.x, line.start.y);
            ctx.lineTo(line.end.x, line.end.y);
            ctx.lineWidth = 1 / scale;
            ctx.stroke();
        });
    }, [points, lines, scale]);

    
    useEffect(() => {

        const updateCanvasSize = () => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            const width = window.innerWidth * 0.9;
            const height = window.innerHeight * 0.8;

            canvas.width = width;
            canvas.height = height;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            draw(ctx);
        };

        window.addEventListener('resize', updateCanvasSize);
        updateCanvasSize();

        return () => {
            window.removeEventListener('resize', updateCanvasSize);
        };
    }, [draw]);

    const handleToggle = () => {
        setAddPointState(!addPointState);
    };

    const addPoint = (e) => {

        if ( addPointState ) {
            const rect = canvasRef.current.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
        
            const newX = ((e.clientX - rect.left) - centerX) / scale + centerX;
            const newY = ((e.clientY - rect.top) - centerY) / scale + centerY;
        
            setPoints([...points, { x: newX, y: newY }]);
        }
    };
    

    const zoomIn = () => {
        setScale(scale * 1.1);
    };
    

    const zoomOut = () => {
        setScale(scale / 1.1);
    };

    
    return (
        <div>
            <div className="canvas-frame">
                <canvas ref={canvasRef} onClick={addPoint} />
            </div>
            <div>
                <Toggle text="Add points " toggleState={addPointState} onToggle={handleToggle}/>
                <button onClick={zoomIn}>Zoom In</button>
                <button onClick={zoomOut}>Zoom Out</button>
            </div>
        </div>
    );
}

export default Canvas;