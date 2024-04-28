import React, { useRef, useEffect, useState, useCallback } from 'react';
import '../styles/canvas.css';
import Toggle from '../components/toggle';

function Canvas() {

    const canvasRef = useRef(null);
    const [points, setPoints] = useState([]);
    const [lastPosition, setLastPosition] = useState([]);
    const [lines, setLines] = useState([]);
    const [scale, setScale] = useState(1);
    const [addPointState, setAddPointState] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [inputValue, setInputValue] = useState('');

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

        // points.forEach(point => {
        //     console.log(point);
        // });
    }, [points, lines, scale]);

    
    useEffect(() => {

        const updateCanvasSize = () => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            const width = window.innerWidth;
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


    const handleMouseDown = (e) => {
        if ( !addPointState ) {
            const rect = canvasRef.current.getBoundingClientRect();
            setLastPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
            setIsDragging(true);
        }
    };
    

    const handleMouseMove = (e) => {
        if ( !addPointState && isDragging) {
            const rect = canvasRef.current.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;
            const deltaX = (currentX - lastPosition.x) / scale;
            const deltaY = (currentY - lastPosition.y) / scale;
    
            // Update all points by the delta
            const newPoints = points.map(point => ({
                x: point.x + deltaX,
                y: point.y + deltaY
            }));
    
            // Update all lines accordingly
            const newLines = lines.map(line => ({
                start: { x: line.start.x + deltaX, y: line.start.y + deltaY },
                end: { x: line.end.x + deltaX, y: line.end.y + deltaY }
            }));
    
            setPoints(newPoints);
            setLines(newLines);
            setLastPosition({ x: currentX, y: currentY });
        }
    };
    

    const handleMouseUp = () => {
        setIsDragging(false);
    };


    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };


    const handleAddPoints = () => {
        
        const numPoints = parseInt(inputValue, 10);
        
        if (isNaN(numPoints)) {
            alert('Please enter a valid number');
            return;
        }

        const newPoints = [];
        
        for (let i = 0; i < numPoints; i++) {
            newPoints.push({
                x: Math.random() * canvasRef.current.width,
                y: Math.random() * canvasRef.current.height
            });
        }

        setPoints([...points, ...newPoints]);
        setInputValue('');
    };


    const clear = () => {
        setPoints([]);
        setLines([]);
    }
    
    
    return (
        <div>
            <div className="canvas-frame">
                <canvas 
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    ref={canvasRef} 
                    onClick={addPoint}
                    style={{ cursor: isDragging ? 'grabbing' : 'default' }}/>
            </div>
            <div className="control-panel">
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="Enter number of points"
                />
                <button onClick={handleAddPoints}>Add Points</button>
                <Toggle text="Add points " toggleState={addPointState} onToggle={handleToggle}/>
                <div className="control-panel">
                    <button onClick={zoomIn}>Zoom In</button>
                    <button onClick={zoomOut}>Zoom Out</button>
                </div>
                <button onClick={clear}>Clear</button>
            </div>
        </div>

    );
}

export default Canvas;