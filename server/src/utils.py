import hashlib
import os
import glob
from datetime import datetime

from flask import current_app

from models import Article, User
from extensions import db

def md5(fname):
    hash_md5 = hashlib.md5()
    with open(fname, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

def create_article(title, tags):
    article_path = os.path.join(current_app.config['UPLOAD_PATH'], f"{title}.md")
    with open(article_path, "w"):
        article_md5 = md5(article_path)

    article = Article(title=title, tags=tags, md5=article_md5)
    db.session.add(article)
    db.session.commit()


def update_articles():
    archive_path = current_app.config['UPLOAD_PATH']
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


def create_user(username, password):
    user = User(username=username)
    user.set_password(password=password)
    db.session.add(user)
    db.session.commit()

def get_file_path(filename):
    return os.path.join(current_app.config['UPLOAD_PATH'], filename)

