#!/usr/bin/env python3
"""
AWS Config custom rule to check Lambda code signing compliance.
Healthcare compliance requirement for HIPAA/SOC 2.
"""
import boto3
import json
import logging
from typing import Dict, Any
from botocore.config import Config

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

lambda_client = boto3.client('lambda', config=Config(
    connect_timeout=10,
    read_timeout=30,
    retries={'max_attempts': 3}
))
config_client = boto3.client('config', config=Config(
    connect_timeout=10,
    read_timeout=30,
    retries={'max_attempts': 3}
))

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, int]:
    """
    AWS Config rule handler to check if Lambda functions have code signing enabled.

    Args:
        event: AWS Config rule evaluation event
        context: Lambda context object

    Returns:
        Success status code
    """

    # Extract configuration item from event
    configuration_item = event['configurationItem']
    function_name = configuration_item['resourceName']

    logger.info(f"Evaluating code signing for Lambda function: {function_name}")

    try:
        # Get function configuration
        response = lambda_client.get_function(FunctionName=function_name)
        function_config = response.get('Configuration', {})

        # Check if code signing config is attached
        code_signing_config_arn = function_config.get('CodeSigningConfigArn')

        if code_signing_config_arn:
            compliance_type = 'COMPLIANT'
            annotation = f'Lambda function has code signing enabled: {code_signing_config_arn}'
            logger.info(f"COMPLIANT: {function_name} has code signing enabled")
        else:
            compliance_type = 'NON_COMPLIANT'
            annotation = 'Code signing configuration is required for healthcare compliance (HIPAA/SOC 2)'
            logger.warning(f"NON_COMPLIANT: {function_name} missing code signing configuration")

        # Submit evaluation result to AWS Config
        evaluation = {
            'ComplianceResourceType': configuration_item['resourceType'],
            'ComplianceResourceId': configuration_item['resourceId'],
            'ComplianceType': compliance_type,
            'Annotation': annotation,
            'OrderingTimestamp': configuration_item['configurationItemCaptureTime']
        }

        config_client.put_evaluations(
            Evaluations=[evaluation],
            ResultToken=event['resultToken']
        )

        logger.info(f"Successfully submitted evaluation for {function_name}: {compliance_type}")

    except Exception as e:
        error_msg = f"Error evaluating code signing for {function_name}: {str(e)}"
        logger.error(error_msg)

        # Mark as non-compliant if we can't check
        error_evaluation = {
            'ComplianceResourceType': configuration_item['resourceType'],
            'ComplianceResourceId': configuration_item['resourceId'],
            'ComplianceType': 'NON_COMPLIANT',
            'Annotation': f'Unable to verify code signing configuration: {str(e)}',
            'OrderingTimestamp': configuration_item['configurationItemCaptureTime']
        }

        config_client.put_evaluations(
            Evaluations=[error_evaluation],
            ResultToken=event['resultToken']
        )

    return {'statusCode': 200}
