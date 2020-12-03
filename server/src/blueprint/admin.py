from datetime import date
import os
import datetime

from flask import Blueprint, request
from flask import request, current_app, jsonify
from werkzeug.utils import secure_filename
from blueprint.auth import auth_required
from models import Article

from utils import get_file_path
from extensions import db

admin_bp = Blueprint("admin", __name__)
ALLOWED_EXTENSIONS = set(['txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'md'])


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS

def save_article():
    file = request.files['file']
    if file and allowed_file(file.filename):
        article = Article(title=file.filename)
        db.session.add(article)
        db.session.commit()
        file.save(get_file_path(article.article_uid))
        return article.article_uid
    return False

def delete_article(article_id):
    try:
        article = Article.query.filter_by(id=article_id).first()
        os.remove(get_file_path(article.article_uid))
        article.query.delete()
        db.session.commit()
    except Exception as e:
        print(e)
        return False
    return True

# To modify
def update_article(article_id):
    file = request.files['file']
    if file and allowed_file(file.filename):
        try:
            article = Article.query.filter_by(id=article_id).first()
            article.update_time = datetime.datetime.utcnow()
            article_uid = article.article_uid
            file.save(get_file_path(article_uid))
            db.session.commit()
        except:
            return False
    else:
        return False
    return True




@admin_bp.route("/upload", methods=["POST"])
@auth_required
def upload():
    if request.method == 'POST':
        if save_article():
            return jsonify({"status": "success"})
        else:
            return jsonify({"status": "failed"})

