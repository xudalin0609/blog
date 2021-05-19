import os
from flask import Flask
from flask_cors import CORS

from blueprint.article import bp_article
from blueprint.index import bp_index
from settings import config

basedir = os.path.abspath(os.path.dirname(__file__))


def create_app(config_name=None):
    if config_name is None:
        config_name = os.getenv("FLASK_CONFIG", "development")
    app = Flask("blog")
    app.config.from_object(config[config_name])
    CORS(app, supports_credentials=True)

    register_blueprint(app)
    return app


def register_blueprint(app):
    app.register_blueprint(bp_index, url_prefix="/api")
    app.register_blueprint(bp_article, url_prefix="/api")


if __name__ == "__main__":
    app = create_app()
    app.run(port=5000)
