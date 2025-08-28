import os
import base64
from typing import Dict, Any, Optional, Union
from pathlib import Path
from PIL import Image
import io
import google.generativeai as genai
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()


class InsuranceCardData(BaseModel):
    """Model for extracted insurance card information"""
    member_name: Optional[str] = Field(None, description="Name of the insurance member")
    member_id: Optional[str] = Field(None, description="Member/Subscriber ID")
    group_number: Optional[str] = Field(None, description="Group number")
    plan_name: Optional[str] = Field(None, description="Insurance plan name")
    insurance_company: Optional[str] = Field(None, description="Insurance company name")
    effective_date: Optional[str] = Field(None, description="Coverage effective date")
    copay_info: Optional[Dict[str, str]] = Field(None, description="Copay information")
    deductible: Optional[str] = Field(None, description="Deductible amount")
    rx_bin: Optional[str] = Field(None, description="Prescription BIN number")
    rx_pcn: Optional[str] = Field(None, description="Prescription PCN number")
    rx_group: Optional[str] = Field(None, description="Prescription group number")
    customer_service_phone: Optional[str] = Field(None, description="Customer service phone number")
    provider_phone: Optional[str] = Field(None, description="Provider phone number")
    raw_text: Optional[str] = Field(None, description="Raw extracted text from the card")


class GeminiOCRService:
    """OCR Service using Google Gemini 2.5 Flash for insurance card reading"""
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize the Gemini OCR service
        
        Args:
            api_key: Google AI API key. If not provided, will look for GOOGLE_API_KEY env variable
        """
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("Google API key must be provided or set as GOOGLE_API_KEY environment variable")
        
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
    
    def _prepare_image(self, image_input: Union[str, Path, bytes, Image.Image]) -> Image.Image:
        """Prepare image for processing
        
        Args:
            image_input: Image as file path, bytes, or PIL Image
            
        Returns:
            PIL Image object
        """
        if isinstance(image_input, (str, Path)):
            return Image.open(image_input)
        elif isinstance(image_input, bytes):
            return Image.open(io.BytesIO(image_input))
        elif isinstance(image_input, Image.Image):
            return image_input
        else:
            raise ValueError(f"Unsupported image input type: {type(image_input)}")
    
    def extract_insurance_card_data(self, image_input: Union[str, Path, bytes, Image.Image]) -> InsuranceCardData:
        """Extract insurance card information using Gemini
        
        Args:
            image_input: Insurance card image as file path, bytes, or PIL Image
            
        Returns:
            InsuranceCardData object with extracted information
        """
        image = self._prepare_image(image_input)
        
        prompt = """
        Analyze this insurance card image and extract the following information:
        
        1. Member/Subscriber Name
        2. Member ID/Subscriber ID
        3. Group Number
        4. Plan Name
        5. Insurance Company Name
        6. Effective Date
        7. Copay Information (all types like PCP, Specialist, ER, etc.)
        8. Deductible
        9. RX BIN (prescription benefit identification number)
        10. RX PCN (processor control number)
        11. RX Group
        12. Customer Service Phone Number
        13. Provider Phone Number
        
        Format the response as a JSON object with these fields:
        {
            "member_name": "extracted name or null",
            "member_id": "extracted ID or null",
            "group_number": "extracted group number or null",
            "plan_name": "extracted plan name or null",
            "insurance_company": "extracted company name or null",
            "effective_date": "extracted date or null",
            "copay_info": {
                "pcp": "amount or null",
                "specialist": "amount or null",
                "er": "amount or null",
                "urgent_care": "amount or null"
            },
            "deductible": "extracted deductible or null",
            "rx_bin": "extracted BIN or null",
            "rx_pcn": "extracted PCN or null",
            "rx_group": "extracted RX group or null",
            "customer_service_phone": "extracted phone or null",
            "provider_phone": "extracted phone or null",
            "raw_text": "all text visible on the card"
        }
        
        If any field is not found on the card, use null for that field.
        """
        
        try:
            response = self.model.generate_content([prompt, image])
            
            # Extract JSON from response
            response_text = response.text.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            import json
            data = json.loads(response_text.strip())
            
            return InsuranceCardData(**data)
            
        except Exception as e:
            raise Exception(f"Failed to extract insurance card data: {str(e)}")
    
    def extract_text(self, image_input: Union[str, Path, bytes, Image.Image]) -> str:
        """Extract raw text from an image
        
        Args:
            image_input: Image as file path, bytes, or PIL Image
            
        Returns:
            Extracted text as string
        """
        image = self._prepare_image(image_input)
        
        prompt = "Extract all text from this image. Return only the text content, preserving the layout as much as possible."
        
        try:
            response = self.model.generate_content([prompt, image])
            return response.text.strip()
        except Exception as e:
            raise Exception(f"Failed to extract text: {str(e)}")