# type: ignore
import sys
import traceback

import param

from .standardout import StandardOutput


class Comm(param.Parameterized):
    id = param.String(doc="The ID of the comm")

    def __init__(self, id, on_msg=None, on_error=None, on_stdout=None, on_open=None):
        self._on_msg = on_msg
        self._on_error = on_error
        self._on_stdout = on_stdout
        self._on_open = on_open
        self._comm = None
        super(Comm, self).__init__(id=id)

    def print_id(self):
        print(self.id)

    def init(self, on_msg=None):
        """
        Initializes comms channel.
        """

    def close(self):
        """
        Closes the comm connection
        """

    def send(self, data=None, metadata=None, buffers=[]):
        """
        Sends data to the frontend
        """

    @classmethod
    def decode(cls, msg):
        """
        Decode incoming message, e.g. by parsing json.
        """
        return msg

    @property
    def comm(self):
        if not self._comm:
            raise ValueError("Comm has not been initialized")
        return self._comm

    def _handle_msg(self, msg):
        """
        Decode received message before passing it to on_msg callback
        if it has been defined.
        """
        comm_id = None
        try:
            stdout = []
            msg = self.decode(msg)
            comm_id = msg.pop("comm_id", None)
            if self._on_msg:
                # Comm swallows standard output so we need to capture
                # it and then send it to the frontend
                with StandardOutput() as stdout:
                    self._on_msg(msg)
                if stdout:
                    try:
                        self._on_stdout(stdout)
                    except:
                        pass
        except Exception as e:
            try:
                self._on_error(e)
            except:
                pass
            error = "\n"
            frames = traceback.extract_tb(sys.exc_info()[2])
            for frame in frames[-20:]:
                fname, lineno, fn, text = frame
                error_kwargs = dict(fn=fn, fname=fname, line=lineno)
                error += "{fname} {fn} L{line}\n".format(**error_kwargs)
            error += "\t{type}: {error}".format(type=type(e).__name__, error=str(e))
            if stdout:
                stdout = "\n\t" + "\n\t".join(stdout)
                error = "\n".join([stdout, error])
            reply = {"msg_type": "Error", "traceback": error}
        else:
            stdout = "\n\t" + "\n\t".join(stdout) if stdout else ""
            reply = {"msg_type": "Ready", "content": stdout}

        # Returning the comm_id in an ACK message ensures that
        # the correct comms handle is unblocked
        if comm_id:
            reply["comm_id"] = comm_id
        self.send(metadata=reply)


class JupyterComm(Comm):
    """
    JupyterComm provides a Comm for the notebook which is initialized
    the first time data is pushed to the frontend.
    """

    js_template = """
    function msg_handler(msg) {{
      var metadata = msg.metadata;
      var buffers = msg.buffers;
      var msg = msg.content.data;
      if ((metadata.msg_type == "Ready")) {{
        if (metadata.content) {{
          console.log("Python callback returned following output:", metadata.content);
        }}
      }} else if (metadata.msg_type == "Error") {{
        console.log("Python failed with the following traceback:", metadata.traceback)
      }} else {{
        {msg_handler}
      }}
    }}
    if ((window.Trrack == undefined) || (!window.Trrack.comm_manager)) {{
      console.log("Could not find comm manager")
    }} else {{
      window.Trrack.comm_manager.register_target('{plot_id}', '{comm_id}', msg_handler);
    }}
    """

    def init(self):
        from ipykernel.comm import Comm as IPyComm

        if self._comm:
            return
        self._comm = IPyComm(target_name=self.id, data={})
        self._comm.on_msg(self._handle_msg)
        if self._on_open:
            self._on_open({})

    @classmethod
    def decode(cls, msg):
        """
        Decodes messages following Jupyter messaging protocol.
        If JSON decoding fails data is assumed to be a regular string.
        """
        return msg["content"]["data"]

    def close(self):
        """
        Closes the comm connection
        """
        if self._comm:
            self._comm.close()

    def send(self, data=None, metadata=None, buffers=[]):
        """
        Pushes data across comm socket.
        """
        if not self._comm:
            self.init()
        self.comm.send(data, metadata=metadata, buffers=buffers)


class JupyterCommJS(JupyterComm):
    """
    JupyterCommJS provides a comms channel for the Jupyter notebook,
    which is initialized on the frontend. This allows sending events
    initiated on the frontend to python.
    """

    js_template = """
    <script>
      function msg_handler(msg) {{
        var msg = msg.content.data;
        var buffers = msg.buffers
        {msg_handler}
      }}
      var comm = window.Trrack.comm_manager.get_client_comm("{comm_id}");
      comm.on_msg(msg_handler);
    </script>
    """

    def __init__(
        self, id=None, on_msg=None, on_error=None, on_stdout=None, on_open=None
    ):
        """
        Initializes a Comms object
        """
        from IPython import get_ipython

        super(JupyterCommJS, self).__init__(id, on_msg, on_error, on_stdout, on_open)
        self.manager = get_ipython().kernel.comm_manager
        self.manager.register_target(self.id, self._handle_open)

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
                raise AssertionError("JupyterCommJS %s is already closed" % self.id)

    def _handle_open(self, comm, msg):
        self._comm = comm
        self._comm.on_msg(self._handle_msg)
        if self._on_open:
            self._on_open(msg)

    def send(self, data=None, metadata=None, buffers=[]):
        """
        Pushes data across comm socket.
        """
        self.comm.send(data, metadata=metadata, buffers=buffers)
