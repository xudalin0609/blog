import os
from models import Article

from flask import Flask
from flask_cors import CORS
import click

from extensions import db
from models import Article
from blueprint.blog import blog_bp
from settings import config

basedir = os.path.abspath(os.path.dirname(__file__))

def create_app(config_name=None):
    if config_name is None:
        config_name = os.getenv('FLASK_CONFIG', 'development')
    app = Flask('bluelog')
    app.config.from_object(config[config_name])
    CORS(app, supports_credentials=True)

    register_blueprint(app)
    register_extensions(app)
    register_commands(app)
    return app

def register_blueprint(app):
    app.register_blueprint(blog_bp, url_prefix="/article")

def register_extensions(app):
    db.init_app(app)

def register_commands(app):
    @app.cli.command()
    @click.option('--drop', is_flag=True, help='Create after drop.')
    def initdb(drop):
        """Initialize the database."""
        if drop:
            click.confirm('This operation will delete the database, do you want to continue?', abort=True)
            db.drop_all()
            click.echo('Drop tables.')
        db.create_all()
        click.echo('Initialized database.')


    @app.cli.command()
    @click.option("--title", required=True, help="Title of article", prompt=True)
    @click.option("--tags", required=True, help="Tags of article", default="other", prompt=True)
    def create(title, tags):
        click.echo("Is creating article...")
        article = Article(
            title=title,
            tags=tags
        )
        with open(os.path.join(basedir, f"archive/{title}.md"), "w"):
            pass

        db.session.add(article)
        db.session.commit()
        click.echo(f'Create article {title}')
        