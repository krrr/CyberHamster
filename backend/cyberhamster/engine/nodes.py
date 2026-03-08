import os
import shutil
import tempfile
import shlex
from typing import Any, Dict, Optional, Tuple, List
from .context import FileContext
from ..tools.ffmpeg_wrapper import FFmpegWrapper
from ..tools.exiftool_wrapper import ExifToolWrapper
from ..tools.imagemagick_wrapper import ImageMagickWrapper
from ..logger import logger

class DAGNode:
    """Base class for a node in the execution DAG."""
    def __init__(self, node_id: str, name: str, config: Dict[str, Any] = None):
        self.node_id = node_id
        self.name = name
        self.config = config or {}
    
    def execute(self, context: FileContext) -> Tuple[bool, Optional[str]]:
        """
        Execute the node logic.
        :param context: The context of the file being processed.
        :return: A tuple of (success_boolean, next_branch_name).
                 If next_branch_name is None, the default sequence continues.
        """
        raise NotImplementedError("Subclasses must implement execute()")

class ReadInputNode(DAGNode):
    """Reads metadata, stops if already processed."""
    def execute(self, context: FileContext) -> Tuple[bool, Optional[str]]:
        file_path = context.current_file_path
        if not os.path.exists(file_path):
            logger.error(f"[{self.name}] Input file not found: {file_path}")
            return False, None

        logger.info(f"[{self.name}] Reading metadata for {file_path}")
        metadata = ExifToolWrapper.read_metadata(file_path)
        if metadata is None:
            logger.error(f"[{self.name}] Failed to read metadata from {file_path}")
            return False, None

        for k, v in metadata.items():
            context.set_metadata(k, v)
        
        # Check if already processed (example logic from config)
        check_tag = self.config.get("check_tag", "XMP:ProcessingStatus")
        skip_value = self.config.get("skip_value", "Processed=True")
        
        if check_tag in metadata and str(metadata[check_tag]) == skip_value:
            logger.info(f"[{self.name}] File {file_path} already processed (tag: {check_tag}={skip_value}). Skipping.")
            return False, None
            
        return True, "default"

class ConvertNode(DAGNode):
    """Converts image format."""
    def execute(self, context: FileContext) -> Tuple[bool, Optional[str]]:
        input_file = context.current_file_path
        if not os.path.exists(input_file):
            logger.error(f"[{self.name}] Input file not found: {input_file}")
            return False, None

        target_ext = self.config.get("target_extension", ".avif")
        
        # Create a temp file
        try:
            temp_fd, temp_path = tempfile.mkstemp(suffix=target_ext)
            os.close(temp_fd)
            context.add_temp_file(temp_path)
        except OSError as e:
            logger.error(f"[{self.name}] Failed to create temporary file: {e}")
            return False, None
        
        # Determine tool based on config or default to ImageMagick for images
        tool = self.config.get("tool", "imagemagick")
        args = self.config.get("args", [])
        
        logger.info(f"[{self.name}] Converting {input_file} to {temp_path} using {tool}")
        success = False
        if tool == "imagemagick":
            success = ImageMagickWrapper.run(input_file, temp_path, args)
        elif tool == "ffmpeg":
            success = FFmpegWrapper.run(input_file, temp_path, args)
        else:
            logger.error(f"[{self.name}] Unknown tool: {tool}")
            return False, None
            
        if success:
            logger.info(f"[{self.name}] Conversion successful: {temp_path}")
            context.update_current_path(temp_path)
            return True, "default"
        
        logger.error(f"[{self.name}] Conversion failed for {input_file}")
        return False, None

class CalculateCompressionNode(DAGNode):
    """Calculates compression ratio."""
    def execute(self, context: FileContext) -> Tuple[bool, Optional[str]]:
        original_file = context.original_file_path
        current_file = context.current_file_path
        
        if not os.path.exists(original_file):
            logger.error(f"[{self.name}] Original file not found: {original_file}")
            return False, None
        if not os.path.exists(current_file):
            logger.error(f"[{self.name}] Current file not found: {current_file}")
            return False, None

        try:
            original_size = os.path.getsize(original_file)
            current_size = os.path.getsize(current_file)
            if original_size == 0:
                ratio = 1.0
                logger.warning(f"[{self.name}] Original file size is 0: {original_file}")
            else:
                ratio = current_size / original_size
                
            logger.info(f"[{self.name}] Compression ratio: {ratio:.4f} ({original_size} -> {current_size} bytes)")
            context.set_shared_data("compression_ratio", ratio)
            return True, "default"
        except OSError as e:
            logger.error(f"[{self.name}] Error calculating sizes: {e}")
            return False, None

