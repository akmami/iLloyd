import React, { useEffect } from 'react';
import { useCanvas } from './canvas_context';

function CanvasDisplay() {
    const { 
        canvasRef,
        data,
        scale,
        addPoint,
        handleMouseDown,
        handleMouseUp,
        handleMouseMove,
        isDragging } = useCanvas();

    
    useEffect(() => {

        const canvas = canvasRef.current;
        if (!canvas) return; // ensure canvas is available

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const width = window.innerWidth;
        const height = window.innerHeight * 0.8;

        canvas.width = width;
        canvas.height = height;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const centerX = ctx.canvas.width / 2;
        const centerY = ctx.canvas.height / 2;

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        ctx.translate(-centerX, -centerY);
    
        data.points.forEach(point => {
            ctx.beginPath();
            ctx.arc(point[0], point[1], 2 / scale, 0, 2 * Math.PI);
            ctx.fill();
        });
        
        ctx.fillStyle = "red";
        data.centroids.forEach(point => {
            ctx.beginPath();
            ctx.arc(point[0], point[1], 2 / scale, 0, 2 * Math.PI);
            ctx.fill();
        });
        ctx.fillStyle = "black";
    
        data.edges.forEach(line => {
            ctx.beginPath();
            ctx.moveTo(line[0][0], line[0][1]);
            ctx.lineTo(line[1][0], line[1][1]);
            ctx.lineWidth = 1 / scale;
            ctx.stroke();
        });

        ctx.strokeStyle = 'blue';
        data.centroidEdges.forEach(line => {
            ctx.beginPath();
            ctx.moveTo(line[0][0], line[0][1]);
            ctx.lineTo(line[1][0], line[1][1]);
            ctx.lineWidth = 0.8 / scale;
            ctx.stroke();
        });
        ctx.strokeStyle = 'black';

        // points.forEach(point => {
        //     console.log(point);
        // });
    }, [data, scale]);

    return (
        <canvas 
            ref={canvasRef} 
            onClick={addPoint}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseUp}
            style={{ cursor: isDragging ? 'grabbing' : 'default' }}
        />
    );
}

export default CanvasDisplay;
