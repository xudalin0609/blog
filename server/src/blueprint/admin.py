import os

from flask import Blueprint, request
from flask import request, current_app, jsonify
from werkzeug.utils import secure_filename
from utils import update_articles

admin_bp = Blueprint("admin", __name__)
ALLOWED_EXTENSIONS = set(['txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'md'])


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS

@admin_bp.route("/upload", methods=["POST"])
def upload():
    if request.method == 'POST':
        file = request.files['file']
        if file and allowed_file(file.filename):
            # filename = secure_filename(file.filename)
            file.save(os.path.join(current_app.config['UPLOAD_PATH'], file.filename))
            update_articles()
            return jsonify({"status": "success"})
        else:
            return jsonify({"status": "failed"})

