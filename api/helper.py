import math
import heapq
import itertools


class Point:
    def __init__(self, x=0.0, y=0.0):
        self.x = x
        self.y = y


class Event:
    def __init__(self, x, point, arc):
        self.x = x
        self.point = point
        self.arc = arc
        self.valid = True


class Arc:
    def __init__(self, point, prev=None, next=None):
        self.point = point
        self.prev = prev
        self.next = next
        self.event = None
        self.left_segment = None
        self.right_segment = None


class Segment:
    def __init__(self, start_point):
        self.start = start_point
        self.end = None
        self.done = False

    def finish(self, point):
        if not self.done:
            self.end = point
            self.done = True


class PriorityQueue:
    def __init__(self):
        self.heap = []
        self.entry_finder = {}
        self.counter = itertools.count()

    def push(self, item):
        if item in self.entry_finder:
            return
        count = next(self.counter)
        entry = [item.x, count, item]
        self.entry_finder[item] = entry
        heapq.heappush(self.heap, entry)

    def remove_entry(self, item):
        if item in self.entry_finder:
            entry = self.entry_finder.pop(item)
            entry[-1] = "Removed"

    def pop(self):
        while self.heap:
            _, _, item = heapq.heappop(self.heap)
            if item != "Removed":
                del self.entry_finder[item]
                return item
        raise KeyError("pop from an empty priority queue")

    def top(self):
        while self.heap:
            _, _, item = heapq.heappop(self.heap)
            if item != "Removed":
                del self.entry_finder[item]
                self.push(item)
                return item
        raise KeyError("top from an empty priority queue")

    def empty(self):
        return not any(item != "Removed" for _, _, item in self.heap)


def circle(a, b, c):
    # calc determ to check if bc is a "right turn" from ab
    det = (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y)
    if det > 0: return False, None, None  # right turn, hence, no circle

    # algebra to find the circle center (o) and radius
    A, B, C, D = b.x - a.x, b.y - a.y, c.x - a.x, c.y - a.y
    E, F, G = A * (a.x + b.x) + B * (a.y + b.y), C * (a.x + c.x) + D*(a.y + c.y), 2 * ( A * (c.y - b.y) - B * (c.x - b.x) )
    
    if G == 0: return False, None, None  # co-linear points

    # circle center
    ox, oy = 1.0 * (D*E - B*F) / G, 1.0 * (A*F - C*E) / G
    circle_x = ox + math.sqrt( (a.x - ox)**2 + (a.y - oy)**2 )

    print(ox, oy)
    return True, circle_x, Point(ox, oy)


def intersect(point, arc):
    if arc is None or arc.point.x == point.x:
        return False, None

    if arc.prev is not None:
        a = intersection(arc.prev.point, arc.point, point.x).y
    if arc.next is not None:
        b = intersection(arc.point, arc.next.point, point.x).y

    if (arc.prev is None or a <= point.y) and (arc.next is None or point.y <= b):
        intersection_x = 1.0 * ((arc.point.x)**2 + (arc.point.y - point.y)**2 - point.x**2) / (2 * arc.point.x - 2 * point.x)
        print(intersection_x, point.y)
        return True, Point(intersection_x, point.y)

    return False, None


def intersection(p0, p1, sweep_line_x):
    # get the intersection of two parabola
    p = p0
    if p0.x == p1.x:
        py = (p0.y + p1.y) / 2.0
    elif p1.x == sweep_line_x:
        py = p1.y
    elif p0.x == sweep_line_x:
        py = p0.y
        p = p1
    else:
        # calc the intersection using the quadratic formula for the edge of the parabolas
        z0 = 2.0 * (p0.x - sweep_line_x)
        z1 = 2.0 * (p1.x - sweep_line_x)
        
        a = 1.0 / z0 - 1.0 / z1
        b = -2.0 * (p0.y / z0 - p1.y / z1)
        c = 1.0 * (p0.y**2 + p0.x**2 - sweep_line_x**2) / z0 - 1.0 * (p1.y**2 + p1.x**2 - sweep_line_x**2) / z1

        disc = b**2 - 4*a*c
        py = 1.0 * (-b - math.sqrt(disc)) / (2 * a)

    # calculating the x-coordinate of the intersection
    px = 1.0 * (p.x**2 + (p.y - py)**2 - sweep_line_x**2) / (2 * p.x - 2 * sweep_line_x)
    print(px, py)
    return Point(px, py)


def check_circle_event(arc, min_x, event_queue_circles):
    # invalidate the current event if it's not at the current sweep line position
    if arc.event and (arc.event.x != min_x):
        arc.event.valid = False
    arc.event = None

    # only arcs with both previous and next neighbors can create circle events
    if arc.prev is None or arc.next is None:
        return

    # calc potential circle event caused by the current arc and its neighbors
    is_circle_event, circle_x, lowest_point = circle(arc.prev.point, arc.point, arc.next.point)
    if is_circle_event and (circle_x > min_x):
        # create a new circle event if it is to the right of the sweep line
        arc.event = Event(circle_x, lowest_point, arc)
        event_queue_circles.push(arc.event)
