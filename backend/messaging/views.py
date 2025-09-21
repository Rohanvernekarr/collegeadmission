from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Conversation, Message
from .serializers import (
    ConversationSerializer, ConversationCreateSerializer, ConversationDetailSerializer,
    MessageSerializer, MessageCreateSerializer
)

User = get_user_model()


class ConversationListCreateView(generics.ListCreateAPIView):
    """
    List conversations for the current user or create a new conversation
    Only officers can create conversations
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ConversationCreateSerializer
        return ConversationSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admission_officer':
            return Conversation.objects.filter(officer=user, is_active=True)
        elif user.role == 'applicant':
            return Conversation.objects.filter(applicant=user, is_active=True)
        return Conversation.objects.none()
    
    def perform_create(self, serializer):
        # Only officers can create conversations
        if self.request.user.role != 'admission_officer':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admission officers can initiate conversations")
        
        serializer.save()


class ConversationDetailView(generics.RetrieveUpdateAPIView):
    """
    Get conversation details with all messages
    """
    serializer_class = ConversationDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admission_officer':
            return Conversation.objects.filter(officer=user)
        elif user.role == 'applicant':
            return Conversation.objects.filter(applicant=user)
        return Conversation.objects.none()
    
    def retrieve(self, request, *args, **kwargs):
        conversation = self.get_object()
        
        # Mark messages as read for the current user
        if request.user.role == 'admission_officer':
            # Mark applicant's messages as read
            Message.objects.filter(
                conversation=conversation,
                sender=conversation.applicant,
                is_read=False
            ).update(is_read=True, read_at=timezone.now())
        elif request.user.role == 'applicant':
            # Mark officer's messages as read
            Message.objects.filter(
                conversation=conversation,
                sender=conversation.officer,
                is_read=False
            ).update(is_read=True, read_at=timezone.now())
        
        return super().retrieve(request, *args, **kwargs)


class MessageListCreateView(generics.ListCreateAPIView):
    """
    List messages in a conversation or send a new message
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MessageCreateSerializer
        return MessageSerializer
    
    def get_queryset(self):
        conversation_id = self.kwargs['conversation_id']
        conversation = get_object_or_404(Conversation, id=conversation_id)
        
        # Check if user is part of this conversation
        user = self.request.user
        if user not in [conversation.officer, conversation.applicant]:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You don't have access to this conversation")
        
        return Message.objects.filter(conversation=conversation).order_by('-sent_at')
    
    def perform_create(self, serializer):
        conversation_id = self.kwargs['conversation_id']
        conversation = get_object_or_404(Conversation, id=conversation_id)
        
        # Check if user is part of this conversation
        user = self.request.user
        if user not in [conversation.officer, conversation.applicant]:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You don't have access to this conversation")
        
        # Save message
        message = serializer.save(
            conversation=conversation,
            sender=user
        )
        
        # Update conversation timestamp
        conversation.save(update_fields=['updated_at'])


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_message_read(request, message_id):
    """Mark a specific message as read"""
    message = get_object_or_404(Message, id=message_id)
    
    # Check if user is the recipient of this message
    conversation = message.conversation
    user = request.user
    
    if user not in [conversation.officer, conversation.applicant]:
        return Response(
            {'error': 'You don\'t have access to this message'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Only mark as read if the user is not the sender
    if message.sender != user:
        message.mark_as_read()
        return Response({'message': 'Message marked as read'})
    
    return Response({'message': 'Cannot mark your own message as read'})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def conversation_stats(request):
    """Get messaging statistics for the current user"""
    user = request.user
    
    if user.role == 'admission_officer':
        conversations = Conversation.objects.filter(officer=user, is_active=True)
        unread_count = sum(conv.unread_count_for_officer for conv in conversations)
    elif user.role == 'applicant':
        conversations = Conversation.objects.filter(applicant=user, is_active=True)
        unread_count = sum(conv.unread_count_for_applicant for conv in conversations)
    else:
        conversations = Conversation.objects.none()
        unread_count = 0
    
    return Response({
        'total_conversations': conversations.count(),
        'unread_messages': unread_count,
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def available_applicants(request):
    """Get list of applicants that officers can message (only for officers)"""
    if request.user.role != 'admission_officer':
        return Response(
            {'error': 'Only admission officers can access this endpoint'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get applicants who have submitted applications
    from applications.models import Application
    applicant_ids = Application.objects.values_list('user_id', flat=True).distinct()
    applicants = User.objects.filter(id__in=applicant_ids, role='applicant')
    
    from .serializers import UserBasicSerializer
    serializer = UserBasicSerializer(applicants, many=True)
    return Response(serializer.data)