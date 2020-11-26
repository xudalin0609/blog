from datetime import datetime

from extensions import db

from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

class Article(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(30), unique=True)
    tags = db.Column(db.String(50))
    md5 = db.Column(db.String(32))
    create_time =db.Column(db.DateTime, default=datetime.utcnow, index=True)
    update_time =db.Column(db.DateTime, default=datetime.utcnow, index=True)
 

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), unique=True, index=True)
    password_hash = db.Column(db.String(128))
    locale = db.Column(db.String(20))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def validate_password(self, password):
        return check_password_hash(self.password_hash, password)
