import React, { useRef, useEffect, useState, useCallback } from 'react';
import '../styles/canvas.css';
import Toggle from '../components/toggle';
import fetchData from '../helpers/fetch';
import sleep from '../helpers/sleep';

function Canvas() {

    const canvasRef = useRef(null);
    const [points, setPoints] = useState([]);
    const [lastPosition, setLastPosition] = useState([]);
    const [centroids, setCentroids] = useState([]);
    const [centroidEdges, setCentroidEdges] = useState([]);
    const [lines, setLines] = useState([]);
    const [scale, setScale] = useState(1);
    const [addPointState, setAddPointState] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [inputPointValue, setInputPointValue] = useState('');
    const [inputIterationValue, setInputIterationValue] = useState('');
    const [inputDelayValue, setInputDelayValue] = useState('');
    

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
            ctx.arc(point[0], point[1], 2 / scale, 0, 2 * Math.PI);
            ctx.fill();
        });
        
        ctx.fillStyle = "red";
        centroids.forEach(point => {
            ctx.beginPath();
            ctx.arc(point[0], point[1], 2 / scale, 0, 2 * Math.PI);
            ctx.fill();
        });
        ctx.fillStyle = "black";
    
        lines.forEach(line => {
            ctx.beginPath();
            ctx.moveTo(line[0][0], line[0][1]);
            ctx.lineTo(line[1][0], line[1][1]);
            ctx.lineWidth = 1 / scale;
            ctx.stroke();
        });

        ctx.strokeStyle = 'blue';
        centroidEdges.forEach(line => {
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
    }, [points, lines, scale, centroidEdges, centroids]);

    
    
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
        
            setPoints([...points, [newX, newY]]);
        }
    };
    

    const zoomIn = () => {
        setScale(scale * 1.1);
    };
    

    const zoomOut = () => {
        setScale(scale / 1.1);
    };


    const resetZoom = () => {
        setScale(1);
    };


    const handleMouseDown = (e) => {
        if ( !addPointState ) {
            const rect = canvasRef.current.getBoundingClientRect();
            setLastPosition([e.clientX - rect.left, e.clientY - rect.top]);
            setIsDragging(true);
        }
    };
    

    const handleMouseMove = (e) => {
        if ( !addPointState && isDragging) {
            const rect = canvasRef.current.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;
            const deltaX = (currentX - lastPosition[0]) / scale;
            const deltaY = (currentY - lastPosition[1]) / scale;
    
            // Update all points by the delta
            const newPoints = points.map(point => ([
                point[0] + deltaX,
                point[1] + deltaY
            ]));

            // Update all centroids by the delta
            const newCentroids = centroids.map(point => ([
                point[0] + deltaX,
                point[1] + deltaY
            ]));
    
            // Update all lines accordingly
            const newLines = lines.map(line => ([
                [line[0][0] + deltaX, line[0][1] + deltaY],
                [line[1][0] + deltaX, line[1][1] + deltaY]
            ]));

            const newCentroidsEdges = centroidEdges.map(line => ([
                [line[0][0] + deltaX, line[0][1] + deltaY],
                [line[1][0] + deltaX, line[1][1] + deltaY]
            ]));
    
            setPoints(newPoints);
            setLines(newLines);
            setCentroids(newCentroids);
            setLastPosition([currentX, currentY]);
            setCentroidEdges(newCentroidsEdges);
        }
    };
    

    const handleMouseUp = () => {
        setIsDragging(false);
    };


    const handleInputPointChange = (e) => {
        setInputPointValue(e.target.value);
    };

    const handleInputIterationChange = (e) => {
        setInputIterationValue(e.target.value);
    };


    const handleAddPoints = () => {
        
        const numPoints = parseInt(inputPointValue, 10);
        
        if (isNaN(numPoints)) {
            alert('Please enter a valid number');
            return;
        }

        const newPoints = [];
        
        for (let i = 0; i < numPoints; i++) {
            newPoints.push([
                Math.random() * canvasRef.current.width,
                Math.random() * canvasRef.current.height
            ]);
        }

        setPoints([...points, ...newPoints]);
        setInputPointValue('');
    };


    const clear = () => {
        setPoints([]);
        setLines([]);
        setLastPosition([]);
        setCentroidEdges([]);
        setCentroids([]);
    };


    const run = async () => {
        
        const numIterations = parseInt(inputIterationValue, 10);
        const millisecondDelay = parseInt(inputDelayValue, 10);

        if (isNaN(numIterations)) {
            alert('Please enter a valid number');
            return;
        }

        for( let i = 0; i < numIterations; i++) {

            var start = new Date();
            const data = await fetchData('api/default/', 'POST', {"points": points});
            var end = new Date();
            var duration = end - start;
            console.log("Points: " + points.length + ", Duration: " + duration);

            if (!data) {
                alert("Smt went wrong!")
            }
            
            if ( data.centroids && data.centroids.length > 0 ) {
                setCentroids(data.centroids);
            }
            if ( data.centroid_edges && data.centroid_edges.length > 0 ) {
                setCentroidEdges(data.centroid_edges);
            }
            if ( data.edges && data.edges.length > 0 ) {
                setLines(data.edges);
            }
            
            await delayedExecution(millisecondDelay);
            
            // console.log(centroids);
            if ( data.centroids && data.centroids.length > 0 ) {
                setPoints(data.centroids);
                setCentroids([]);
                setCentroidEdges([]);
            }
        }
    };


    const handleInputDelayChange = (e) => {
        setInputDelayValue(e.target.value);
    };
    

    async function delayedExecution(milliseconds) {
        await sleep(milliseconds);
    };

    
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
                    value={inputPointValue}
                    onChange={handleInputPointChange}
                    placeholder="Enter number of points"
                />
                <button onClick={handleAddPoints}>Add Points</button>
                <Toggle text="Add points " toggleState={addPointState} onToggle={handleToggle}/>
                <input
                    type="text"
                    value={inputDelayValue}
                    onChange={handleInputDelayChange}
                    placeholder="Delay"
                />
                <div className="control-panel">
                    <button onClick={zoomIn}>Zoom In</button>
                    <button onClick={zoomOut}>Zoom Out</button>
                    <button onClick={resetZoom}>Reset Zoom</button>
                </div>
                <button onClick={clear}>Clear</button>
                <input
                    type="text"
                    value={inputIterationValue}
                    onChange={handleInputIterationChange}
                    placeholder="Lloyd iteration count"
                />
                <button onClick={run}>Run</button>
            </div>
        </div>

    );
}

export default Canvas;