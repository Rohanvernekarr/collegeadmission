from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Conversation, Message, MessageAttachment

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user info for messaging"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'full_name', 'role']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class MessageAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageAttachment
        fields = ['id', 'filename', 'file', 'file_size', 'uploaded_at']


class MessageSerializer(serializers.ModelSerializer):
    sender = UserBasicSerializer(read_only=True)
    attachments = MessageAttachmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'content', 'sender', 'sent_at', 'is_read', 'read_at', 'attachments']
        read_only_fields = ['sender', 'sent_at', 'is_read', 'read_at']


class MessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['content']


class ConversationSerializer(serializers.ModelSerializer):
    officer = UserBasicSerializer(read_only=True)
    applicant = UserBasicSerializer(read_only=True)
    last_message = MessageSerializer(read_only=True)
    unread_count = serializers.SerializerMethodField()
    messages_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'officer', 'applicant', 'application', 'subject',
            'created_at', 'updated_at', 'is_active', 'last_message',
            'unread_count', 'messages_count'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return 0
        
        if request.user.role == 'admission_officer':
            return obj.unread_count_for_officer
        elif request.user.role == 'applicant':
            return obj.unread_count_for_applicant
        return 0
    
    def get_messages_count(self, obj):
        return obj.messages.count()


class ConversationCreateSerializer(serializers.ModelSerializer):
    applicant_id = serializers.IntegerField()
    application_id = serializers.IntegerField(required=False)
    initial_message = serializers.CharField(write_only=True)
    
    class Meta:
        model = Conversation
        fields = ['applicant_id', 'application_id', 'subject', 'initial_message']
    
    def validate_applicant_id(self, value):
        try:
            user = User.objects.get(id=value, role='applicant')
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid applicant ID")
    
    def create(self, validated_data):
        applicant_id = validated_data.pop('applicant_id')
        application_id = validated_data.pop('application_id', None)
        initial_message_content = validated_data.pop('initial_message')
        
        # Get the officer (current user)
        officer = self.context['request'].user
        applicant = User.objects.get(id=applicant_id)
        
        # Create conversation
        conversation = Conversation.objects.create(
            officer=officer,
            applicant=applicant,
            application_id=application_id,
            **validated_data
        )
        
        # Create initial message
        Message.objects.create(
            conversation=conversation,
            sender=officer,
            content=initial_message_content
        )
        
        return conversation


class ConversationDetailSerializer(serializers.ModelSerializer):
    officer = UserBasicSerializer(read_only=True)
    applicant = UserBasicSerializer(read_only=True)
    messages = MessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'officer', 'applicant', 'application', 'subject',
            'created_at', 'updated_at', 'is_active', 'messages'
        ]