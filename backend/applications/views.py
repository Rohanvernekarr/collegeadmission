from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from django.db import transaction
import logging
from .models import Application, ApplicationDocument, ApplicationStatusHistory
from .serializers import ApplicationSerializer, ApplicationListSerializer, ApplicationDocumentSerializer

class ApplicationListView(generics.ListAPIView):
    serializer_class = ApplicationListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'applicant':
            return Application.objects.filter(user=user)
        elif user.role in ['admin', 'admission_officer']:
            return Application.objects.all()
        return Application.objects.none()

class ApplicationCreateView(generics.CreateAPIView):
    queryset = Application.objects.all()
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        if self.request.user.role != 'applicant':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only applicants can create applications")
        serializer.save(user=self.request.user)

class ApplicationDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'applicant':
            return Application.objects.filter(user=user)
        elif user.role in ['admin', 'admission_officer']:
            return Application.objects.all()
        return Application.objects.none()

class ApplicationSubmitView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def patch(self, request, pk):
        try:
            application = Application.objects.get(pk=pk, user=request.user)
            
            if application.status != 'draft':
                return Response(
                    {'error': 'Application has already been submitted'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not application.is_complete:
                return Response(
                    {'error': 'Please upload all required documents before submitting'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            with transaction.atomic():
                # Update application status
                old_status = application.status
                application.status = 'submitted'
                application.submitted_at = timezone.now()
                application.save()
                
                # Create status history
                ApplicationStatusHistory.objects.create(
                    application=application,
                    previous_status=old_status,
                    new_status='submitted',
                    changed_by=request.user,
                    change_reason='Application submitted by applicant'
                )
            
            return Response({'message': 'Application submitted successfully'})
            
        except Application.DoesNotExist:
            return Response({'error': 'Application not found'}, status=404)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def has_applied(request, program_id: int):
    """Return whether the current user has already applied to the given program."""
    user = request.user
    if user.role != 'applicant':
        return Response({'has_applied': False})
    exists = Application.objects.filter(user=user, program_id=program_id).exists()
    return Response({'has_applied': exists})

class DocumentUploadView(generics.CreateAPIView):
    serializer_class = ApplicationDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        # Include resolved application in context if available
        application = getattr(self, '_application', None)
        if application is not None:
            context['application'] = application
        return context
    
    def create(self, request, *args, **kwargs):
        application_id = request.data.get('application')
        document_type = request.data.get('document_type')

        # Basic validation for required fields
        if not application_id:
            return Response({'application': ['This field is required.']}, status=status.HTTP_400_BAD_REQUEST)
        if not document_type:
            return Response({'document_type': ['This field is required.']}, status=status.HTTP_400_BAD_REQUEST)
        if 'file' not in request.FILES:
            return Response({'file': ['No file provided.']}, status=status.HTTP_400_BAD_REQUEST)

        try:
            application = Application.objects.get(id=application_id, user=request.user)

            if application.status not in ['draft']:
                return Response(
                    {'error': 'Documents cannot be uploaded after submission'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Application.DoesNotExist:
            return Response({'error': 'Application not found'}, status=404)

        # Stash application for use in perform_create
        self._application = application

        # IMPORTANT: Build serializer with data including resolved application and file
        data = request.data.copy()
        data['application'] = str(application.id)
        if 'file' in request.FILES:
            data['file'] = request.FILES['file']
        serializer = self.get_serializer(data=data)
        if not serializer.is_valid():
            logging.error("Document upload validation failed: %s", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_create(self, serializer):
        file_obj = self.request.FILES['file']
        # Retrieve application set in create(); fallback to fetching if not present
        application = getattr(self, '_application', None)
        if application is None:
            application_id = self.request.data.get('application')
            try:
                application = Application.objects.get(id=application_id, user=self.request.user)
            except Application.DoesNotExist:
                # In case of unexpected state; let serializer raise if required FK missing
                application = None

        serializer.save(
            application=application,
            original_filename=file_obj.name,
            file_size=file_obj.size
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_application_status(request, pk):
    """Update application status (Admin/Officer only)"""
    if request.user.role not in ['admin', 'admission_officer']:
        return Response(
            {'error': 'Permission denied'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        application = Application.objects.get(pk=pk)
        new_status = request.data.get('status')
        reason = request.data.get('reason', '')
        
        if new_status not in dict(Application.APPLICATION_STATUS):
            return Response({'error': 'Invalid status'}, status=400)
        
        with transaction.atomic():
            old_status = application.status
            application.status = new_status
            application.reviewed_by = request.user
            application.review_notes = reason
            application.save()
            
            # Create status history
            ApplicationStatusHistory.objects.create(
                application=application,
                previous_status=old_status,
                new_status=new_status,
                changed_by=request.user,
                change_reason=reason
            )
        
        return Response({'message': 'Status updated successfully'})
        
    except Application.DoesNotExist:
        return Response({'error': 'Application not found'}, status=404)
