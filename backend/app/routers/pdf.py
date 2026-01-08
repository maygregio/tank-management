import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile, File

from app.services.file_storage import properties_storage
from app.services.pdf_extraction import extract_data_from_pdf

router = APIRouter(tags=["pdf"])

# Uploads directory - relative to project root (one level up from backend)
UPLOADS_DIR = Path(__file__).parent.parent.parent.parent / "uploads"
ALLOWED_MIME_TYPES = ["application/pdf"]
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/extract-pdf")
async def extract_pdf(file: UploadFile = File(...)):
    """Extract data from PDF using LLM."""
    # Validate MIME type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400, detail="Invalid file type. Only PDF files are allowed."
        )

    content = await file.read()

    # Validate size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400, detail="File too large. Maximum size is 10MB."
        )

    properties = await properties_storage.read()
    result = await extract_data_from_pdf(content, properties)

    return result


@router.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """Upload a PDF file."""
    # Validate MIME type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400, detail="Invalid file type. Only PDF files are allowed."
        )

    content = await file.read()

    # Validate size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400, detail="File too large. Maximum size is 10MB."
        )

    # Ensure uploads directory exists
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    # Generate unique filename
    ext = Path(file.filename).suffix if file.filename else ".pdf"
    filename = f"{uuid.uuid4()}{ext}"
    filepath = UPLOADS_DIR / filename

    # Write file
    filepath.write_bytes(content)

    return {"path": f"/uploads/{filename}"}
