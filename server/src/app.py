from datetime import datetime
import os
import glob
from flask import Flask, current_app
from flask import app
from flask_cors import CORS
import click

from extensions import db
from models import Article
from blueprint.blog import blog_bp
from settings import config
from models import Article
from utils import md5

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


def register_extensions(app):
    db.init_app(app)


def register_commands(app):
    def create_article(title, tags):
        article_path = os.path.join(basedir, f"archive/{title}.md")
        with open(article_path, "w"):
            article_md5 = md5(article_path)

        article = Article(title=title, tags=tags, md5=article_md5)
        db.session.add(article)
        db.session.commit()

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
        archive_path = current_app.config.get(
            "ARCHIVE_PATH", os.path.join(basedir, "archive")
        )
        for file_path in glob.glob(os.path.join(archive_path, "*.md")):
            current_md5 = md5(file_path)
            title = file_path.split("/")[-1].split(".")[0]
            article = Article.query.filter_by(title=title).first()

            if article is None:
                create_article(title, "others")
                continue

            article_md5 = article.md5
            if current_md5 == article_md5:
                continue
            else:
                article.md5 = current_md5
                article.update_time = datetime.now()
                db.session.commit()


if __name__ == "__main__":
    app = create_app()
    # app.run(host='0.0.0.0', port=5000)