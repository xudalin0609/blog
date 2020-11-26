import os
from flask import Flask
from flask_cors import CORS
import click

from extensions import db
from blueprint.blog import blog_bp
from blueprint.admin import admin_bp
from blueprint.auth import auth_bp
from settings import config
from utils import create_article, update_articles, create_user

basedir = os.path.abspath(os.path.dirname(__file__))


def create_app(config_name=None):
    if config_name is None:
        config_name = os.getenv("FLASK_CONFIG", "development")
    app = Flask("bluelog")
    app.config.from_object(config[config_name])
    CORS(app, supports_credentials=True)

    register_blueprint(app)
    register_extensions(app)
    register_commands(app)
    return app


def register_blueprint(app):
    app.register_blueprint(blog_bp, url_prefix="/api/article")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(auth_bp, url_prefix="/api")


def register_extensions(app):
    db.init_app(app)


def register_commands(app):
    @app.cli.command()
    @click.option("--drop", is_flag=True, help="Create after drop.")
    def initdb(drop):
        """Initialize the database."""
        if drop:
            click.confirm(
                "This operation will delete the database, do you want to continue?",
                abort=True,
            )
            db.drop_all()
            click.echo("Drop tables.")
        db.create_all()
        click.echo("Initialized database.")

    @app.cli.command()
    @click.option("--title", required=True, help="Title of article", prompt=True)
    @click.option(
        "--tags", required=True, help="Tags of article", default="other", prompt=True
    )
    def create(title, tags):
        click.echo("Is creating article...")
        create_article(title, tags)
        click.echo(f"Create article {title}")

    @app.cli.command()
    def update():
        click.echo("Is updating article...")
        update_articles()

    @app.cli.command()
    @click.option("--username", required=True,  prompt=True)
    @click.option(
        "--password", required=True,  prompt=True
    )
    def create_admin(username, password):
        create_user(username, password)
        click.echo(f"Create user: {username}")

   

if __name__ == "__main__":
    app = create_app()
    # app.run(host='0.0.0.0', port=5000)