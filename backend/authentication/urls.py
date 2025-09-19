from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views, admin_views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('admin/login/', views.AdminLoginView.as_view(), name='admin-login'),
    path('officer/login/', views.OfficerLoginView.as_view(), name='officer-login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Admin user management
    path('admin/users/', admin_views.UserListView.as_view(), name='admin-user-list'),
    path('admin/users/create/', admin_views.CreateUserView.as_view(), name='admin-user-create'),
    path('admin/users/<int:pk>/', admin_views.UserDetailView.as_view(), name='admin-user-detail'),
    path('admin/users/<int:pk>/toggle-status/', admin_views.toggle_user_status, name='admin-user-toggle'),
    path('admin/users/<int:pk>/verify/', admin_views.verify_user, name='admin-user-verify'),
    path('admin/users/statistics/', admin_views.user_statistics, name='admin-user-statistics'),
]
