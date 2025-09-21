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
        # Create or update admin account
        admin_username = options['admin_username']
        admin_email = options['admin_email']
        admin_password = options['admin_password']

        try:
            admin, created = User.objects.get_or_create(username=admin_username, defaults={'email': admin_email})
            if created:
                admin.set_password(admin_password)
                admin.role = 'admin'
                admin.is_staff = True
                admin.is_superuser = True
                admin.save()
                self.stdout.write(self.style.SUCCESS(f'Created admin account: {admin_username}'))
            else:
                # Update existing admin metadata if needed
                admin.email = admin_email
                admin.role = 'admin'
                admin.is_staff = True
                admin.is_superuser = True
                admin.save()
                self.stdout.write(self.style.NOTICE(f'Admin account "{admin_username}" already exists; updated metadata'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating/updating admin account: {str(e)}'))

        # Create or update officer account
        officer_username = options['officer_username']
        officer_email = options['officer_email']
        officer_password = options['officer_password']

        try:
            officer, created = User.objects.get_or_create(username=officer_username, defaults={'email': officer_email})
            if created:
                officer.set_password(officer_password)
                # The project uses 'admission_officer' as the role string
                officer.role = 'admission_officer'
                officer.is_staff = True
                officer.is_superuser = False
                officer.save()
                self.stdout.write(self.style.SUCCESS(f'Created officer account: {officer_username}'))
            else:
                officer.email = officer_email
                officer.role = 'admission_officer'
                officer.is_staff = True
                officer.save()
                self.stdout.write(self.style.NOTICE(f'Officer account "{officer_username}" already exists; updated metadata'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating/updating officer account: {str(e)}'))
