from rest_framework import serializers
from django.utils import timezone
from .models import Application, ApplicationDocument, ApplicationStatusHistory
from programs.serializers import ProgramListSerializer

class ApplicationDocumentSerializer(serializers.ModelSerializer):
    # Accept application in incoming payload; allow omission because view sets it
    application = serializers.PrimaryKeyRelatedField(
        queryset=Application.objects.all(), write_only=True, required=False
    )
    document_type_name = serializers.CharField(source='document_type.document_name', read_only=True)
    is_mandatory = serializers.BooleanField(source='document_type.is_mandatory', read_only=True)
    
    class Meta:
        model = ApplicationDocument
        fields = [
            'id', 'application', 'document_type', 'document_type_name', 'file', 'original_filename',
            'file_size', 'uploaded_at', 'verified', 'verification_notes', 'is_mandatory'
        ]
        read_only_fields = ['original_filename', 'file_size', 'uploaded_at', 'verified', 'verification_notes']

    def create(self, validated_data):
        # If application was not provided explicitly, try to pull it from context
        if 'application' not in validated_data:
            application = self.context.get('application')
            if application is not None:
                validated_data['application'] = application
        return super().create(validated_data)

class ApplicationStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.get_full_name', read_only=True)
    
    class Meta:
        model = ApplicationStatusHistory
        fields = '__all__'

class ApplicationSerializer(serializers.ModelSerializer):
    program = ProgramListSerializer(read_only=True)
    program_id = serializers.IntegerField(write_only=True, required=False)
    documents = ApplicationDocumentSerializer(many=True, read_only=True)
    status_history = ApplicationStatusHistorySerializer(many=True, read_only=True)
    application_number = serializers.ReadOnlyField()
    is_complete = serializers.ReadOnlyField()
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    phone = serializers.CharField(source='user.phone_number', read_only=True)
    program_name = serializers.CharField(source='program.name', read_only=True)
    # Optional academic fields should not error when left blank in forms
    twelfth_percentage = serializers.FloatField(required=False, allow_null=True)
    twelfth_year = serializers.IntegerField(required=False, allow_null=True)
    graduation_percentage = serializers.FloatField(required=False, allow_null=True)
    graduation_year = serializers.IntegerField(required=False, allow_null=True)
    
    class Meta:
        model = Application
        fields = '__all__'
        read_only_fields = [
            'user', 'submitted_at', 'reviewed_by', 'review_notes', 
            'created_at', 'updated_at'
        ]

    def to_internal_value(self, data):
        # Coerce empty strings for optional numeric fields to None so DRF doesn't raise
        data = data.copy()
        for key in ['twelfth_percentage', 'twelfth_year', 'graduation_percentage', 'graduation_year']:
            if key in data and data.get(key) == '':
                data[key] = None
        return super().to_internal_value(data)

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
    program = serializers.IntegerField(source='program.id', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    application_number = serializers.ReadOnlyField()
    is_complete = serializers.ReadOnlyField()
    
    class Meta:
        model = Application
        fields = [
            'id', 'application_number', 'program', 'program_name', 'department_name',
            'user_name',
            'status', 'is_complete', 'submitted_at', 'created_at', 'updated_at',
            # academic highlights for tables
            'tenth_percentage', 'twelfth_percentage'
        ]
