from rest_framework import serializers
from .models import Department, Program, RequiredDocument

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

class RequiredDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequiredDocument
        fields = '__all__'

class ProgramSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer(read_only=True)
    department_id = serializers.IntegerField(write_only=True)
    required_documents = RequiredDocumentSerializer(many=True, read_only=True)
    is_application_open = serializers.ReadOnlyField()
    available_seats = serializers.ReadOnlyField()
    
    class Meta:
        model = Program
        fields = '__all__'

    def to_representation(self, instance):
        """Ensure all fields are properly represented"""
        data = super().to_representation(instance)
        
        # Ensure department is always present
        if not data.get('department') and instance.department:
            data['department'] = {
                'id': instance.department.id,
                'name': instance.department.name,
                'code': instance.department.code
            }
        
        return data    
        
    def validate_department_id(self, value):
        """Validate that department exists"""
        if not Department.objects.filter(id=value).exists():
            raise serializers.ValidationError("Invalid department selected")
        return value
        
    def validate(self, attrs):
        """Custom validation for program creation"""
        # Ensure application start date is before end date
        if attrs.get('application_start_date') and attrs.get('application_end_date'):
            if attrs['application_start_date'] >= attrs['application_end_date']:
                raise serializers.ValidationError(
                    "Application start date must be before end date"
                )
        
        # Ensure program code is unique
        program_code = attrs.get('code')
        if program_code:
            existing_program = Program.objects.filter(code=program_code)
            # If updating, exclude current instance
            if self.instance:
                existing_program = existing_program.exclude(id=self.instance.id)
            
            if existing_program.exists():
                raise serializers.ValidationError(
                    f"Program with code '{program_code}' already exists"
                )
        
        return attrs

    def create(self, validated_data):
        """Custom create method"""
        department_id = validated_data.pop('department_id')
        validated_data['department'] = Department.objects.get(id=department_id)
        return super().create(validated_data)
        
    def update(self, instance, validated_data):
        """Custom update method"""
        if 'department_id' in validated_data:
            department_id = validated_data.pop('department_id')
            validated_data['department'] = Department.objects.get(id=department_id)
        return super().update(instance, validated_data)

class ProgramListSerializer(serializers.ModelSerializer):
    """Simplified serializer for program listings"""
    department_name = serializers.CharField(source='department.name', read_only=True)
    is_application_open = serializers.ReadOnlyField()
    available_seats = serializers.ReadOnlyField()
    
    class Meta:
        model = Program
        fields = [
            'id', 'name', 'code', 'department_name', 'program_type', 
            'duration_years', 'fees_per_semester', 'application_fee',
            'min_percentage', 'application_start_date', 'application_end_date',
            'is_application_open', 'available_seats', 'status'
        ]
