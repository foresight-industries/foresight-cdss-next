#!/usr/bin/env python3
"""
Example usage of the shared-ocr library for insurance card processing
"""

from shared_ocr import GeminiOCRService, InsuranceCardData
import os
from pathlib import Path


def main():
    # Initialize the OCR service
    # Make sure GEMINI_API_KEY is set in your environment
    try:
        ocr_service = GeminiOCRService()
    except ValueError as e:
        print(f"Error: {e}")
        print("Please set the GEMINI_API_KEY environment variable")
        return

    # Example: Process an insurance card image
    # Replace with your actual image path
    image_path = "path/to/your/insurance_card.jpg"

    if not Path(image_path).exists():
        print(f"Please update the image_path variable to point to an actual insurance card image")
        return

    print("Extracting insurance card information...")

    try:
        # Extract structured data
        card_data = ocr_service.extract_insurance_card_data(image_path)

        print("\n=== Insurance Card Information ===")
        print(f"Member Name: {card_data.member_name or 'Not found'}")
        print(f"Member ID: {card_data.member_id or 'Not found'}")
        print(f"Group Number: {card_data.group_number or 'Not found'}")
        print(f"Insurance Company: {card_data.insurance_company or 'Not found'}")
        print(f"Plan Name: {card_data.plan_name or 'Not found'}")
        print(f"Effective Date: {card_data.effective_date or 'Not found'}")

        if card_data.copay_info:
            print("\nCopay Information:")
            for copay_type, amount in card_data.copay_info.items():
                if amount:
                    print(f"  - {copay_type.upper()}: {amount}")

        print(f"\nDeductible: {card_data.deductible or 'Not found'}")
        print(f"\nRX BIN: {card_data.rx_bin or 'Not found'}")
        print(f"RX PCN: {card_data.rx_pcn or 'Not found'}")
        print(f"RX Group: {card_data.rx_group or 'Not found'}")

        print(f"\nCustomer Service: {card_data.customer_service_phone or 'Not found'}")
        print(f"Provider Phone: {card_data.provider_phone or 'Not found'}")

        # Also demonstrate raw text extraction
        print("\n=== Raw Text Extraction ===")
        raw_text = ocr_service.extract_text(image_path)
        print(raw_text[:500] + "..." if len(raw_text) > 500 else raw_text)

    except Exception as e:
        print(f"Error processing image: {e}")


if __name__ == "__main__":
    main()
