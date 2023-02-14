from ipykernel.comm import Comm


class UIComm(object):
    comm: Comm

    def __init__(self, trracked) -> None:
        self.trracked = trracked
        comm = self.set_comm()
        self.comm = comm

    def set_comm(self):
        def _recv(msg):
            cell_id = msg["content"]["data"]["cellId"]
            print(msg)
            print(cell_id)
            if cell_id and len(cell_id) > 0:
                self.trracked.set(cell_id)
            comm.send({"echo": cell_id})

        print("Init UIComm")
        comm = Comm(target_name="trracked_cells", on_msg=_recv)
        return comm

    def send(self, msg):
        self.comm.send(msg)
