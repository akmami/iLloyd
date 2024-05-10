from django.urls import include, path
from django.conf import settings

urlpatterns = [
    path(r'api/', include("api.urls")),
]