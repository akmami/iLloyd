import json
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.views.decorators.csrf import csrf_exempt
from scipy.spatial import Voronoi
import logging
import numpy as np

logger = logging.getLogger(__name__)

@csrf_exempt
@api_view(["POST", ])
def default(request):
    data = request.data
    
    if "points" not in data:
        return Response({"error": "Missing points."}, status=status.HTTP_400_BAD_REQUEST)
    
    points = data["points"]
    
    vor = Voronoi(points)
    
    edges = []
    center = vor.points.mean(axis=0)  # compute the center of all points

    for point_idx, (p1, p2) in enumerate(vor.ridge_points):
        v1, v2 = vor.ridge_vertices[point_idx]

        if -1 in (v1, v2):  # semi-infinite edge
            if v1 == -1:
                v_finite = v2
            else:
                v_finite = v1

            # compute the direction of the ray
            t = vor.points[p2] - vor.points[p1]
            t = t / np.linalg.norm(t)
            n = np.array([-t[1], t[0]])

            midpoint = vor.points[[p1, p2]].mean(axis=0)
            direction = np.sign(np.dot(midpoint - center, n)) * n

            # extend ray sufficiently far
            ray_length = 1000
            ray_endpoint = vor.vertices[v_finite] + direction * ray_length
            edges.append((vor.vertices[v_finite], ray_endpoint))
        else:
            edges.append((vor.vertices[v1], vor.vertices[v2]))

    
    cells = {}
    for point_idx, region_idx in enumerate(vor.point_region):
        vertices = vor.regions[region_idx]
        if -1 not in vertices:
            cell_vertices = [vor.vertices[i] for i in vertices]
            cells[point_idx] = cell_vertices
       
    centroids = []
    for point_idx, cell_vertices in cells.items():
        cell_vertices = np.array(cell_vertices)
        centroid = cell_vertices.mean(axis=0)
        centroids.append(centroid)
    
    centroid_edges = []
    for point_idx, cell_vertices in cells.items():
        cell_vertices = np.array(cell_vertices)
        centroid = cell_vertices.mean(axis=0)
        centroid_edges.append( [points[point_idx], centroid] )
    
    return Response({"points": points, "edges": edges, "centroids": centroids, "centroid_edges": centroid_edges}, status=status.HTTP_200_OK)


@csrf_exempt
@api_view(["POST", ])
def delaunay(request):

    data = request.data
    
    if "points" not in data:
        return Response({"error": "Missing points."}, status=status.HTTP_400_BAD_REQUEST)
    
    points = data["points"]

    edges = []

    centroids = []

    centroid_edges = []

    return Response({"points": points, "edges": edges, "centroids": centroids, "centroid_edges": centroid_edges}, status=status.HTTP_200_OK)