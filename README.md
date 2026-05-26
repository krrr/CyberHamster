# Graphlux

Graphlux is an automated batch processing and compression tool for images and videos. It features a visual, node-based pipeline editor that lets you easily create custom media workflows (like converting image formats, resizing, and compressing videos) by dragging and connecting nodes.

---

## Features

- **Visual Workflow Editor**: Build custom image and video processing pipelines by connecting input, action, condition, and output nodes in your browser.
- **Smart Skip (Metadata Tracking)**: Avoid reprocessing files. Graphlux writes a custom tag (like XMP status tags) directly to the file's metadata when a file is skipped or compressed, preventing redundant processing without relying solely on a database.
- **Batch Processing**: Automatically scan folder paths, filter by file extensions, and run batch tasks.
- **Real-Time Live Console**: View execution progress and standard system logs in real time as files are processed.

---

## Prerequisites

Make sure you have the following installed on your system:
1. **Python 3.10+**
2. **Node.js** (and `pnpm` package manager)
3. **FFmpeg** (for video and audio compression)
4. **ImageMagick** (for image conversion and processing)

---

## Installation

### 1. Set up the Backend
Navigate to the backend directory and install it in editable mode:
```bash
cd backend
pip install -e .
```

### 2. Set up the Frontend
Navigate to the frontend directory and install dependencies:
```bash
cd frontend
pnpm install
```

---

## Running the Application

### Start the Backend
Runs the backend REST API and task processing service:
```bash
cd backend
python run.py
```

### Start the Frontend
Runs the local development web server:
```bash
cd frontend
pnpm run start
```
Once both are running, open **`http://localhost:4200`** in your browser to access the Graphlux interface.
