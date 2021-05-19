from datetime import date
from uuid import uuid4
import json
import os
import time

BASE_PATH = '/mnt/f/WorkSpace/new-blog/'
DOCS_PATH = os.path.join(BASE_PATH, 'docs')
INDEX_PATH = os.path.join(DOCS_PATH, '.index')


def get_create_date(path):
    timestamp = os.path.getctime(path)
    local_timestamp = time.localtime(timestamp)
    return time.strftime('%Y-%m-%d', local_timestamp)


def get_articles():
    articles = []
    for article in os.listdir(DOCS_PATH):
        path = os.path.join(DOCS_PATH, article)
        if article.startswith('.') or os.path.isdir(path):
            continue
        articles.append(Article(article, path))
    return articles


class ActionTemplate:
    name = ""

    def run(self, args):
        raise NotImplementedError('run func must be inherit!')

    def register(self, parser):
        if self.name == '':
            pass
        subparser = parser.add_parser(name=self.name)
        subparser.set_defaults(func=self.run)
        self.add_parameter(subparser)

    def add_parameter(self, subparser):
        pass


class Article:

    def __init__(self, name, path, _id=None, create_date=None, catalog='Other'):
        self._id = _id or str(uuid4()).replace('-', '')
        self.name, self.suffix = name.split('.')
        self.create_date = create_date or get_create_date(path)
        self.catalog = catalog
        self.path = path


class Index:
    def __init__(self) -> None:
        self._index = self._load()

    def _load(self):
        if os.path.exists(INDEX_PATH):
            with open(INDEX_PATH, 'r') as f:
                index = json.load(f)
            return index
        return {}

    def update(self):
        articles = get_articles()
        for article in articles:
            if article.name in self._index:
                continue
            else:
                self._index[article._id] = {
                    'id': article._id,
                    'name': article.name,
                    'create_date': article.create_date,
                    'catalog': article.catalog,
                    'suffix': article.suffix
                }
        self._save()

    def _save(self):
        with open(INDEX_PATH, 'w') as f:
            f.write(json.dumps(self._index))
