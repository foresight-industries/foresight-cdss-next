# libs/shared-ocr

OCR service for extracting insurance card information using Google's Gemini 2.5 Flash model.

## Features

- Extract structured insurance card data using AI-powered OCR
- Support for various image formats (PNG, JPEG, etc.)
- Pydantic models for type-safe data handling
- CLI tool for quick testing
- Comprehensive error handling

## Installation

```bash
# Install with uv
uv pip install -e libs/shared-ocr

# Or install with development dependencies
uv pip install -e "libs/shared-ocr[dev]"
```

## Configuration

Set your Google AI API key as an environment variable:

```bash
export GOOGLE_API_KEY="your-api-key-here"
```

Or create a `.env` file in your project root:

```
GOOGLE_API_KEY=your-api-key-here
```

## Usage

### As a Library

```python
from shared_ocr import GeminiOCRService, InsuranceCardData

# Initialize the service
ocr_service = GeminiOCRService()  # Uses GOOGLE_API_KEY env var
# or
ocr_service = GeminiOCRService(api_key="your-api-key")

# Extract insurance card data
card_data = ocr_service.extract_insurance_card_data("path/to/insurance_card.jpg")

# Access extracted data
print(f"Member Name: {card_data.member_name}")
print(f"Member ID: {card_data.member_id}")
print(f"Insurance Company: {card_data.insurance_company}")

# Extract raw text only
raw_text = ocr_service.extract_text("path/to/image.jpg")
```

### Command Line Interface

```bash
# Extract insurance card data
python -m shared_ocr.cli path/to/insurance_card.jpg

# Output as JSON
python -m shared_ocr.cli path/to/insurance_card.jpg --json

# Extract raw text only
python -m shared_ocr.cli path/to/insurance_card.jpg --raw-text

# Use specific API key
python -m shared_ocr.cli path/to/insurance_card.jpg --api-key "your-key"
```

## Extracted Fields

The service extracts the following insurance card information:

- **member_name**: Name of the insurance member
- **member_id**: Member/Subscriber ID
- **group_number**: Group number
- **plan_name**: Insurance plan name
- **insurance_company**: Insurance company name
- **effective_date**: Coverage effective date
- **copay_info**: Dictionary containing copay amounts (PCP, Specialist, ER, Urgent Care)
- **deductible**: Deductible amount
- **rx_bin**: Prescription BIN number
- **rx_pcn**: Prescription PCN number
- **rx_group**: Prescription group number
- **customer_service_phone**: Customer service phone number
- **provider_phone**: Provider phone number
- **raw_text**: Complete raw text extracted from the card

## Development

### Running Tests

```bash
# Run tests
pytest libs/shared-ocr/tests/

# Run with coverage
pytest libs/shared-ocr/tests/ --cov=shared_ocr
```

### Project Structure

```
libs/shared-ocr/
├── README.md
├── pyproject.toml
├── libs/
│   └── shared_ocr/
│       ├── __init__.py
│       ├── ocr_service.py
│       └── cli.py
└── tests/
    ├── test_ocr_service.py
    └── test_insurance_card_data.py
```