import os

from git import Repo
import prettytable as pt

from scripts.common import BASE_PATH, Index, ActionTemplate, DOCS_PATH


class DeployAction(ActionTemplate):
    name = 'deploy'

    def run(self, args):
        index = Index()
        index.update()
        self._push()
        print("Successful deploy!")

    def _push(self):
        repo = Repo(BASE_PATH)
        g = repo.git
        g.add("./docs")
        g.commit("-m auto update")
        g.push()


class ListAction(ActionTemplate):
    name = 'list'

    def run(self, args):
        index = Index()._load()
        table = pt.PrettyTable()
        table.field_names = ['id', 'name', 'create_date', 'catalog', 'suffix']
        for v in index.values():
            table.add_row(list(v.values()))
        print(table)


class UpdateAction(ActionTemplate):
    name = 'update'

    def run(self, args):
        index = Index()
        index.update()
        print("Successful update!")
