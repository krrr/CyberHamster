import subprocess
from typing import List
from ..logger import logger

class FFmpegWrapper:
    @staticmethod
    def run(input_file: str, output_file: str, args: List[str]) -> bool:
        """
        Run FFmpeg with given arguments.

        :param input_file: Path to input file.
        :param output_file: Path to output file.
        :param args: List of ffmpeg arguments (e.g., ['-map', '0:v', '-c:v', 'copy']).
        :return: True if successful, False otherwise.
        """
        # Command syntax: ffmpeg -y -i input_file [args] output_file
        command = ["ffmpeg", "-y", "-i", input_file] + args + [output_file]
        try:
            result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg error for {input_file}: {e.stderr}")
            return False
