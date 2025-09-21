from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import User, UserProfile
from .serializers import (
    UserRegistrationSerializer, 
    UserLoginSerializer, 
    UserSerializer,
    UserProfileSerializer
)
from .utils import generate_otp, send_verification_email
import logging

logger = logging.getLogger(__name__)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        # Generate OTP and send verification email
        try:
            otp_code = generate_otp()
            # create OTP record
            from .models import OTP
            OTP.objects.create(user=user, otp=otp_code)
            send_verification_email(user.email, otp_code)
        except Exception as e:
            logger.exception("Failed to send verification email: %s", e)

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)


class VerifyEmailView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        otp = request.data.get('otp')
        if not email or not otp:
            return Response({'error': 'email and otp are required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        # Find latest unused OTP for user
        from .models import OTP
        try:
            otp_obj = OTP.objects.filter(user=user, is_used=False).order_by('-created_at').first()
            if otp_obj is None or otp_obj.otp != str(otp):
                return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)
            if otp_obj.is_expired():
                return Response({'error': 'OTP expired'}, status=status.HTTP_400_BAD_REQUEST)

            otp_obj.is_used = True
            otp_obj.save(update_fields=['is_used'])
            user.is_verified = True
            user.save(update_fields=['is_verified'])
            return Response({'message': 'Email verified successfully'})
        except Exception as e:
            logger.exception("Error verifying OTP: %s", e)
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ResendOtpView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'email is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            otp_code = generate_otp()
            from .models import OTP
            OTP.objects.create(user=user, otp=otp_code)
            send_verification_email(user.email, otp_code)
            return Response({'message': 'OTP resent'})
        except Exception as e:
            logger.exception("Failed to resend OTP: %s", e)
            return Response({'error': 'Failed to send OTP'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LoginView(generics.GenericAPIView):
    serializer_class = UserLoginSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        # Sanitize and log incoming payload (mask passwords)
        try:
            payload = dict(request.data)
        except Exception:
            payload = {}

        if 'password' in payload:
            payload['password'] = '***'
        # In case of DRF parsing lists
        if isinstance(payload.get('password'), (list, tuple)):
            payload['password'] = ['***']

        logger.info(
            "Auth login attempt path=%s origin=%s content_type=%s payload_keys=%s",
            request.path,
            request.META.get('HTTP_ORIGIN'),
            request.META.get('CONTENT_TYPE'),
            list(payload.keys()),
        )

        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            # Log serializer errors for debugging (do not include raw password)
            logger.warning(
                "Auth login validation failed path=%s errors=%s",
                request.path,
                getattr(serializer, 'errors', {}),
            )
            raise
        user = serializer.validated_data['user']
        
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })

class AdminLoginView(LoginView):
    def post(self, request, *args, **kwargs):
        # Validate credentials using the same serializer as LoginView
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        if user.role != 'admin':
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })

class OfficerLoginView(LoginView):
    def post(self, request, *args, **kwargs):
        # Validate credentials using the same serializer as LoginView
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        # Accept both 'officer' and the stored 'admission_officer' role
        if user.role not in ('officer', 'admission_officer'):
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def logout_view(request):
    try:
        refresh_token = request.data["refresh"]
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response(status=status.HTTP_205_RESET_CONTENT)
    except Exception:
        return Response(status=status.HTTP_400_BAD_REQUEST)
