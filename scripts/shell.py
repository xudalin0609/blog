"""
Command-line interface to the OpenStack Nova API.
"""

import sys
import logging
import argparse
import importlib

import scripts.exceptions as exc
from scripts.common import ActionTemplate


class HelpFormatter(argparse.HelpFormatter):
    def __init__(self, prog, indent_increment=2, max_help_position=32,
                 width=None):
        super().__init__(prog, indent_increment,
                         max_help_position, width)

    def start_section(self, heading):
        # Title-case the headings
        heading = '%s%s' % (heading[0].upper(), heading[1:])
        super().start_section(heading)


class ArgumentParser(argparse.ArgumentParser):
    pass


class Shell:

    def get_base_parser(self):
        parser = ArgumentParser(
            prog='blog',
            description=__doc__.strip(),
            epilog='See "blog help COMMAND" '
                   'for help on a specific command.',
            add_help=False,
            formatter_class=HelpFormatter,
        )

        parser.add_argument(
            '-h', '--help',
            action='store_true',
            help=argparse.SUPPRESS,
        )

        return parser

    def get_subcommand_parser(self):
        parser = self.get_base_parser()
        subparsers = parser.add_subparsers(help='sub-command help')
        actions_module = importlib.import_module('scripts.actions')
        for attr in dir(actions_module):
            command = getattr(actions_module, attr)
            if not isinstance(object, type(command)) or \
                    not issubclass(command, ActionTemplate):
                continue
            command().register(subparsers)
        return parser

    def main(self, argv):
        base_parser = self.get_base_parser()
        args, _ = base_parser.parse_known_args(argv)

        subcommand_parser = self.get_subcommand_parser()
        args = subcommand_parser.parse_args(argv)
        args.func(args)


def main():
    try:
        argv = [a for a in sys.argv[1:]]
        Shell().main(argv)
    except exc.ClientException as e:
        logging.debug(e, exc_info=1)
        print("%(type)s (%(error)s): %(msg)s" % {
              'type': e.__class__.__name__,
              'error': e.error,
              'msg': str(e)},
              file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        logging.debug(e, exc_info=1)
        print("ERROR (%(type)s): %(msg)s" % {
              'type': e.__class__.__name__,
              'msg': str(e)},
              file=sys.stderr)
        sys.exit(1)
    except KeyboardInterrupt:
        print("... terminating nova client", file=sys.stderr)
        sys.exit(130)
