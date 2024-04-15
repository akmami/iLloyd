import React, { useRef, useEffect, useState } from 'react';
import '../styles/canvas.css';

function Canvas() {

    const canvasRef = useRef(null);
    const [points, setPoints] = useState([]);
    const [lines, setLines] = useState([]);
    const [scale, setScale] = useState(1);


    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        const scale = window.devicePixelRatio;
    
        canvas.width = 600 * scale;
        canvas.height = 400 * scale;
        canvas.style.width = '600px';
        canvas.style.height = '400px';
    
        context.scale(scale, scale);
        draw(context);
    }, [points, lines, scale]);
    

    const draw = (ctx) => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(scale, scale);
    
        // Draw all points
        points.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5 / scale, 0, 2 * Math.PI);
            ctx.fill();
        });
    
        // Draw all lines
        lines.forEach(line => {
            ctx.beginPath();
            ctx.moveTo(line.start.x, line.start.y);
            ctx.lineTo(line.end.x, line.end.y);
            ctx.lineWidth = 1 / scale;
            ctx.stroke();
        });
    };       


    const addPoint = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const newX = (e.clientX - rect.left) / scale;
        const newY = (e.clientY - rect.top) / scale;
        setPoints([...points, { x: newX, y: newY }]);
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
                <canvas ref={canvasRef} width={600 * scale} height={400 * scale} style={{ width: '600px', height: '400px' }} onClick={addPoint} />
            </div>
            <button onClick={zoomIn}>Zoom In</button>
            <button onClick={zoomOut}>Zoom Out</button>
        </div>
    );
}

export default Canvas;