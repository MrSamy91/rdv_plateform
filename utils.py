import os
from datetime import timedelta
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

def send_email_notification(to_email, subject, content):
    message = Mail(
        from_email='votre_email@example.com',
        to_emails=to_email,
        subject=subject,
        html_content=content)
    try:
        sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
        response = sg.send(message)
        return response.status_code
    except Exception as e:
        print(str(e))
        return None

def add_to_google_calendar(rendezvous, access_token):
    creds = Credentials(access_token)
    service = build('calendar', 'v3', credentials=creds)
    
    event = {
        'summary': f'Rendez-vous chez le coiffeur',
        'description': f'Service: {rendezvous.service.name}',
        'start': {
            'dateTime': rendezvous.date_heure.isoformat(),
            'timeZone': 'Europe/Paris',
        },
        'end': {
            'dateTime': (rendezvous.date_heure + timedelta(minutes=rendezvous.service.duration)).isoformat(),
            'timeZone': 'Europe/Paris',
        },
    }

    event = service.events().insert(calendarId='primary', body=event).execute()
    return event['id']