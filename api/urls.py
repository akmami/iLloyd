from django.urls import path

from . import voronoi

urlpatterns = [
    path("default/", voronoi.default),
    path("delaunay/", voronoi.delaunay),
]