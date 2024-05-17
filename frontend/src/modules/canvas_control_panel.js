import React, { useState } from 'react';
import { useCanvas } from './canvas_context';
import '../styles/canvas.css';
import Toggle from '../components/toggle';
import fetchData from '../helpers/fetch';
import sleep from '../helpers/sleep';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearchPlus, faSearchMinus, faSync, faPlay, faTrash } from '@fortawesome/free-solid-svg-icons';


function CanvasDisplay() {

    const { canvasRef, data, setData, scale, setScale, addPointState, setAddPointState } = useCanvas();

    const [inputPointValue, setInputPointValue] = useState('');
    const [inputDelayValue, setInputDelayValue] = useState('');
    const [algorithm, setAlgorithm] = useState('delaunay');
    

    async function delayedExecution(milliseconds) {
        await sleep(milliseconds);
    };
    

    const zoomIn = () => {
        setScale(scale * 1.1);
    };
    

    const zoomOut = () => {
        if( scale > 1){
            setScale(scale / 1.1);
        }
    };


    const resetZoom = () => {
        setScale(1);
    };


    const handleToggle = () => {
        setAddPointState(!addPointState);
    };


    const handleInputPointChange = (e) => {
        setInputPointValue(e.target.value);
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

        setData(prevData => ({
            ...prevData,
            points: [...prevData.points, ...newPoints]
        }));
        setInputPointValue('');
    };


    const handleInputDelayChange = (e) => {
        setInputDelayValue(e.target.value);
    };


    const handleAlgorithmChange = (e) => {
        setAlgorithm(e.target.value);
    };
    

    const clear = () => {
        setData({"points": [], "edges": [], "lastPosition": [], "centroids": [], "centroidEdges": []});
    };


    const run = async () => {
        
        const millisecondDelay = parseInt(inputDelayValue, 10);
        var start = new Date();
        
        const apiEndpoint = algorithm === 'delaunay' ? 'api/delaunay/' : 'api/fortune/';

        
        const rect = canvasRef.current.getBoundingClientRect();
        const width = rect.width / scale;
        const height = rect.height / scale;
        
        const response = await fetchData(apiEndpoint, 'POST', {"points": data.points, "boundaries": { "min_x": 0, "max_x": width, "min_y": 0, "max_y": height }});
        var end = new Date();
        var duration = end - start;
        console.log("Points: " + data.points.length + ", Duration: " + duration);

        if (!response || !response.centroids || !response.edges || !response.centroid_edges) {
            alert("Something went wrong!");
            return;
        }
        
        setData({"points": data.points, "edges": response.edges, "lastPosition": data.lastPosition, "centroids": response.centroids, "centroidEdges": response.centroid_edges });
        
        await delayedExecution(millisecondDelay);
        
        setData({"points": response.centroids, "edges": [], "lastPosition": [], "centroids": [], "centroidEdges": []});
        
        await Promise.resolve();
    };

    return (
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
                className="small-input"
                value={inputDelayValue}
                onChange={handleInputDelayChange}
                placeholder="Delay"
            />
            <div className="control-panel">
                <button className="visual-button" onClick={zoomIn} title="Zoom In">
                    <FontAwesomeIcon icon={faSearchPlus} />
                </button>
                <button className="visual-button" onClick={zoomOut} title="Zoom Out">
                    <FontAwesomeIcon icon={faSearchMinus} />
                </button>
                <button className="visual-button" onClick={resetZoom} title="Reset Zoom">
                    <FontAwesomeIcon icon={faSync} />
                </button>
            </div>
            
            <button className="visual-button" onClick={clear} title="Clear">
                <FontAwesomeIcon icon={faTrash} />
            </button>
            <select value={algorithm} onChange={handleAlgorithmChange}>
                <option value="delaunay">Delaunay</option>
                <option value="fortune">Fortune</option>
            </select>
            <button className="visual-button" onClick={run} title="Run">
                <FontAwesomeIcon icon={faPlay} />
            </button>
        </div>
    );
}

export default CanvasDisplay;