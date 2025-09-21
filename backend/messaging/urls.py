from django.urls import path
from . import views

urlpatterns = [
    # Conversation endpoints
    path('conversations/', views.ConversationListCreateView.as_view(), name='conversation-list-create'),
    path('conversations/<int:pk>/', views.ConversationDetailView.as_view(), name='conversation-detail'),
    path('conversations/<int:conversation_id>/messages/', views.MessageListCreateView.as_view(), name='message-list-create'),
    
    # Message endpoints
    path('messages/<int:message_id>/read/', views.mark_message_read, name='mark-message-read'),
    
    # Utility endpoints
    path('stats/', views.conversation_stats, name='messaging-stats'),
    path('applicants/', views.available_applicants, name='available-applicants'),
]