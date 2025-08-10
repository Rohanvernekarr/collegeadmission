from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Department, Program
from .serializers import DepartmentSerializer

class DepartmentCreateView(generics.CreateAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        if self.request.user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only administrators can create departments")
        serializer.save()

class DepartmentUpdateView(generics.RetrieveUpdateAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_update(self, serializer):
        if self.request.user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only administrators can update departments")
        serializer.save()

class DepartmentDeleteView(generics.DestroyAPIView):
    queryset = Department.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_destroy(self, instance):
        if self.request.user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only administrators can delete departments")
        
        # Check if department has programs
        if instance.programs.exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Cannot delete department with existing programs")
        
        instance.delete()

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def department_statistics(request):
    """Get department statistics"""
    if request.user.role != 'admin':
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    departments = Department.objects.all()
    stats = []
    
    for dept in departments:
        program_count = dept.programs.count()
        active_programs = dept.programs.filter(status='active').count()
        
        stats.append({
            'id': dept.id,
            'name': dept.name,
            'code': dept.code,
            'total_programs': program_count,
            'active_programs': active_programs,
            'created_at': dept.created_at
        })
    
    return Response(stats)
