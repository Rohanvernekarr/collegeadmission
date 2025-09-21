# Authentication System

This module provides a comprehensive authentication system for the College Admission Portal, featuring JWT-based authentication, email verification, password reset functionality, and role-based access control.

## Features

- **User Registration** with email verification
- **JWT-based Authentication** with access and refresh tokens
- **Password Management**
  - Secure password reset via email
  - Password change functionality
  - Account lockout after multiple failed attempts
- **Role-Based Access Control** (Admin, Admission Officer, Applicant)
- **Admin Dashboard** for user management
- **Email Notifications** for verification and password reset
- **Security Features**
  - Rate limiting
  - Secure password validation
  - CSRF protection
  - Session security

## API Endpoints

### Authentication

- `POST /api/auth/register/` - Register a new user
- `POST /api/auth/verify-email/` - Verify email with OTP
- `POST /api/auth/resend-otp/` - Resend verification OTP
- `POST /api/auth/login/` - User login
- `POST /api/auth/login/admin/` - Admin login
- `POST /api/auth/login/officer/` - Admission officer login
- `POST /api/auth/token/refresh/` - Refresh access token
- `POST /api/auth/token/verify/` - Verify token
- `POST /api/auth/logout/` - Logout user

### Password Management

- `POST /api/auth/password/reset/request/` - Request password reset email
- `POST /api/auth/password/reset/confirm/` - Confirm password reset with token
- `POST /api/auth/password/change/` - Change password (authenticated)

### User Profile

- `GET /api/auth/profile/me/` - Get current user's profile
- `PUT /api/auth/profile/me/` - Update current user's profile
- `PATCH /api/auth/profile/me/` - Partially update current user's profile

### Admin Endpoints (Requires Admin Role)

- `GET /api/auth/admin/users/` - List all users
- `POST /api/auth/admin/users/create/` - Create a new user
- `GET /api/auth/admin/users/<id>/` - Get user details
- `PUT /api/auth/admin/users/<id>/` - Update user
- `PATCH /api/auth/admin/users/<id>/` - Partially update user
- `POST /api/auth/admin/users/<id>/toggle-status/` - Toggle user active status
- `POST /api/auth/admin/users/<id>/verify/` - Verify/unverify user
- `GET /api/auth/admin/users/statistics/` - Get user statistics

## Models

### User
- Extends Django's AbstractUser
- Additional fields:
  - `role`: User role (admin, admission_officer, applicant)
  - `phone_number`: User's contact number
  - `is_verified`: Email verification status
  - `failed_login_attempts`: Track failed login attempts
  - `account_locked_until`: Account lockout timestamp

### UserProfile
- One-to-one relationship with User
- Additional user details:
  - Address information
  - Emergency contact
  - Profile picture

### OTP
- Stores one-time passwords for email verification
- Automatically expires after 15 minutes

### PasswordResetToken
- Secure tokens for password reset functionality
- Valid for 24 hours

## Security Considerations

- Passwords are hashed using PBKDF2 with SHA256
- JWT tokens have short expiration times
- Rate limiting on authentication endpoints
- Account lockout after multiple failed attempts
- Secure password requirements
- CSRF protection
- Secure cookie settings

## Environment Variables

Required environment variables for the authentication system:

```
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-email-password

# JWT Secret Key (keep this secret!)
SECRET_KEY=your-secret-key-here
```

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run migrations:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

3. Start the development server:
   ```bash
   python manage.py runserver
   ```

## Testing

Run the test suite with:
```bash
python manage.py test authentication.tests
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
