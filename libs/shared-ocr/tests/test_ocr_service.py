import pytest
from unittest.mock import Mock, patch, MagicMock
from PIL import Image
import io
import json

from shared_ocr import GeminiOCRService, InsuranceCardData


@pytest.fixture
def mock_genai():
    with patch('shared_ocr.ocr_service.genai') as mock:
        yield mock


@pytest.fixture
def ocr_service(mock_genai):
    with patch.dict('os.environ', {'GOOGLE_API_KEY': 'test-api-key'}):
        service = GeminiOCRService()
        return service


@pytest.fixture
def sample_image():
    # Create a simple test image
    img = Image.new('RGB', (100, 100), color='white')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    return img_bytes.getvalue()


class TestGeminiOCRService:
    def test_init_with_api_key(self, mock_genai):
        service = GeminiOCRService(api_key="direct-api-key")
        assert service.api_key == "direct-api-key"
        mock_genai.configure.assert_called_once_with(api_key="direct-api-key")
    
    def test_init_with_env_api_key(self, mock_genai):
        with patch.dict('os.environ', {'GOOGLE_API_KEY': 'env-api-key'}):
            service = GeminiOCRService()
            assert service.api_key == "env-api-key"
            mock_genai.configure.assert_called_once_with(api_key="env-api-key")
    
    def test_init_without_api_key_raises_error(self, mock_genai):
        with patch.dict('os.environ', {}, clear=True):
            with pytest.raises(ValueError, match="Google API key must be provided"):
                GeminiOCRService()
    
    def test_prepare_image_from_path(self, ocr_service):
        with patch('shared_ocr.ocr_service.Image.open') as mock_open:
            mock_img = Mock()
            mock_open.return_value = mock_img
            
            result = ocr_service._prepare_image("/path/to/image.jpg")
            
            mock_open.assert_called_once_with("/path/to/image.jpg")
            assert result == mock_img
    
    def test_prepare_image_from_bytes(self, ocr_service, sample_image):
        result = ocr_service._prepare_image(sample_image)
        assert isinstance(result, Image.Image)
    
    def test_prepare_image_from_pil_image(self, ocr_service):
        img = Image.new('RGB', (50, 50), color='red')
        result = ocr_service._prepare_image(img)
        assert result == img
    
    def test_prepare_image_invalid_type(self, ocr_service):
        with pytest.raises(ValueError, match="Unsupported image input type"):
            ocr_service._prepare_image(12345)
    
    def test_extract_insurance_card_data_success(self, ocr_service, sample_image):
        mock_response = Mock()
        mock_response.text = json.dumps({
            "member_name": "John Doe",
            "member_id": "123456789",
            "group_number": "GRP001",
            "plan_name": "PPO Plus",
            "insurance_company": "Test Insurance Co",
            "effective_date": "01/01/2024",
            "copay_info": {
                "pcp": "$20",
                "specialist": "$40",
                "er": "$150"
            },
            "deductible": "$1,500",
            "rx_bin": "123456",
            "rx_pcn": "ADV",
            "rx_group": "RX001",
            "customer_service_phone": "1-800-123-4567",
            "provider_phone": "1-800-765-4321",
            "raw_text": "Sample insurance card text"
        })
        
        ocr_service.model.generate_content = Mock(return_value=mock_response)
        
        result = ocr_service.extract_insurance_card_data(sample_image)
        
        assert isinstance(result, InsuranceCardData)
        assert result.member_name == "John Doe"
        assert result.member_id == "123456789"
        assert result.group_number == "GRP001"
        assert result.copay_info["pcp"] == "$20"
    
    def test_extract_insurance_card_data_with_json_markers(self, ocr_service, sample_image):
        mock_response = Mock()
        mock_response.text = """```json
        {
            "member_name": "Jane Smith",
            "member_id": "987654321",
            "group_number": null,
            "plan_name": "HMO Basic",
            "insurance_company": "Another Insurance",
            "effective_date": null,
            "copay_info": null,
            "deductible": null,
            "rx_bin": null,
            "rx_pcn": null,
            "rx_group": null,
            "customer_service_phone": "1-888-999-0000",
            "provider_phone": null,
            "raw_text": "Partial card info"
        }
        ```"""
        
        ocr_service.model.generate_content = Mock(return_value=mock_response)
        
        result = ocr_service.extract_insurance_card_data(sample_image)
        
        assert result.member_name == "Jane Smith"
        assert result.member_id == "987654321"
        assert result.group_number is None
        assert result.copay_info is None
    
    def test_extract_insurance_card_data_error(self, ocr_service, sample_image):
        ocr_service.model.generate_content = Mock(side_effect=Exception("API Error"))
        
        with pytest.raises(Exception, match="Failed to extract insurance card data: API Error"):
            ocr_service.extract_insurance_card_data(sample_image)
    
    def test_extract_text_success(self, ocr_service, sample_image):
        mock_response = Mock()
        mock_response.text = "  This is extracted text  "
        
        ocr_service.model.generate_content = Mock(return_value=mock_response)
        
        result = ocr_service.extract_text(sample_image)
        
        assert result == "This is extracted text"
    
    def test_extract_text_error(self, ocr_service, sample_image):
        ocr_service.model.generate_content = Mock(side_effect=Exception("API Error"))
        
        with pytest.raises(Exception, match="Failed to extract text: API Error"):
            ocr_service.extract_text(sample_image)