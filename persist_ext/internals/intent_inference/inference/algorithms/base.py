import json
from abc import abstractmethod


class AlgorithmBase:
    __abstract__ = True

    def __init__(self):
        self.algorithm = ""
        self.intent = ""
        self.dimensions = []
        self.labels = []
        self.params = {}
        self.info = {}

    @abstractmethod
    def to_dict(self) -> dict:
        return {
            "algorithm": self.algorithm,
            "intent": self.intent,
            "dimensions": ",".join(self.dimensions),
            "output": ",".join(map(str, self.labels)),
            "params": json.dumps(self.params),
            "info": json.dumps(self.info),
        }
