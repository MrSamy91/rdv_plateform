import os
from datetime import timedelta
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import secrets
from flask_mail import Message
from app import mail
from flask import render_template

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

def generate_verification_token():
    # Génère un token de 6 chiffres
    return ''.join(secrets.choice('0123456789') for _ in range(6))

def send_verification_email(user, token):
    try:
        msg = Message(
            'Vérification de votre compte - Agendaide',
            recipients=[user.email]
        )
        msg.html = render_template(
            'emails/verify_account.html',
            username=user.username,
            token=token
        )
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Erreur d'envoi d'email: {str(e)}")
        return False