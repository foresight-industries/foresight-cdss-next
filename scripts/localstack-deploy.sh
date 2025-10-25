#!/bin/bash

# LocalStack Deployment Script for Healthcare RCM Platform
# This script deploys the entire infrastructure to LocalStack for local development

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env.localstack.local"
INFRA_DIR="$PROJECT_ROOT/infra"

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

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Docker is running
    if ! docker ps &>/dev/null; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    
    # Check if environment file exists
    if [[ ! -f "$ENV_FILE" ]]; then
        log_error "Environment file not found: $ENV_FILE"
        log_info "Please copy .env.localstack to .env.localstack.local and configure your LocalStack Pro token"
        exit 1
    fi
    
    # Check if LocalStack Pro token is set
    if ! grep -q "LOCALSTACK_AUTH_TOKEN=.*[^_].*" "$ENV_FILE"; then
        log_error "LocalStack Pro token not configured in $ENV_FILE"
        log_info "Please set LOCALSTACK_AUTH_TOKEN in .env.localstack.local"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

start_localstack() {
    log_info "Starting LocalStack..."
    
    cd "$PROJECT_ROOT"
    
    # Start LocalStack with Docker Compose
    if docker-compose -f docker-compose.localstack.yml --env-file "$ENV_FILE" ps | grep -q "localstack.*Up"; then
        log_warning "LocalStack is already running"
    else
        docker-compose -f docker-compose.localstack.yml --env-file "$ENV_FILE" up -d
        
        # Wait for LocalStack to be ready
        log_info "Waiting for LocalStack to be ready..."
        timeout=60
        while ! curl -s http://localhost:4566/_localstack/health | grep -q '"s3": "available"'; do
            if [[ $timeout -le 0 ]]; then
                log_error "LocalStack failed to start within 60 seconds"
                exit 1
            fi
            sleep 2
            ((timeout-=2))
        done
    fi
    
    log_success "LocalStack is running"
}

bootstrap_cdk() {
    log_info "Bootstrapping CDK for LocalStack..."
    
    cd "$INFRA_DIR"
    
    # Set LocalStack environment
    export AWS_ENDPOINT_URL=http://localhost:4566
    export AWS_DEFAULT_REGION=us-east-1
    export AWS_ACCESS_KEY_ID=test
    export AWS_SECRET_ACCESS_KEY=test
    export CDK_DEFAULT_ACCOUNT=000000000000
    
    # Bootstrap CDK
    if ! yarn local:bootstrap; then
        log_error "CDK bootstrap failed"
        exit 1
    fi
    
    log_success "CDK bootstrapped successfully"
}

deploy_stacks() {
    log_info "Deploying healthcare RCM infrastructure stacks..."
    
    cd "$INFRA_DIR"
    
    # Deploy in order of dependencies
    local stacks=(
        "RCM-CodeSigning-local"
        "RCM-Database-local"
        "RCM-Storage-local"
        "RCM-Medical-local"
        "RCM-Alerting-local"
        "RCM-ElastiCache-local"
        "RCM-Queues-local"
        "RCM-API-local"
        "RCM-Config-local"
        "RCM-SecurityHub-local"
    )
    
    for stack in "${stacks[@]}"; do
        log_info "Deploying $stack..."
        if yarn local:deploy "$stack" --require-approval never; then
            log_success "$stack deployed successfully"
        else
            log_error "Failed to deploy $stack"
            exit 1
        fi
    done
    
    log_success "All stacks deployed successfully"
}

verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check if key services are available
    local services=("s3" "lambda" "rds" "sns" "sqs" "config" "securityhub")
    
    for service in "${services[@]}"; do
        if curl -s "http://localhost:4566/_localstack/health" | grep -q "\"$service\": \"available\""; then
            log_success "$service is available"
        else
            log_warning "$service is not available"
        fi
    done
    
    # List deployed stacks
    log_info "Deployed stacks:"
    cd "$INFRA_DIR"
    yarn local:list
}

show_endpoints() {
    log_info "LocalStack service endpoints:"
    echo -e "${GREEN}Main endpoint:${NC} http://localhost:4566"
    echo -e "${GREEN}Health endpoint:${NC} http://localhost:4566/_localstack/health"
    echo -e "${GREEN}LocalStack dashboard:${NC} https://app.localstack.cloud"
    echo -e "${GREEN}S3 console:${NC} http://localhost:4566/_localstack/cockpit/s3"
    
    log_info "To interact with services:"
    echo "  aws --endpoint-url=http://localhost:4566 s3 ls"
    echo "  aws --endpoint-url=http://localhost:4566 lambda list-functions"
    echo "  aws --endpoint-url=http://localhost:4566 config describe-configuration-recorders"
}

cleanup() {
    log_info "Cleaning up on exit..."
    if [[ "${1:-}" == "force" ]]; then
        cd "$PROJECT_ROOT"
        docker-compose -f docker-compose.localstack.yml --env-file "$ENV_FILE" down
    fi
}

main() {
    log_info "Starting LocalStack deployment for Healthcare RCM Platform"
    
    # Set up cleanup on exit
    trap cleanup EXIT
    
    check_prerequisites
    start_localstack
    bootstrap_cdk
    deploy_stacks
    verify_deployment
    show_endpoints
    
    log_success "LocalStack deployment completed successfully!"
    log_info "Use 'yarn local:logs' in the infra directory to view LocalStack logs"
    log_info "Use 'yarn local:stop' in the infra directory to stop LocalStack"
}

# Handle command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "stop")
        cd "$PROJECT_ROOT"
        docker-compose -f docker-compose.localstack.yml --env-file "$ENV_FILE" down
        log_success "LocalStack stopped"
        ;;
    "restart")
        cd "$PROJECT_ROOT"
        docker-compose -f docker-compose.localstack.yml --env-file "$ENV_FILE" down
        main
        ;;
    "logs")
        cd "$PROJECT_ROOT"
        docker-compose -f docker-compose.localstack.yml --env-file "$ENV_FILE" logs -f
        ;;
    "health")
        curl -s http://localhost:4566/_localstack/health | jq .
        ;;
    *)
        echo "Usage: $0 {deploy|stop|restart|logs|health}"
        echo "  deploy  - Start LocalStack and deploy all stacks (default)"
        echo "  stop    - Stop LocalStack"
        echo "  restart - Stop and restart LocalStack with fresh deployment"
        echo "  logs    - Show LocalStack logs"
        echo "  health  - Check LocalStack health status"
        exit 1
        ;;
esac