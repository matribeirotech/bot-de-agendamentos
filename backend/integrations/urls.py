from django.urls import path
from .views import GoogleAuthURLView, GoogleAuthCallbackView

urlpatterns = [
    path('google/auth-url/', GoogleAuthURLView.as_view(), name='google_auth_url'),
    path('google/callback/', GoogleAuthCallbackView.as_view(), name='google_callback'),
]

