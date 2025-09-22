import random
import string
from django.conf import settings
import resend
from django.template.loader import render_to_string
from django.utils import timezone
from datetime import timedelta
import os

resend.api_key= os.getenv("RESEND_API_KE")
# Initialize Resend client

def generate_otp(length=6):
    """Generate a random numeric OTP of given length."""
    return ''.join(random.choices(string.digits, k=length))

def send_verification_email(user_email, otp):
    """Send verification email with OTP using Resend.com"""
    try:
        expiry_minutes = getattr(settings, 'OTP_EXPIRY_MINUTES', 15)
        html_content = render_to_string('emails/verification_email.html', {
            'otp': otp,
            'expiry_minutes': expiry_minutes
        })
        
        params = {
            "from": "College Admission Portal <noreply@rohanrv.me>",
            "to": [user_email],
            "subject": "Verify Your Email Address",
            "html": html_content
        }
        
        response = resend.Emails.send(params)
        return response
    except Exception as e:
        print(f"Error sending verification email: {str(e)}")
        return None

def send_password_reset_email(user_email, reset_token):
    """Send password reset email with reset token"""
    try:
        reset_link = f"{settings.FRONTEND_URL}/reset-password/{reset_token}"
        html_content = render_to_string('emails/password_reset_email.html', {
            'reset_link': reset_link,
            'expiry_hours': settings.PASSWORD_RESET_TIMEOUT // 3600
        })
        
        params = {
            "from": "College Admission Portal <noreply@rohanrv.me>",
            "to": [user_email],
            "subject": "Password Reset Request",
            "html": html_content
        }
        
        response = resend.Emails.send(params)
        return response
    except Exception as e:
        print(f"Error sending password reset email: {str(e)}")
        return None
