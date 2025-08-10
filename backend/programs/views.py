from rest_framework import generics, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Department, Program, RequiredDocument
from .serializers import DepartmentSerializer, ProgramSerializer, ProgramListSerializer, RequiredDocumentSerializer

class DepartmentListView(generics.ListAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.AllowAny]

class ProgramListView(generics.ListAPIView):
    queryset = Program.objects.filter(status='active')
    serializer_class = ProgramListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]  # Fixed this line
    filterset_fields = ['program_type', 'department', 'status']
    search_fields = ['name', 'code', 'description', 'department__name']
    ordering_fields = ['name', 'fees_per_semester', 'application_end_date']
    ordering = ['name']

class ProgramDetailView(generics.RetrieveAPIView):
    queryset = Program.objects.all()
    serializer_class = ProgramSerializer
    permission_classes = [permissions.AllowAny]

class ProgramCreateView(generics.CreateAPIView):
    queryset = Program.objects.all()
    serializer_class = ProgramSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        # Only admin users can create programs
        if self.request.user.role != 'admin':
            raise PermissionDenied("Only administrators can create programs")
        serializer.save()
        
    def create(self, request, *args, **kwargs):
        # Debug logging
        print(f"User: {request.user.username}, Role: {request.user.role}")
        print(f"Request data: {request.data}")
        
        return super().create(request, *args, **kwargs)

class ProgramUpdateView(generics.UpdateAPIView):
    queryset = Program.objects.all()
    serializer_class = ProgramSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_update(self, serializer):
        # Only admin users can update programs
        if self.request.user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only administrators can update programs")
        serializer.save()

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def program_required_documents(request, program_id):
    """Get required documents for a specific program"""
    try:
        program = Program.objects.get(id=program_id)
        documents = program.required_documents.all()
        serializer = RequiredDocumentSerializer(documents, many=True)
        return Response(serializer.data)
    except Program.DoesNotExist:
        return Response({'error': 'Program not found'}, status=404)



class ProgramDeleteView(generics.DestroyAPIView):
    queryset = Program.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_destroy(self, instance):
        # Only admin users can delete programs
        if self.request.user.role != 'admin':
            raise PermissionDenied("Only administrators can delete programs")
        
        # Check if program has applications
        if instance.applications.exists():
            raise ValidationError("Cannot delete program with existing applications")
        
        instance.delete()

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ValidationError as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

# Enhanced views for document requirements
class RequiredDocumentCreateView(generics.CreateAPIView):
    queryset = RequiredDocument.objects.all()
    serializer_class = RequiredDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        if self.request.user.role != 'admin':
            raise PermissionDenied("Only administrators can manage document requirements")
        serializer.save()

class RequiredDocumentUpdateView(generics.RetrieveUpdateDestroyAPIView):
    queryset = RequiredDocument.objects.all()
    serializer_class = RequiredDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_update(self, serializer):
        if self.request.user.role != 'admin':
            raise PermissionDenied("Only administrators can manage document requirements")
        serializer.save()
        
    def perform_destroy(self, instance):
        if self.request.user.role != 'admin':
            raise PermissionDenied("Only administrators can manage document requirements")
        instance.delete()