import React, { useRef, useEffect, useState, useCallback } from 'react';
import '../styles/canvas.css';
import Toggle from '../components/toggle';
import fetchData from '../helpers/fetch';
import sleep from '../helpers/sleep';

function Canvas() {

    const canvasRef = useRef(null);
    const [data, setData] = useState({"points": [], "edges": [], "lastPosition": [], "centroids": [], "centroidEdges": []})
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
            
            setData({"points": [...data.points, [newX, newY]], "edges": data.edges, "lastPosition": data.lastPosition, "centroids": data.centroids, "centroidEdges": data.centroidEdges});
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
            setData({"points": data.points, "edges": data.edges, "lastPosition": [e.clientX - rect.left, e.clientY - rect.top], "centroids": data.centroids, "centroidEdges": data.centroidEdges});
            setIsDragging(true);
        }
    };
    

    const handleMouseMove = (e) => {
        if ( !addPointState && isDragging) {
            const rect = canvasRef.current.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;
            const deltaX = (currentX - data.lastPosition[0]) / scale;
            const deltaY = (currentY - data.lastPosition[1]) / scale;
    
            // Update all points by the delta
            const newPoints = data.points.map(point => ([
                point[0] + deltaX,
                point[1] + deltaY
            ]));

            // Update all edges accordingly
            const newEdges = data.edges.map(edge => ([
                [edge[0][0] + deltaX, edge[0][1] + deltaY],
                [edge[1][0] + deltaX, edge[1][1] + deltaY]
            ]));

            // Update all centroids by the delta
            const newCentroids = data.centroids.map(point => ([
                point[0] + deltaX,
                point[1] + deltaY
            ]));

            const newCentroidsEdges = data.centroidEdges.map(edge => ([
                [edge[0][0] + deltaX, edge[0][1] + deltaY],
                [edge[1][0] + deltaX, edge[1][1] + deltaY]
            ]));

            setData({"points": newPoints, "edges": newEdges, "lastPosition": [currentX, currentY], "centroids": newCentroids, "centroidEdges": newCentroidsEdges});
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

        setData({"points": [...data.points, ...newPoints], "edges": data.edges, "lastPosition": data.lastPosition, "centroids": data.centroids, "centroidEdges": data.centroidEdges});
        setInputPointValue('');
    };


    const clear = () => {
        setData({"points": [], "edges": [], "lastPosition": [], "centroids": [], "centroidEdges": []});
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
            const response = await fetchData('api/default/', 'POST', {"points": data.points});
            var end = new Date();
            var duration = end - start;
            console.log("Points: " + data.points.length + ", Duration: " + duration);

            if (!response || !response.centroids || !response.edges || !response.centroid_edges ) {
                alert("Smt went wrong!");
                continue;
            }
            
            setData({"points": data.points, "edges": response.edges, "lastPosition": data.lastPosition, "centroids": response.centroids, "centroidEdges": response.centroid_edges });
            
            await delayedExecution(millisecondDelay);
            
            setData({"points": response.centroids, "edges": [], "lastPosition": [], "centroids": [], "centroidEdges": []});
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