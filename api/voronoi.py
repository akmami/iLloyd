from shapely.geometry import Polygon, box, LineString
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.views.decorators.csrf import csrf_exempt
from scipy.spatial import Voronoi
import logging
import numpy as np
from . import helper

logger = logging.getLogger(__name__)

@csrf_exempt
@api_view(["POST", ])
def delaunay(request):
    data = request.data
    
    if "points" not in data or "boundaries" not in data:
        return Response({"error": "Missing points."}, status=status.HTTP_400_BAD_REQUEST)
    
    points = np.array(data["points"])
    
    vor = Voronoi(points)

    min_x, min_y = data["boundaries"]["min_x"], data["boundaries"]["min_y"]
    max_x, max_y = data["boundaries"]["max_x"], data["boundaries"]["max_y"]

    boundary = box(min_x, min_y, max_x, max_y)
    
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
            t /= np.linalg.norm(t)
            n = np.array([-t[1], t[0]])

            midpoint = vor.points[[p1, p2]].mean(axis=0)
            direction = np.sign(np.dot(midpoint - center, n)) * n

            # extend ray sufficiently far
            ray_length = 1000
            ray_endpoint = vor.vertices[v_finite] + direction * ray_length
            edges.append((vor.vertices[v_finite].tolist(), ray_endpoint.tolist()))
        else:
            edges.append((vor.vertices[v1].tolist(), vor.vertices[v2].tolist()))
    
    centroids = []
    centroid_edges = []
    for point_idx, region_idx in enumerate(vor.point_region):
        vertices = vor.regions[region_idx]
        
        # Filter out open regions which have -1 as vertex
        if -1 in vertices:
            continue
        
        # Get the polygon points for the cell
        poly_points = [vor.vertices[i] for i in vertices]
        polygon = Polygon(poly_points)
        
        # Clip the polygon with the boundary
        clipped_polygon = polygon.intersection(boundary)
        
        # Calculate the centroid of the clipped polygon
        if not clipped_polygon.is_empty:
            centroid = clipped_polygon.centroid.coords[0]  # Returns a tuple (x, y)
            centroids.append([centroid[0], centroid[1]])
            centroid_edges.append( [points[point_idx].tolist(), [centroid[0], centroid[1]] ] )
        #else:
            # Handle cases where the clipping results in an empty polygon
            # return Response({}, status=status.HTTP_400_BAD_REQUEST)

    return Response({"points": points, "edges": edges, "centroids": centroids, "centroid_edges": centroid_edges}, status=status.HTTP_200_OK)


