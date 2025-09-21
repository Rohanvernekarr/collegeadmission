from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from authentication.models import UserProfile


class Command(BaseCommand):
    help = 'Create default admin and officer users for local development (no-op if users exist)'

    def add_arguments(self, parser):
        parser.add_argument('--admin-username', type=str, default='admin')
        parser.add_argument('--admin-email', type=str, default='admin@example.com')
        parser.add_argument('--admin-password', type=str, default='AdminPass123!')
        parser.add_argument('--officer-username', type=str, default='officer')
        parser.add_argument('--officer-email', type=str, default='officer@example.com')
        parser.add_argument('--officer-password', type=str, default='OfficerPass123!')

    def handle(self, *args, **options):
        User = get_user_model()

        admin_username = options['admin_username']
        admin_email = options['admin_email']
        admin_password = options['admin_password']

        officer_username = options['officer_username']
        officer_email = options['officer_email']
        officer_password = options['officer_password']

        # Create admin
        admin, created_admin = User.objects.get_or_create(username=admin_username, defaults={
            'email': admin_email,
        })
        if created_admin:
            admin.set_password(admin_password)
            admin.role = 'admin'
            admin.is_staff = True
            admin.is_superuser = True
            admin.is_verified = True
            admin.save()
            UserProfile.objects.create(user=admin)
            self.stdout.write(self.style.SUCCESS(f'Created admin user: {admin_username} / {admin_password}'))
        else:
            self.stdout.write(self.style.NOTICE(f'Admin user "{admin_username}" already exists; skipped'))

        # Create officer
        officer, created_officer = User.objects.get_or_create(username=officer_username, defaults={
            'email': officer_email,
        })
        if created_officer:
            officer.set_password(officer_password)
            # role used by the project is 'admission_officer'
            officer.role = 'admission_officer'
            officer.is_staff = True
            officer.is_superuser = False
            officer.is_verified = True
            officer.save()
            UserProfile.objects.create(user=officer)
            self.stdout.write(self.style.SUCCESS(f'Created officer user: {officer_username} / {officer_password}'))
        else:
            self.stdout.write(self.style.NOTICE(f'Officer user "{officer_username}" already exists; skipped'))

        self.stdout.write(self.style.SUCCESS('Default user creation complete.'))
