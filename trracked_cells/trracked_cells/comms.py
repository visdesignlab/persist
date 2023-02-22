from typing import Any

output = []


def print(*args, **kwargs):
    output.append(*args, **kwargs)


class Comm:
    def __init__(self, id: str):
        """
        Initializes a Comms object
        """
        from IPython import get_ipython  # type: ignore

        self.id = id
        self._comm: Any = None

        self.manager = get_ipython().kernel.comm_manager  # type: ignore
        self.manager.register_target(self.id, self._target_func)

    def close(self):
        """
        Closes the comm connection
        """
        if self._comm:
            self._comm.close()
        else:
            if self.id in self.manager.targets:
                del self.manager.targets[self.id]
            else:
                err = AssertionError("Comm %s is already closed" % self.id)
                raise err

    @classmethod
    def decode(cls, msg):
        """
        Decodes messages following Jupyter messaging protocol.
        If JSON decoding fails data is assumed to be a regular string.
        """
        return msg["content"]["data"]

    def _target_func(self, comm, msg):
        self._comm = comm
        self._comm.on_msg(self._on_msg)
        self._comm.on_close(self._on_close)
        self.send({"reason": "ack"})

    def _on_msg(self, msg):
        """ """

    def _on_close(self, msg):
        if msg["content"]["data"]["reason"] != "reset":
            print("Something else happened")

        if self.id in CommManager._comms:
            del CommManager._comms[self.id]
        self.close()

    def send(self, data=None, metadata=None, buffers=[]):
        """
        Pushes data across comm socket.
        """
        self._comm.send(data, metadata=metadata, buffers=buffers)


class CommManager:
    _comms = {}

    @staticmethod
    def init():
        global output
        output = []

    def __call__(self):
        raise TypeError(
            f"{self.__module__}.{self.__class__.__name__} is not meant to be instantiated."
        )

    @classmethod
    def get_comm(cls, id):
        if id in cls._comms:
            return cls._comms[id]
        else:
            return cls.get_server_comm(id)

    @classmethod
    def get_server_comm(cls, id):
        comm = Comm(id)
        cls._comms[comm.id] = comm
        return comm


def get_comm(id: str):
    CommManager.get_server_comm(id)