@csrf_exempt
@api_view(["POST", ])
def fortune(request):
    data = request.data
    
    if "points" not in data or "boundaries" not in data:
        return Response({"error": "Missing points."}, status=status.HTTP_400_BAD_REQUEST)
    
    points = np.array(data["points"])

    voronoi_edges = []
    active_arcs = None

    event_queue_sites = helper.PriorityQueue()
    event_queue_circles = helper.PriorityQueue()

    min_x, min_y = data["boundaries"]["min_x"], data["boundaries"]["min_y"]
    max_x, max_y = data["boundaries"]["max_x"], data["boundaries"]["max_y"]

    # insert points into the site events queue and update the bounding box
    for pt in points:
        event_point = helper.Point(pt[0], pt[1])
        event_queue_sites.push(event_point)
        min_x = min(min_x, event_point.x)
        min_y = min(min_y, event_point.y)
        max_x = max(max_x, event_point.x)
        max_y = max(max_y, event_point.y)

    # expand the bounding box by a margin
    dx = (max_x - min_x + 1) / 5.0
    dy = (max_y - min_y + 1) / 5.0
    min_x -= dx
    max_x += dx
    min_y -= dy
    max_y += dy

    # process events
    while not event_queue_sites.empty():
        if not event_queue_circles.empty() and (event_queue_circles.top().x <= event_queue_sites.top().x):            
            # handle circle event
            current_event = event_queue_circles.pop()

            if current_event.valid:
                new_edge = helper.Segment(current_event.point)
                voronoi_edges.append(new_edge)

                # remove the associated arc and update neighboring arcs
                current_arc = current_event.arc
                if current_arc.prev is not None:
                    current_arc.prev.next = current_arc.next
                    current_arc.prev.right_segment = new_edge
                if current_arc.next is not None:
                    current_arc.next.prev = current_arc.prev
                    current_arc.next.left_segment = new_edge

                # complete edges connected to the removed arc
                if current_arc.left_segment is not None: 
                    current_arc.left_segment.finish(current_event.point)
                if current_arc.right_segment is not None: 
                    current_arc.right_segment.finish(current_event.point)

                # recheck circle events on either side of the removed arc
                if current_arc.prev is not None: helper.check_circle_event(current_arc.prev, min_x, event_queue_circles)
                if current_arc.next is not None: helper.check_circle_event(current_arc.next, min_x, event_queue_circles)
        
        else:
            # handle site event
            point = event_queue_sites.pop()
            # insert new arc for the site event
            if active_arcs is None:
                active_arcs = helper.Arc(point)
            else:
                # find the arc above the new site point and insert the new arc
                found_intersection = False
                arc = active_arcs
                while arc is not None:
                    intersects, intersection_point = helper.intersect(point, arc)
                    if intersects:
                        # the new parabola intersects the arc at this point in the beach line
                        intersects_next, _ = helper.intersect(point, arc.next)
                        if arc.next is not None and not intersects_next:
                            arc.next.prev = helper.Arc(arc.point, arc, arc.next)
                            arc.next = arc.next.prev
                        else:
                            arc.next = helper.Arc(arc.point, arc)
                        arc.next.right_segment = arc.right_segment

                        # insert the new point between arc and arc.next
                        arc.next.prev = helper.Arc(point, arc, arc.next)
                        arc.next = arc.next.prev

                        arc = arc.next

                        # create new edges at the intersection points
                        new_segment = helper.Segment(intersection_point)
                        voronoi_edges.append(new_segment)
                        arc.prev.right_segment = arc.left_segment = new_segment

                        new_segment = helper.Segment(intersection_point)
                        voronoi_edges.append(new_segment)
                        arc.next.left_segment = arc.right_segment = new_segment

                        # check for potential circle events around the new arc
                        helper.check_circle_event(arc, min_x, event_queue_circles)
                        helper.check_circle_event(arc.prev, min_x, event_queue_circles)
                        helper.check_circle_event(arc.next, min_x, event_queue_circles)

                        found_intersection = True
                        break
                    
                    arc = arc.next

                if not found_intersection:
                    # if the new point does not intersect with any existing arcs, append it to the end of the list
                    arc = active_arcs
                    while arc.next is not None:
                        arc = arc.next
                    arc.next = helper.Arc(point, arc)
                    
                    # insert a new segment between the new point and the last arc on the beach line
                    mid_y = (arc.next.point.y + arc.point.y) / 2.0
                    start_point = helper.Point(min_x, mid_y)

                    new_segment = helper.Segment(start_point)
                    arc.right_segment = arc.next.left_segment = new_segment
                    voronoi_edges.append(new_segment)


    # finalize diagram by processing remaining circle events
    while not event_queue_circles.empty():
        current_event = event_queue_circles.pop()

        if current_event.valid:
            new_edge = helper.Segment(current_event.point)
            voronoi_edges.append(new_edge)

            # remove the associated arc and update neighboring arcs
            arc = current_event.arc
            if arc.prev is not None:
                arc.prev.next = arc.next
                arc.prev.right_segment = new_edge
            if arc.next is not None:
                arc.next.prev = arc.prev
                arc.next.left_segment = new_edge

            # complete edges connected to the removed arc
            if arc.left_segment is not None: arc.left_segment.finish(current_event.point)
            if arc.right_segment is not None: arc.right_segment.finish(current_event.point)

            # recheck circle events on either side of the removed arc
            if arc.prev is not None: helper.check_circle_event(arc.prev, min_x, event_queue_circles)
            if arc.next is not None: helper.check_circle_event(arc.next, min_x, event_queue_circles)

    
    l = max_x + (max_x - min_x) + (max_y - min_y)
    current_arc = active_arcs
    while current_arc.next is not None:
        if current_arc.right_segment is not None:
            point = helper.intersection(current_arc.point, current_arc.next.point, l*2.0)
            current_arc.right_segment.finish(point)
        current_arc = current_arc.next

    # convert edges to a list of tuples for output
    edges = []
    for edge in voronoi_edges:
        start_point = edge.start
        end_point = edge.end
        edges.append((start_point.x, start_point.y, end_point.x, end_point.y))

    return Response({"points": points, "edges": edges, "centroids": [], "centroid_edges": []}, status=status.HTTP_200_OK)