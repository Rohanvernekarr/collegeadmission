from django.urls import path
from . import views, admin_views

urlpatterns = [
    path('departments/', views.DepartmentListView.as_view(), name='department-list'),
    path('', views.ProgramListView.as_view(), name='program-list'),
    path('create/', views.ProgramCreateView.as_view(), name='program-create'),
    path('<int:pk>/', views.ProgramDetailView.as_view(), name='program-detail'),
    path('<int:pk>/update/', views.ProgramUpdateView.as_view(), name='program-update'),
    path('<int:pk>/delete/', views.ProgramDeleteView.as_view(), name='program-delete'),  # Add delete
    path('<int:program_id>/documents/', views.program_required_documents, name='program-documents'),
    
    # Document requirements management
    path('documents/create/', views.RequiredDocumentCreateView.as_view(), name='document-requirement-create'),
    path('documents/<int:pk>/', views.RequiredDocumentUpdateView.as_view(), name='document-requirement-update'),
    
    # Admin department management
    path('departments/create/', admin_views.DepartmentCreateView.as_view(), name='admin-department-create'),
    path('departments/<int:pk>/update/', admin_views.DepartmentUpdateView.as_view(), name='admin-department-update'),
    path('departments/<int:pk>/delete/', admin_views.DepartmentDeleteView.as_view(), name='admin-department-delete'),
    path('departments/statistics/', admin_views.department_statistics, name='admin-department-statistics'),
]
