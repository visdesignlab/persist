import sys
from io import StringIO

"""

Trrack = {
    comms: {}
    comm_status: {}
    comm_manager: ??
}

"""


class StandardOutput(list):
    """
    Context manager to capture standard output for any code it
    is wrapping and make it available as a list, e.g.:
    >>> with StandardOutput() as stdout:
    ...   print('This gets captured')
    >>> print(stdout[0])
    This gets captured
    """

    def __enter__(self):
        self._stdout = sys.stdout
        sys.stdout = self._stringio = StringIO()
        return self

    def __exit__(self, *args):
        self.extend(self._stringio.getvalue().splitlines())
        sys.stdout = self._stdout
