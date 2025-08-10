from rest_framework import serializers
from django.utils import timezone
from .models import Application, ApplicationDocument, ApplicationStatusHistory
from programs.serializers import ProgramListSerializer

class ApplicationDocumentSerializer(serializers.ModelSerializer):
    document_type_name = serializers.CharField(source='document_type.document_name', read_only=True)
    is_mandatory = serializers.BooleanField(source='document_type.is_mandatory', read_only=True)
    
    class Meta:
        model = ApplicationDocument
        fields = [
            'id', 'document_type', 'document_type_name', 'file', 'original_filename',
            'file_size', 'uploaded_at', 'verified', 'verification_notes', 'is_mandatory'
        ]
        read_only_fields = ['file_size', 'uploaded_at', 'verified', 'verification_notes']

class ApplicationStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.get_full_name', read_only=True)
    
    class Meta:
        model = ApplicationStatusHistory
        fields = '__all__'

class ApplicationSerializer(serializers.ModelSerializer):
    program = ProgramListSerializer(read_only=True)
    program_id = serializers.IntegerField(write_only=True)
    documents = ApplicationDocumentSerializer(many=True, read_only=True)
    status_history = ApplicationStatusHistorySerializer(many=True, read_only=True)
    application_number = serializers.ReadOnlyField()
    is_complete = serializers.ReadOnlyField()
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = Application
        fields = '__all__'
        read_only_fields = [
            'user', 'submitted_at', 'reviewed_by', 'review_notes', 
            'created_at', 'updated_at'
        ]

    def validate_program_id(self, value):
        """Validate that program accepts applications"""
        from programs.models import Program
        
        try:
            program = Program.objects.get(id=value)
            if not program.is_application_open:
                raise serializers.ValidationError("Applications are closed for this program")
            if program.available_seats <= 0:
                raise serializers.ValidationError("No seats available for this program")
        except Program.DoesNotExist:
            raise serializers.ValidationError("Invalid program selected")
        
        return value

    def validate(self, attrs):
        """Check if user already applied for this program"""
        if self.instance is None:  # Creating new application
            user = self.context['request'].user
            program_id = attrs.get('program_id')
            if Application.objects.filter(user=user, program_id=program_id).exists():
                raise serializers.ValidationError("You have already applied for this program")
        return attrs

class ApplicationListSerializer(serializers.ModelSerializer):
    """Simplified serializer for application listings"""
    program_name = serializers.CharField(source='program.name', read_only=True)
    department_name = serializers.CharField(source='program.department.name', read_only=True)
    application_number = serializers.ReadOnlyField()
    is_complete = serializers.ReadOnlyField()
    
    class Meta:
        model = Application
        fields = [
            'id', 'application_number', 'program_name', 'department_name',
            'status', 'is_complete', 'submitted_at', 'created_at', 'updated_at'
        ]
