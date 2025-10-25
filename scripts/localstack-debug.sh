#!/bin/bash

# LocalStack Debug and Monitoring Script
# Provides debugging utilities for LocalStack development

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env.localstack.local"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
    echo -e "${PURPLE}[DEBUG]${NC} $1"
}

# Check LocalStack health
check_health() {
    log_info "Checking LocalStack health..."
    
    if ! curl -s http://localhost:4566/_localstack/health &>/dev/null; then
        log_error "LocalStack is not responding"
        return 1
    fi
    
    local health_json=$(curl -s http://localhost:4566/_localstack/health)
    echo "$health_json" | jq '.'
    
    log_success "Health check completed"
}

# List all deployed resources
list_resources() {
    log_info "Listing deployed resources in LocalStack..."
    
    echo -e "\n${GREEN}S3 Buckets:${NC}"
    aws --endpoint-url=http://localhost:4566 s3 ls
    
    echo -e "\n${GREEN}Lambda Functions:${NC}"
    aws --endpoint-url=http://localhost:4566 lambda list-functions --query 'Functions[].FunctionName' --output table
    
    echo -e "\n${GREEN}SNS Topics:${NC}"
    aws --endpoint-url=http://localhost:4566 sns list-topics --query 'Topics[].TopicArn' --output table
    
    echo -e "\n${GREEN}SQS Queues:${NC}"
    aws --endpoint-url=http://localhost:4566 sqs list-queues --query 'QueueUrls' --output table
    
    echo -e "\n${GREEN}RDS Clusters:${NC}"
    aws --endpoint-url=http://localhost:4566 rds describe-db-clusters --query 'DBClusters[].DBClusterIdentifier' --output table || log_warning "RDS not available"
    
    echo -e "\n${GREEN}CloudFormation Stacks:${NC}"
    aws --endpoint-url=http://localhost:4566 cloudformation list-stacks --query 'StackSummaries[?StackStatus!=`DELETE_COMPLETE`].[StackName,StackStatus]' --output table
}

# Monitor LocalStack logs
monitor_logs() {
    log_info "Monitoring LocalStack logs (press Ctrl+C to stop)..."
    
    if command -v docker-compose &> /dev/null; then
        cd "$PROJECT_ROOT"
        docker-compose -f docker-compose.localstack.yml --env-file "$ENV_FILE" logs -f
    else
        docker logs -f localstack-foresight-rcm
    fi
}

# Debug specific service
debug_service() {
    local service="$1"
    
    log_info "Debugging $service service..."
    
    case "$service" in
        "s3")
            echo -e "\n${GREEN}S3 Service Debug:${NC}"
            aws --endpoint-url=http://localhost:4566 s3 ls
            
            # List objects in each bucket
            local buckets=$(aws --endpoint-url=http://localhost:4566 s3 ls --output text | awk '{print $3}')
            for bucket in $buckets; do
                echo -e "\n${YELLOW}Contents of bucket $bucket:${NC}"
                aws --endpoint-url=http://localhost:4566 s3 ls "s3://$bucket" --recursive || true
            done
            ;;
        "lambda")
            echo -e "\n${GREEN}Lambda Service Debug:${NC}"
            local functions=$(aws --endpoint-url=http://localhost:4566 lambda list-functions --query 'Functions[].FunctionName' --output text)
            
            for func in $functions; do
                echo -e "\n${YELLOW}Function: $func${NC}"
                aws --endpoint-url=http://localhost:4566 lambda get-function --function-name "$func" --query 'Configuration.[Runtime,Handler,Environment]' --output table
            done
            ;;
        "config")
            echo -e "\n${GREEN}Config Service Debug:${NC}"
            aws --endpoint-url=http://localhost:4566 configservice describe-configuration-recorders || log_warning "Config service not available"
            aws --endpoint-url=http://localhost:4566 configservice describe-configuration-recorder-status || log_warning "Config recorder status not available"
            ;;
        "securityhub")
            echo -e "\n${GREEN}Security Hub Debug:${NC}"
            aws --endpoint-url=http://localhost:4566 securityhub get-enabled-standards || log_warning "Security Hub not available"
            ;;
        *)
            log_error "Unknown service: $service"
            echo "Available services: s3, lambda, config, securityhub"
            return 1
            ;;
    esac
}

