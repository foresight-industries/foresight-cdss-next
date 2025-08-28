import pytest
from shared_ocr import InsuranceCardData


class TestInsuranceCardData:
    def test_create_with_all_fields(self):
        data = InsuranceCardData(
            member_name="John Doe",
            member_id="123456789",
            group_number="GRP001",
            plan_name="PPO Plus",
            insurance_company="Test Insurance",
            effective_date="01/01/2024",
            copay_info={
                "pcp": "$20",
                "specialist": "$40",
                "er": "$150",
                "urgent_care": "$50"
            },
            deductible="$1,500",
            rx_bin="123456",
            rx_pcn="ADV",
            rx_group="RX001",
            customer_service_phone="1-800-123-4567",
            provider_phone="1-800-765-4321",
            raw_text="Full card text"
        )
        
        assert data.member_name == "John Doe"
        assert data.member_id == "123456789"
        assert data.copay_info["pcp"] == "$20"
        assert data.deductible == "$1,500"
    
    def test_create_with_minimal_fields(self):
        data = InsuranceCardData(
            member_name="Jane Smith",
            member_id="987654321"
        )
        
        assert data.member_name == "Jane Smith"
        assert data.member_id == "987654321"
        assert data.group_number is None
        assert data.copay_info is None
    
    def test_create_empty(self):
        data = InsuranceCardData()
        
        assert data.member_name is None
        assert data.member_id is None
        assert data.copay_info is None
    
    def test_model_dump_exclude_none(self):
        data = InsuranceCardData(
            member_name="Test User",
            member_id="111111111",
            group_number=None,
            plan_name="Basic Plan"
        )
        
        dumped = data.model_dump(exclude_none=True)
        
        assert "member_name" in dumped
        assert "member_id" in dumped
        assert "plan_name" in dumped
        assert "group_number" not in dumped
        assert "copay_info" not in dumped
    
    def test_model_dump_include_all(self):
        data = InsuranceCardData(
            member_name="Test User",
            member_id="111111111"
        )
        
        dumped = data.model_dump()
        
        assert "member_name" in dumped
        assert "member_id" in dumped
        assert "group_number" in dumped
        assert dumped["group_number"] is None