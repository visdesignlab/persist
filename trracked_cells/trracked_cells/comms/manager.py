from ipykernel.comm import Comm as IPyComm

from .comm import Comm, JupyterComm, JupyterCommJS


class CommManager(object):
    """
    The CommManager is an abstract baseclass for establishing
    websocket comms on the client and the server.
    """

    js_manager = """
    function CommManager() {
    }
    CommManager.prototype.register_target = function() {
    }
    CommManager.prototype.get_client_comm = function() {
    }
    window.Trrack.comm_manager = CommManager()
    """

    _comms = {}

    server_comm = Comm

    client_comm = Comm

    @classmethod
    def get_server_comm(
        cls, on_msg=None, id=None, on_error=None, on_stdout=None, on_open=None
    ):
        comm = cls.server_comm(id, on_msg, on_error, on_stdout, on_open)
        cls._comms[comm.id] = comm
        return comm

    @classmethod
    def get_client_comm(
        cls, on_msg=None, id=None, on_error=None, on_stdout=None, on_open=None
    ):
        comm = cls.client_comm(id, on_msg, on_error, on_stdout, on_open)
        cls._comms[comm.id] = comm
        return comm


class JupyterCommManager(CommManager):
    """
    The JupyterCommManager is used to establishing websocket comms on
    the client and the server via the Jupyter comms interface.
    There are two cases for both the register_target and get_client_comm
    methods: one to handle the classic notebook frontend and one to
    handle JupyterLab. The latter case uses the globally available PyViz
    object which is made available by each PyViz project requiring the
    use of comms. This object is handled in turn by the JupyterLab
    extension which keeps track of the kernels associated with each
    plot, ensuring the corresponding comms can be accessed.
    """

    js_manager = """
    function TrrackCommManager() {
    }
    TrrackCommManager.prototype.register_target = function(plot_id, comm_id, msg_handler) {
      if (window.comm_manager || ((window.Jupyter !== undefined) && (Jupyter.notebook.kernel != null))) {
        var comm_manager = window.comm_manager || Jupyter.notebook.kernel.comm_manager;
        comm_manager.register_target(comm_id, function(comm) {
          comm.on_msg(msg_handler);
        });
      } else if ((plot_id in window.Trrack.kernels) && (window.Trrack.kernels[plot_id])) {
        window.Trrack.kernels[plot_id].registerCommTarget(comm_id, function(comm) {
          comm.onMsg = msg_handler;
        });
      } else if (typeof google != 'undefined' && google.colab.kernel != null) {
        google.colab.kernel.comms.registerTarget(comm_id, (comm) => {
          var messages = comm.messages[Symbol.asyncIterator]();
          function processIteratorResult(result) {
            var message = result.value;
            console.log(message)
            var content = {data: message.data, comm_id};
            var buffers = []
            for (var buffer of message.buffers || []) {
              buffers.push(new DataView(buffer))
            }
            var metadata = message.metadata || {};
            var msg = {content, buffers, metadata}
            msg_handler(msg);
            return messages.next().then(processIteratorResult);
          }
          return messages.next().then(processIteratorResult);
        })
      }
    }
    TrrackCommManager.prototype.get_client_comm = function(plot_id, comm_id, msg_handler) {
      if (comm_id in window.Trrack.comms) {
        return window.Trrack.comms[comm_id];
      } else if (window.comm_manager || ((window.Jupyter !== undefined) && (Jupyter.notebook.kernel != null))) {
        var comm_manager = window.comm_manager || Jupyter.notebook.kernel.comm_manager;
        var comm = comm_manager.new_comm(comm_id, {}, {}, {}, comm_id);
        if (msg_handler) {
          comm.on_msg(msg_handler);
        }
      } else if ((plot_id in window.Trrack.kernels) && (window.Trrack.kernels[plot_id])) {
        var comm = window.Trrack.kernels[plot_id].connectToComm(comm_id);
        comm.open();
        if (msg_handler) {
          comm.onMsg = msg_handler;
        }
      } else if (typeof google != 'undefined' && google.colab.kernel != null) {
        var comm_promise = google.colab.kernel.comms.open(comm_id)
        comm_promise.then((comm) => {
          window.Trrack.comms[comm_id] = comm;
          if (msg_handler) {
            var messages = comm.messages[Symbol.asyncIterator]();
            function processIteratorResult(result) {
              var message = result.value;
              var content = {data: message.data};
              var metadata = message.metadata || {comm_id};
              var msg = {content, metadata}
              msg_handler(msg);
              return messages.next().then(processIteratorResult);
            }
            return messages.next().then(processIteratorResult);
          }
        }) 
        var sendClosure = (data, metadata, buffers, disposeOnDone) => {
          return comm_promise.then((comm) => {
            comm.send(data, metadata, buffers, disposeOnDone);
          });
        };
        var comm = {
          send: sendClosure
        };
      }
      window.Trrack.comms[comm_id] = comm;
      return comm;
    }
    console.log("Registering TrrackCommManager");
    window.Trrack.comm_manager = new TrrackCommManager();
    """

    server_comm = JupyterComm

    client_comm = JupyterCommJS
