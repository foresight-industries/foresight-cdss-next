#!/usr/bin/env python3
import argparse
import json
from pathlib import Path
from .ocr_service import GeminiOCRService


def main():
    parser = argparse.ArgumentParser(description="Extract insurance card information using Gemini OCR")
    parser.add_argument("image_path", type=str, help="Path to insurance card image")
    parser.add_argument("--raw-text", action="store_true", help="Extract only raw text")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    parser.add_argument("--api-key", type=str, help="Google AI API key (optional if set in environment)")
    
    args = parser.parse_args()
    
    try:
        ocr_service = GeminiOCRService(api_key=args.api_key)
        
        if args.raw_text:
            result = ocr_service.extract_text(args.image_path)
            print(result)
        else:
            card_data = ocr_service.extract_insurance_card_data(args.image_path)
            
            if args.json:
                print(json.dumps(card_data.model_dump(exclude_none=True), indent=2))
            else:
                print("Insurance Card Information:")
                print("-" * 40)
                for field, value in card_data.model_dump(exclude_none=True).items():
                    if field == "copay_info" and value:
                        print(f"Copay Information:")
                        for copay_type, amount in value.items():
                            print(f"  - {copay_type.upper()}: {amount}")
                    elif field != "raw_text":
                        print(f"{field.replace('_', ' ').title()}: {value}")
                
                if card_data.raw_text:
                    print("\n" + "-" * 40)
                    print("Raw Text:")
                    print(card_data.raw_text)
                    
    except Exception as e:
        print(f"Error: {str(e)}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())