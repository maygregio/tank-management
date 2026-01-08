import json
import asyncio
from pathlib import Path
from typing import TypeVar, List, Any

from filelock import FileLock

T = TypeVar("T")

# Data directory - relative to project root (one level up from backend)
DATA_DIR = Path(__file__).parent.parent.parent.parent / "data"


class JsonStorage:
    """Generic JSON file storage with file locking."""

    def __init__(self, filename: str):
        self.filepath = DATA_DIR / filename
        self._lock = asyncio.Lock()
        self._file_lock = FileLock(str(self.filepath) + ".lock", timeout=10)

    async def read(self, default: List[Any] | None = None) -> List[Any]:
        """Read data from JSON file."""
        async with self._lock:
            try:
                with self._file_lock:
                    content = self.filepath.read_text(encoding="utf-8")
                    return json.loads(content)
            except (FileNotFoundError, json.JSONDecodeError) as e:
                print(f"Could not read {self.filepath}: {e}")
                return default if default is not None else []

    async def write(self, data: List[Any]) -> None:
        """Write data to JSON file with locking."""
        async with self._lock:
            with self._file_lock:
                # Ensure directory exists
                self.filepath.parent.mkdir(parents=True, exist_ok=True)
                self.filepath.write_text(
                    json.dumps(data, indent=2, default=str), encoding="utf-8"
                )


# Storage instances
tanks_storage = JsonStorage("tanks.json")
movements_storage = JsonStorage("movements.json")
properties_storage = JsonStorage("properties.json")
users_storage = JsonStorage("users.json")
audit_storage = JsonStorage("audit-log.json")
