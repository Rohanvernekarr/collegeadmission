from django.db import models
from django.conf import settings
from programs.models import Program, RequiredDocument
import uuid
import os

def application_document_path(instance, filename):
    """Generate file path for application documents"""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return f"applications/{instance.application.user.id}/{instance.application.id}/{filename}"

class Application(models.Model):
    APPLICATION_STATUS = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('shortlisted', 'Shortlisted'),
        ('admitted', 'Admitted'),
        ('rejected', 'Rejected'),
        ('waitlisted', 'Waitlisted'),
        ('withdrawn', 'Withdrawn'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='applications')
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='applications')
    
    # Personal Information
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10, choices=[
        ('male', 'Male'), ('female', 'Female'), ('other', 'Other')
    ])
    nationality = models.CharField(max_length=100, default='Indian')
    
    # Contact Information
    permanent_address = models.TextField()
    current_address = models.TextField(blank=True)
    emergency_contact_name = models.CharField(max_length=200)
    emergency_contact_phone = models.CharField(max_length=15)
    emergency_contact_relation = models.CharField(max_length=100)
    
    # Academic Information
    tenth_percentage = models.FloatField()
    tenth_board = models.CharField(max_length=200)
    tenth_year = models.PositiveIntegerField()
    
    twelfth_percentage = models.FloatField(null=True, blank=True)
    twelfth_board = models.CharField(max_length=200, blank=True)
    twelfth_year = models.PositiveIntegerField(null=True, blank=True)
    
    graduation_percentage = models.FloatField(null=True, blank=True)
    graduation_university = models.CharField(max_length=200, blank=True)
    graduation_year = models.PositiveIntegerField(null=True, blank=True)
    graduation_degree = models.CharField(max_length=200, blank=True)
    
    # Additional Information
    extracurricular_activities = models.TextField(blank=True)
    work_experience = models.TextField(blank=True)
    statement_of_purpose = models.TextField(blank=True)
    
    # Application Management
    status = models.CharField(max_length=20, choices=APPLICATION_STATUS, default='draft')
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, blank=True, 
        related_name='reviewed_applications'
    )
    review_notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'program']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.program.name}"

    @property
    def application_number(self):
        return f"APP{self.created_at.year}{str(self.id)[:8].upper()}"

    @property
    def is_complete(self):
        """Check if application has all required documents"""
        required_docs = self.program.required_documents.filter(is_mandatory=True)
        uploaded_docs = self.documents.filter(document_type__in=required_docs)
        return required_docs.count() == uploaded_docs.count()

class ApplicationDocument(models.Model):
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='documents')
    document_type = models.ForeignKey(RequiredDocument, on_delete=models.CASCADE)
    file = models.FileField(upload_to=application_document_path)
    original_filename = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField()  # in bytes
    uploaded_at = models.DateTimeField(auto_now_add=True)
    verified = models.BooleanField(default=False)
    verification_notes = models.TextField(blank=True)

    class Meta:
        unique_together = ['application', 'document_type']

    def __str__(self):
        return f"{self.application.application_number} - {self.document_type.document_name}"

    def delete(self, *args, **kwargs):
        """Delete file when model instance is deleted"""
        if self.file and os.path.isfile(self.file.path):
            os.remove(self.file.path)
        super().delete(*args, **kwargs)

class ApplicationStatusHistory(models.Model):
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='status_history')
    previous_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    change_reason = models.TextField(blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-changed_at']

    def __str__(self):
        return f"{self.application.application_number}: {self.previous_status} → {self.new_status}"