# Test connectivity to all services
test_connectivity() {
    log_info "Testing connectivity to all healthcare RCM services..."
    
    local services=("s3" "lambda" "sns" "sqs" "sts" "iam" "cloudformation")
    local failed_services=()
    
    for service in "${services[@]}"; do
        if curl -s "http://localhost:4566/_localstack/health" | jq -r ".services.$service" | grep -q "available"; then
            log_success "$service is available"
        else
            log_warning "$service is not available"
            failed_services+=("$service")
        fi
    done
    
    if [ ${#failed_services[@]} -eq 0 ]; then
        log_success "All core services are available"
    else
        log_warning "Failed services: ${failed_services[*]}"
    fi
}

# Generate debug report
generate_report() {
    local report_file="$PROJECT_ROOT/tmp/localstack/debug-report-$(date +%Y%m%d-%H%M%S).txt"
    
    log_info "Generating debug report: $report_file"
    
    mkdir -p "$(dirname "$report_file")"
    
    {
        echo "=== LocalStack Debug Report ==="
        echo "Generated: $(date)"
        echo "Project: Healthcare RCM Platform"
        echo ""
        
        echo "=== Environment ==="
        echo "NODE_ENV: ${NODE_ENV:-not set}"
        echo "CDK_DEFAULT_ACCOUNT: ${CDK_DEFAULT_ACCOUNT:-not set}"
        echo "AWS_DEFAULT_REGION: ${AWS_DEFAULT_REGION:-not set}"
        echo ""
        
        echo "=== LocalStack Health ==="
        curl -s http://localhost:4566/_localstack/health 2>/dev/null | jq '.' || echo "Health check failed"
        echo ""
        
        echo "=== Docker Container Status ==="
        docker ps --filter "name=localstack" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo ""
        
        echo "=== CloudFormation Stacks ==="
        aws --endpoint-url=http://localhost:4566 cloudformation list-stacks --query 'StackSummaries[?StackStatus!=`DELETE_COMPLETE`]' --output table 2>/dev/null || echo "CloudFormation not available"
        echo ""
        
        echo "=== Recent Docker Logs ==="
        docker logs --tail=50 localstack-foresight-rcm 2>/dev/null || echo "Container logs not available"
        
    } > "$report_file"
    
    log_success "Debug report saved to: $report_file"
}

# Interactive debugging menu
interactive_debug() {
    while true; do
        echo ""
        echo -e "${GREEN}=== LocalStack Debug Menu ===${NC}"
        echo "1. Check health"
        echo "2. List all resources"
        echo "3. Monitor logs"
        echo "4. Debug S3 service"
        echo "5. Debug Lambda service"
        echo "6. Debug Config service"
        echo "7. Debug Security Hub service"
        echo "8. Test connectivity"
        echo "9. Generate debug report"
        echo "0. Exit"
        echo ""
        
        read -p "Select option: " choice
        
        case $choice in
            1) check_health ;;
            2) list_resources ;;
            3) monitor_logs ;;
            4) debug_service "s3" ;;
            5) debug_service "lambda" ;;
            6) debug_service "config" ;;
            7) debug_service "securityhub" ;;
            8) test_connectivity ;;
            9) generate_report ;;
            0) break ;;
            *) log_error "Invalid option" ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Main function
main() {
    # Set AWS credentials for LocalStack
    export AWS_ACCESS_KEY_ID=test
    export AWS_SECRET_ACCESS_KEY=test
    export AWS_DEFAULT_REGION=us-east-1
    
    case "${1:-menu}" in
        "health")
            check_health
            ;;
        "resources")
            list_resources
            ;;
        "logs")
            monitor_logs
            ;;
        "debug")
            debug_service "${2:-s3}"
            ;;
        "connectivity")
            test_connectivity
            ;;
        "report")
            generate_report
            ;;
        "menu")
            interactive_debug
            ;;
        *)
            echo "Usage: $0 {health|resources|logs|debug <service>|connectivity|report|menu}"
            echo ""
            echo "Commands:"
            echo "  health       - Check LocalStack health"
            echo "  resources    - List all deployed resources"
            echo "  logs         - Monitor LocalStack logs"
            echo "  debug <svc>  - Debug specific service (s3|lambda|config|securityhub)"
            echo "  connectivity - Test service connectivity"
            echo "  report       - Generate debug report"
            echo "  menu         - Interactive debug menu (default)"
            exit 1
            ;;
    esac
}

main "$@"