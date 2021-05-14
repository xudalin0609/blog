class ClientException(Exception):
    """
    The base exception class for all exceptions this library raises.
    """
    message = 'Unknown Error'

    def __init__(self, code, message=None, details=None, request_id=None,
                 url=None, method=None, error=None):
        self.code = code
        self.message = message or self.__class__.message
        self.details = details
        self.request_id = request_id
        self.url = url
        self.method = method
        self.error = error

    def __str__(self):
        formatted_string = "%s (HTTP %s)" % (self.message, self.code)
        if self.request_id:
            formatted_string += " (Request-ID: %s)" % self.request_id

        return formatted_string


class NotInheritError(Exception):
    message = 'Inherit Error'

    def __str__(self) -> str:
        return "%s must be overwrited !" % self.__class__.__name__
