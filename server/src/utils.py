import os
import hashlib
import json

from flask import current_app

from globals import basedir


def md5(fname):
    hash_md5 = hashlib.md5()
    with open(fname, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()


def get_file_path(filename):
    return os.path.join(current_app.config['UPLOAD_PATH'], filename)


def get_index():
    with open(basedir+"/../docs/.index", "r") as f:
        index = json.load(f)
    return index


def get_article(_id):
    article_info = get_index()[str(_id)]
    article_name = ".".join([article_info["name"], article_info["suffix"]])
    with open(basedir+"/../docs/"+article_name, "r") as f:
        article = f.read()
    return article
