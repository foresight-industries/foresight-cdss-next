#!/bin/bash

# SBOM Generation Script for Healthcare RCM Platform
# Generates Software Bill of Materials for compliance and security

set -e

PROJECT_NAME="foresight-cdss-next"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
SBOM_DIR="./security/sboms"
VERSION=$(git describe --tags --always --dirty 2>/dev/null || echo "dev-${TIMESTAMP}")

echo "🔍 Generating SBOM for ${PROJECT_NAME} version ${VERSION}"

# Create SBOM directory
mkdir -p "${SBOM_DIR}"

# Check if syft is installed
if ! command -v syft &> /dev/null; then
    echo "📦 Installing Syft for SBOM generation..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install syft
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin
    else
        echo "❌ Unsupported OS. Please install syft manually: https://github.com/anchore/syft"
        exit 1
    fi
fi

# Generate SBOM for main project
echo "📋 Generating main project SBOM..."
syft . -o spdx-json > "${SBOM_DIR}/main-${VERSION}.spdx.json"
syft . -o cyclonedx-json > "${SBOM_DIR}/main-${VERSION}.cyclonedx.json"
syft . -o table > "${SBOM_DIR}/main-${VERSION}.txt"

# Generate SBOM for infrastructure
if [ -d "./infra" ]; then
    echo "🏗️ Generating infrastructure SBOM..."
    syft ./infra -o spdx-json > "${SBOM_DIR}/infra-${VERSION}.spdx.json"
fi

# Generate SBOM for packages
if [ -d "./packages" ]; then
    echo "📦 Generating packages SBOM..."
    syft ./packages -o spdx-json > "${SBOM_DIR}/packages-${VERSION}.spdx.json"
fi

# Generate SBOM for apps
if [ -d "./apps" ]; then
    echo "🌐 Generating apps SBOM..."
    syft ./apps -o spdx-json > "${SBOM_DIR}/apps-${VERSION}.spdx.json"
fi

# Create combined manifest
echo "📝 Creating deployment manifest..."
cat > "${SBOM_DIR}/deployment-manifest-${VERSION}.json" << EOF
{
  "projectName": "${PROJECT_NAME}",
  "version": "${VERSION}",
  "timestamp": "${TIMESTAMP}",
  "gitCommit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "gitBranch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
  "environment": "${NODE_ENV:-development}",
  "sbomFiles": [
    "main-${VERSION}.spdx.json",
    "infra-${VERSION}.spdx.json",
    "packages-${VERSION}.spdx.json",
    "apps-${VERSION}.spdx.json"
  ],
  "generatedBy": "$(whoami)@$(hostname)",
  "compliance": {
    "hipaa": true,
    "healthcare": true,
    "sbom_standard": "SPDX-2.3"
  }
}
EOF

echo "✅ SBOM generation complete!"
echo "📁 Files generated in: ${SBOM_DIR}/"
ls -la "${SBOM_DIR}/"

# Display summary
echo ""
echo "📊 SBOM Summary:"
echo "├── Main project: $(jq -r '.packages | length' "${SBOM_DIR}/main-${VERSION}.spdx.json" 2>/dev/null || echo 'N/A') packages"
if [ -f "${SBOM_DIR}/infra-${VERSION}.spdx.json" ]; then
    echo "├── Infrastructure: $(jq -r '.packages | length' "${SBOM_DIR}/infra-${VERSION}.spdx.json" 2>/dev/null || echo 'N/A') packages"
fi
echo "├── Version: ${VERSION}"
echo "└── Generated: ${TIMESTAMP}"