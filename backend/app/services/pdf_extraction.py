import os
import json
import io
from typing import List, Dict, Any, Optional

from pypdf import PdfReader

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "anthropic")


async def extract_data_from_pdf(
    pdf_bytes: bytes, property_definitions: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Extract structured data from PDF using LLM."""

    # Parse PDF to text
    reader = PdfReader(io.BytesIO(pdf_bytes))
    pdf_text = ""
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pdf_text += text

    if not pdf_text.strip():
        return {"volume": None, "properties": [], "rawText": ""}

    property_names = ", ".join(
        f"{p['name']} ({p['unit']})" for p in property_definitions
    )

    prompt = f"""You are an expert at extracting data from lab analysis reports for Carbon Black Oil.

Extract the following information from this lab report text:
1. Volume (if mentioned) - typically in kilo barrels (KB) or barrels
2. Properties: {property_names}

The report may use different names or abbreviations for these properties. Match them as best you can.

Return ONLY a JSON object in this exact format (no markdown, no explanation):
{{
  "volume": <number or null if not found>,
  "properties": [
    {{"name": "<property name>", "value": <number>, "unit": "<unit if mentioned>"}}
  ]
}}

Lab Report Text:
{pdf_text}"""

    try:
        if LLM_PROVIDER == "openai":
            return await _extract_with_openai(prompt)
        else:
            return await _extract_with_anthropic(prompt)
    except Exception as e:
        print(f"LLM extraction failed: {e}")
        return {"volume": None, "properties": [], "rawText": pdf_text}


async def _extract_with_anthropic(prompt: str) -> Dict[str, Any]:
    """Extract data using Anthropic Claude."""
    import anthropic

    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    response = client.messages.create(
        model="claude-3-haiku-20240307",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    text_content = response.content[0]
    if text_content.type != "text":
        raise ValueError("No text response from Anthropic")

    json_str = text_content.text.strip()
    parsed = json.loads(json_str)

    return {
        "volume": parsed.get("volume"),
        "properties": parsed.get("properties", []),
    }


async def _extract_with_openai(prompt: str) -> Dict[str, Any]:
    """Extract data using OpenAI."""
    import openai

    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content
    if not content:
        raise ValueError("No response from OpenAI")

    parsed = json.loads(content)

    return {
        "volume": parsed.get("volume"),
        "properties": parsed.get("properties", []),
    }
