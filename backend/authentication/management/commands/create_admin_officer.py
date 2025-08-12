from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.conf import settings

User = get_user_model()

class Command(BaseCommand):
    help = 'Creates admin and officer accounts'

    def add_arguments(self, parser):
        parser.add_argument('--admin-username', default='admin', help='Admin username')
        parser.add_argument('--admin-email', default='admin@example.com', help='Admin email')
        parser.add_argument('--admin-password', default='admin123', help='Admin password')
        parser.add_argument('--officer-username', default='officer', help='Officer username')
        parser.add_argument('--officer-email', default='officer@example.com', help='Officer email')
        parser.add_argument('--officer-password', default='officer123', help='Officer password')

    def handle(self, *args, **options):
        # Create admin account
        try:
            admin = User.objects.create_user(
                username=options['admin_username'],
                email=options['admin_email'],
                password=options['admin_password'],
                role='admin',
                is_staff=True,
                is_superuser=True
            )
            self.stdout.write(self.style.SUCCESS(f'Successfully created admin account: {options["admin_username"]}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating admin account: {str(e)}'))

        # Create officer account
        try:
            officer = User.objects.create_user(
                username=options['officer_username'],
                email=options['officer_email'],
                password=options['officer_password'],
                role='officer',
                is_staff=True
            )
            self.stdout.write(self.style.SUCCESS(f'Successfully created officer account: {options["officer_username"]}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating officer account: {str(e)}'))
