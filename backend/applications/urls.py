from django.urls import path
from . import views

urlpatterns = [
    path('', views.ApplicationListView.as_view(), name='application-list'),
    path('create/', views.ApplicationCreateView.as_view(), name='application-create'),
    path('<uuid:pk>/', views.ApplicationDetailView.as_view(), name='application-detail'),
    path('<uuid:pk>/submit/', views.ApplicationSubmitView.as_view(), name='application-submit'),
    path('<uuid:pk>/status/', views.update_application_status, name='application-status-update'),
    path('documents/upload/', views.DocumentUploadView.as_view(), name='document-upload'),
     path('documents/<int:pk>/verify/', views.verify_document, name='document-verify'),
    path('has-applied/<int:program_id>/', views.has_applied, name='application-has-applied'),
]
