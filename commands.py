import click
from flask.cli import with_appcontext
from models import AuthorizedHairdresserEmail
from db import db

@click.command('add-hairdresser-email')
@click.argument('email')
@with_appcontext
def add_hairdresser_email(email):
    """Ajouter un email à la liste des coiffeurs autorisés."""
    try:
        if not AuthorizedHairdresserEmail.query.filter_by(email=email).first():
            auth = AuthorizedHairdresserEmail(email=email)
            db.session.add(auth)
            db.session.commit()
            click.echo(f'Email ajouté avec succès: {email}')
        else:
            click.echo('Cet email est déjà dans la liste')
    except Exception as e:
        click.echo(f'Erreur: {str(e)}') 