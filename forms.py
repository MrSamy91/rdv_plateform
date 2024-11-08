from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, SubmitField, DateTimeField, SelectField, TextAreaField
from wtforms.validators import DataRequired, Length, Email, EqualTo, ValidationError
from datetime import datetime

class RegistrationForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=2, max=20)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    phone_number = StringField('Numéro de téléphone', validators=[DataRequired(), Length(min=10, max=15)])
    password = PasswordField('Password', validators=[DataRequired()])
    confirm_password = PasswordField('Confirm Password', validators=[DataRequired(), EqualTo('password')])
    submit = SubmitField('Sign Up')

class LoginForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Mot de passe', validators=[DataRequired()])
    remember_me = BooleanField('Se souvenir de moi')
    submit = SubmitField('Se connecter')

class RendezvousForm(FlaskForm):
    # ... other fields ...
    date_heure = DateTimeField('Date et heure', validators=[
        DataRequired(),
        lambda form, field: ValidationError("La date doit être dans le futur") if field.data <= datetime.utcnow() else None
    ])
    submit = SubmitField('Prendre rendez-vous')

class ReviewForm(FlaskForm):
    rating = SelectField('Note', choices=[(1, '1'), (2, '2'), (3, '3'), (4, '4'), (5, '5')], validators=[DataRequired()])
    comment = TextAreaField('Commentaire', validators=[DataRequired(), Length(min=10, max=500)])
    submit = SubmitField('Soumettre l\'avis')

# Les fonctions suivantes ont été supprimées car elles n'appartiennent pas à forms.py :
# add_to_google_calendar
# send_email_notification
