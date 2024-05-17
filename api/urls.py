from django.urls import path

from . import voronoi

urlpatterns = [
    path("delaunay/", voronoi.delaunay),
    path("fortune/", voronoi.fortune),
]