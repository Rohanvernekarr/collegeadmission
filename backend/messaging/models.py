from django.db import models
from django.conf import settings
from django.utils import timezone


class Conversation(models.Model):
    """
    Represents a conversation between an officer and an applicant
    """
    officer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='officer_conversations',
        limit_choices_to={'role': 'admission_officer'}
    )
    applicant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='applicant_conversations',
        limit_choices_to={'role': 'applicant'}
    )
    application = models.ForeignKey(
        'applications.Application',
        on_delete=models.CASCADE,
        related_name='conversations',
        null=True,
        blank=True
    )
    subject = models.CharField(max_length=200, default="Application Discussion")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['officer', 'applicant', 'application']
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"Conversation: {self.officer.username} - {self.applicant.username}"
    
    @property
    def last_message(self):
        return self.messages.first()
    
    @property
    def unread_count_for_officer(self):
        return self.messages.filter(sender=self.applicant, is_read=False).count()
    
    @property
    def unread_count_for_applicant(self):
        return self.messages.filter(sender=self.officer, is_read=False).count()


class Message(models.Model):
    """
    Individual messages within a conversation
    """
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    content = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-sent_at']
    
    def __str__(self):
        return f"Message from {self.sender.username} at {self.sent_at}"
    
    def mark_as_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])


class MessageAttachment(models.Model):
    """
    File attachments for messages
    """
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name='attachments'
    )
    file = models.FileField(upload_to='message_attachments/%Y/%m/%d/')
    filename = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField()
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Attachment: {self.filename}"