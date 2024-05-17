import React, { createContext, useState, useContext, useRef } from 'react';

const CanvasContext = createContext();

export const useCanvas = () => useContext(CanvasContext);

export const CanvasProvider = ({ children }) => {
    
    const [data, setData] = useState({"points": [], "edges": [], "lastPosition": [], "centroids": [], "centroidEdges": []});
    const [scale, setScale] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [addPointState, setAddPointState] = useState(false);
    const canvasRef = useRef(null);


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


    const value = {
        canvasRef,
        data,
        setData,
        scale,
        setScale,
        addPoint,
        handleMouseDown,
        handleMouseUp,
        handleMouseMove,
        isDragging,
        addPointState,
        setAddPointState
    };
    

    return (
        <CanvasContext.Provider value={value}>
            {children}
        </CanvasContext.Provider>
    );
};
