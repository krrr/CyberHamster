import subprocess
import json
from typing import Dict, Any, Optional
from ..logger import logger

class ExifToolWrapper:
    @staticmethod
    def read_metadata(file_path: str) -> Optional[Dict[str, Any]]:
        """
        Read metadata using exiftool.

        :param file_path: Path to the file.
        :return: A dictionary of metadata, or None if reading fails.
        """
        command = ["exiftool", "-json", file_path]
        try:
            result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
            data = json.loads(result.stdout)
            if data and len(data) > 0:
                return data[0]
            return {}
        except (subprocess.CalledProcessError, json.JSONDecodeError) as e:
            logger.error(f"Exiftool read error for {file_path}: {e}")
            return None

    @staticmethod
    def write_metadata(file_path: str, tags: Dict[str, str]) -> bool:
        """
        Write metadata to a file using exiftool.

        :param file_path: Path to the file.
        :param tags: Dictionary of tag names and values (e.g., {'XMP:ProcessingStatus': 'Processed'}).
        :return: True if successful, False otherwise.
        """
        command = ["exiftool", "-overwrite_original"]
        for tag, value in tags.items():
            command.append(f"-{tag}={value}")
        command.append(file_path)

        try:
            subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"Exiftool write error for {file_path}: {e.stderr}")
            return False
