# Secure Messaging Platform

A secure messaging platform backend built with FastAPI, SQLite (in WAL mode), and Python.

## Project Structure

- `backend/`: FastAPI backend implementation.
  - `app/`: Contains routing, core logic, and WebSocket management.
  - `schema.sql`: Database schema definition.

## Setup

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the development server:
   ```bash
   uvicorn app.main:app --reload
   ```

## API Documentation

Once the server is running, you can access the automatic, interactive API documentation (provided by Swagger UI) at:
- http://127.0.0.1:8000/docs
