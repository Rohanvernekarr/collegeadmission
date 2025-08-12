# College Admission Portal

A full-stack web application for college admission management built with Django and React.

## Prerequisites

Before you begin, ensure you have the following installed:

- Python 3.8 or higher
- Node.js (v14 or higher)
- npm (comes with Node.js)
- Git

## Getting Started

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd collegeadmissionportal
```

### 2. Backend Setup

1. Create and activate a virtual environment:

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

2. Create environment variables:

Create a `.env` file in the backend directory with:
```
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DB_NAME=collegeadmission_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
```

3. Initialize the database:

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

4. Create default admin and officer accounts:

```bash
python manage.py create_admin_officer
```

5. Start the backend server:

```bash
python manage.py runserver
```

The backend will run on http://localhost:8000

### 3. Frontend Setup

1. Install frontend dependencies:

```bash
cd frontend
npm install
```

2. Start the frontend development server:

```bash
npm start
```

The frontend will run on http://localhost:3000

## Project Structure

```
collegeadmissionportal/
├── backend/           # Django backend
│   ├── authentication/ # Authentication app
│   ├── programs/      # Programs management
│   └── users/        # User management
├── frontend/         # React frontend
│   ├── src/         # Source code
│   │   ├── components/ # React components
│   │   ├── store/    # Redux store
│   │   └── services/ # API services
│   └── public/      # Static files
└── README.md        # This file
```

## Available Scripts

### Backend

- `python manage.py runserver` - Start the Django development server
- `python manage.py makemigrations` - Create database migrations
- `python manage.py migrate` - Apply database migrations
- `python manage.py create_admin_officer` - Create default admin and officer accounts

### Frontend

- `npm start` - Start the development server
- `npm run build` - Build the production version
- `npm test` - Run tests

## Role Access

- **Applicant**: Can register, view programs, and apply
- **Admission Officer**: Can review applications
- **Admin**: Full access to manage users, programs, and departments

## Default Credentials

After running `create_admin_officer` command:

- Admin: username: admin, password: admin123
- Officer: username: officer, password: officer123

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
