import copy
import os

# Special variable name to indicate that the execution record should be skipped (deleted)
SIGNAL_VAR_SKIP = "__GRAPHLUX_SKIP__"

class EngineSignal:
    """Special control values for the engine."""
    def __init__(self, name: str):
        self.name = name

    def __repr__(self):
        return f"<EngineSignal: {self.name}>"

    def __str__(self):
        return self.name

# Pre-defined signals
SIGNAL_SKIP = EngineSignal("SKIP_EXECUTION")


class FileObj:
    """Represents a file being processed in the DAG pipeline."""
    def __init__(self, path: str, size: int = 0, create_time: float = None, metadata: dict = None):
        self.path = path
        self.size = size
        self.create_time = create_time
        self.metadata = metadata or {}

    @staticmethod
    def from_path(file_path: str):
        return FileObj(
            path=file_path,
            size=os.path.getsize(file_path) if os.path.exists(file_path) else 0,
            create_time=os.path.getctime(file_path),
        )

    def copy(self):
        return copy.deepcopy(self)

    def __getitem__(self, key):
        return getattr(self, key)

    def __setitem__(self, key, value):
        setattr(self, key, value)

    def __contains__(self, key):
        return hasattr(self, key)

    def get(self, key, default=None):
        return getattr(self, key, default)

    def __repr__(self):
        return f"<FileObj path='{self.path}' size={self.size}>"
