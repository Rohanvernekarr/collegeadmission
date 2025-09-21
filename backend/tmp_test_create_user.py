import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'college_portal.settings')

django.setup()
from authentication.serializers import RegisterSerializer
from django.test import RequestFactory
from rest_framework.request import Request
factory = RequestFactory()
request = factory.post('/api/auth/register/', {'username':'testuser2','email':'test2@example.com','password':'Testpass123!','first_name':'Test','last_name':'User'})
req = Request(request)
serializer = RegisterSerializer(data=request.data, context={'request': req})
if serializer.is_valid():
    user = serializer.save()
    print('User created:', user.username, 'failed_login_attempts=', user.failed_login_attempts)
else:
    print('Errors', serializer.errors)
