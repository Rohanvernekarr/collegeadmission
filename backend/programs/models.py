from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class Department(models.Model):
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=10, unique=True)
    description = models.TextField(blank=True)
    head_of_department = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.code})"

class Program(models.Model):
    PROGRAM_TYPES = [
        ('undergraduate', 'Undergraduate'),
        ('postgraduate', 'Postgraduate'),
        ('diploma', 'Diploma'),
        ('certificate', 'Certificate'),
    ]
    
    PROGRAM_STATUS = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('closed', 'Closed'),
    ]

    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='programs')
    program_type = models.CharField(max_length=20, choices=PROGRAM_TYPES)
    duration_years = models.PositiveIntegerField()
    duration_semesters = models.PositiveIntegerField()
    description = models.TextField()
    
    # Admission details
    intake_capacity = models.PositiveIntegerField()
    fees_per_semester = models.DecimalField(max_digits=10, decimal_places=2)
    application_fee = models.DecimalField(max_digits=8, decimal_places=2, default=500)
    
    # Eligibility
    min_percentage = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Minimum percentage required"
    )
    eligibility_criteria = models.TextField()
    
    # Application dates
    application_start_date = models.DateTimeField()
    application_end_date = models.DateTimeField()
    
    status = models.CharField(max_length=20, choices=PROGRAM_STATUS, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} - {self.department.name}"

    @property
    def is_application_open(self):
        from django.utils import timezone
        now = timezone.now()
        return (self.application_start_date <= now <= self.application_end_date 
                and self.status == 'active')

    @property
    def available_seats(self):
        applied_count = self.applications.filter(status__in=['submitted', 'under_review', 'shortlisted', 'admitted']).count()
        return max(0, self.intake_capacity - applied_count)

class RequiredDocument(models.Model):
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='required_documents')
    document_name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    is_mandatory = models.BooleanField(default=True)
    max_file_size_mb = models.PositiveIntegerField(default=5)
    allowed_formats = models.CharField(
        max_length=200, 
        default='pdf,jpg,jpeg,png',
        help_text="Comma-separated file formats (e.g., pdf,jpg,png)"
    )
    
    def __str__(self):
        return f"{self.program.name} - {self.document_name}"