class ConditionNode(DAGNode):
    """Evaluates a condition and branches."""
    def execute(self, context: FileContext) -> Tuple[bool, Optional[str]]:
        var_name = self.config.get("variable")
        operator = self.config.get("operator")
        threshold = self.config.get("threshold")
        
        val = context.get_shared_data(var_name)
        if val is None:
            logger.error(f"[{self.name}] Shared data variable '{var_name}' not found.")
            return False, None
            
        result = False
        if operator == "<":
            result = val < threshold
        elif operator == ">":
            result = val > threshold
        elif operator == "==":
            result = val == threshold
        else:
            logger.error(f"[{self.name}] Unknown operator: {operator}")
            return False, None
            
        logger.info(f"[{self.name}] Condition '{var_name} {operator} {threshold}' (value={val}) evaluated to {result}")
        
        if result:
            return True, "true_branch"
        else:
            return True, "false_branch"

class FileOperationNode(DAGNode):
    """Moves, deletes, or overwrites files."""
    def execute(self, context: FileContext) -> Tuple[bool, Optional[str]]:
        action = self.config.get("action") # "overwrite", "cleanup"
        
        if action == "overwrite":
            current = context.current_file_path
            orig = context.original_file_path

            if not os.path.exists(current):
                logger.error(f"[{self.name}] Source file for overwrite not found: {current}")
                return False, None
            
            if current != orig:
                target_ext = self.config.get("target_extension")
                if target_ext:
                    base, _ = os.path.splitext(orig)
                    new_dest = base + target_ext
                    logger.info(f"[{self.name}] Moving {current} to {new_dest}")
                    try:
                        shutil.move(current, new_dest)
                        # if extension changed, we might want to delete the original if it's different
                        if new_dest != orig:
                            if os.path.exists(orig):
                                logger.info(f"[{self.name}] Removing original file: {orig}")
                                os.remove(orig)
                        context.update_current_path(new_dest)
                        # current file is no longer temporary
                        if current in context.temp_files:
                            context.temp_files.remove(current)
                    except OSError as e:
                        logger.error(f"[{self.name}] Failed to move file: {e}")
                        return False, None
                else:
                    logger.info(f"[{self.name}] Overwriting {orig} with {current}")
                    try:
                        shutil.move(current, orig)
                        context.update_current_path(orig)
                        if current in context.temp_files:
                             context.temp_files.remove(current)
                    except OSError as e:
                        logger.error(f"[{self.name}] Failed to overwrite file: {e}")
                        return False, None
                         
        elif action == "cleanup":
             logger.info(f"[{self.name}] Explicit cleanup requested (handled by context at the end).")
             pass
        else:
            logger.error(f"[{self.name}] Unknown action: {action}")
            return False, None
             
        return True, "default"

class MetadataWriteNode(DAGNode):
    """Writes metadata tags."""
    def execute(self, context: FileContext) -> Tuple[bool, Optional[str]]:
        tags = self.config.get("tags", {})
        target_file = context.current_file_path # could be original if we reverted
        
        # If the DAG failed/was rejected and we want to write to original
        write_to_original = self.config.get("write_to_original", False)
        if write_to_original:
            target_file = context.original_file_path
            
        if not os.path.exists(target_file):
            logger.error(f"[{self.name}] Target file for metadata write not found: {target_file}")
            return False, None

        logger.info(f"[{self.name}] Writing tags to {target_file}: {tags}")
        success = ExifToolWrapper.write_metadata(target_file, tags)
        if success:
            return True, "default"
        else:
            logger.error(f"[{self.name}] Failed to write metadata to {target_file}")
            return False, None

class FFmpegActionNode(DAGNode):
    """Executes FFmpeg with specific parameters."""
    def execute(self, context: FileContext) -> Tuple[bool, Optional[str]]:
        input_file = context.current_file_path
        if not os.path.exists(input_file):
            logger.error(f"[{self.name}] Input file not found: {input_file}")
            return False, None

        # Example format: "-map 0:v -map 0:a:0 -c:v copy -c:a aac -b:a 128k"
        args_str = self.config.get("args", "")
        args = shlex.split(args_str)
        
        ext = self.config.get("extension", ".mp4")
        try:
            temp_fd, temp_path = tempfile.mkstemp(suffix=ext)
            os.close(temp_fd)
            context.add_temp_file(temp_path)
        except OSError as e:
            logger.error(f"[{self.name}] Failed to create temporary file: {e}")
            return False, None
        
        logger.info(f"[{self.name}] Executing FFmpeg on {input_file} -> {temp_path} with args: {args_str}")
        success = FFmpegWrapper.run(input_file, temp_path, args)
        if success:
            logger.info(f"[{self.name}] FFmpeg successful: {temp_path}")
            context.update_current_path(temp_path)
            return True, "default"
        
        logger.error(f"[{self.name}] FFmpeg execution failed for {input_file}")
        return False, None

# A registry to instantiate nodes by type
NODE_TYPES = {
    "ReadInputNode": ReadInputNode,
    "ConvertNode": ConvertNode,
    "CalculateCompressionNode": CalculateCompressionNode,
    "ConditionNode": ConditionNode,
    "FileOperationNode": FileOperationNode,
    "MetadataWriteNode": MetadataWriteNode,
    "FFmpegActionNode": FFmpegActionNode
}
