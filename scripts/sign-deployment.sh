#!/bin/bash

# Code Signing Script for Healthcare RCM Platform
# Signs deployment artifacts for integrity and non-repudiation

set -e

PROJECT_NAME="foresight-cdss-next"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
SECURITY_DIR="./security"
SIGNATURES_DIR="${SECURITY_DIR}/signatures"
VERSION=$(git describe --tags --always --dirty 2>/dev/null || echo "dev-${TIMESTAMP}")

echo "🔐 Signing deployment artifacts for ${PROJECT_NAME} version ${VERSION}"

# Create security directories
mkdir -p "${SIGNATURES_DIR}"
mkdir -p "${SECURITY_DIR}/attestations"

# Check if cosign is installed
if ! command -v cosign &> /dev/null; then
    echo "📦 Installing Cosign for code signing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install cosign
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        LATEST_VERSION=$(curl -s https://api.github.com/repos/sigstore/cosign/releases/latest | grep tag_name | cut -d '"' -f 4)
        curl -O -L "https://github.com/sigstore/cosign/releases/latest/download/cosign-linux-amd64"
        sudo mv cosign-linux-amd64 /usr/local/bin/cosign
        sudo chmod +x /usr/local/bin/cosign
    else
        echo "❌ Unsupported OS. Please install cosign manually: https://docs.sigstore.dev/cosign/installation/"
        exit 1
    fi
fi

# Initialize cosign if needed (keyless signing)
export COSIGN_EXPERIMENTAL=1

echo "🔍 Finding artifacts to sign..."

# Sign CDK templates if they exist
if [ -d "./infra/cdk.out" ]; then
    echo "🏗️ Signing CDK templates..."
    for template in ./infra/cdk.out/*.template.json; do
        if [ -f "$template" ]; then
            filename=$(basename "$template")
            echo "  Signing: $filename"
            cosign sign-blob --bundle "${SIGNATURES_DIR}/${filename}.cosign.bundle" "$template"
        fi
    done
fi

# Sign SBOM files
if [ -d "./security/sboms" ]; then
    echo "📋 Signing SBOM files..."
    for sbom in ./security/sboms/*.json; do
        if [ -f "$sbom" ]; then
            filename=$(basename "$sbom")
            echo "  Signing: $filename"
            cosign sign-blob --bundle "${SIGNATURES_DIR}/${filename}.cosign.bundle" "$sbom"
        fi
    done
fi

# Sign package.json files for integrity
echo "📦 Signing package manifests..."
find . -name "package.json" -not -path "./node_modules/*" | while read package_file; do
    relative_path=$(echo "$package_file" | sed 's|^\./||')
    safe_name=$(echo "$relative_path" | tr '/' '_')
    echo "  Signing: $relative_path"
    cosign sign-blob --bundle "${SIGNATURES_DIR}/package_${safe_name}.cosign.bundle" "$package_file"
done

# Create deployment attestation
echo "📝 Creating deployment attestation..."
cat > "${SECURITY_DIR}/attestations/deployment-${VERSION}.json" << EOF
{
  "version": "1.0",
  "timestamp": "${TIMESTAMP}",
  "project": "${PROJECT_NAME}",
  "version": "${VERSION}",
  "gitCommit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "gitBranch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
  "signer": "$(whoami)@$(hostname)",
  "environment": "${NODE_ENV:-development}",
  "signedArtifacts": [
$(find "${SIGNATURES_DIR}" -name "*.cosign.bundle" -exec basename {} \; | sed 's/^/    "/' | sed 's/$/"/' | paste -sd ',' -)
  ],
  "compliance": {
    "standard": "SLSA",
    "level": "1",
    "attestationType": "deployment",
    "healthcare": true,
    "hipaa": true
  },
  "metadata": {
    "tooling": {
      "cosign": "$(cosign version 2>/dev/null | head -1 || echo 'unknown')",
      "sigstore": "keyless"
    },
    "verification": {
      "instructions": "Use 'cosign verify-blob --bundle <bundle-file> <artifact>' to verify signatures",
      "publicKey": "Keyless signing - verification uses Fulcio root certificate"
    }
  }
}
EOF

# Sign the attestation itself
echo "🔐 Signing deployment attestation..."
cosign sign-blob --bundle "${SIGNATURES_DIR}/deployment-attestation-${VERSION}.cosign.bundle" "${SECURITY_DIR}/attestations/deployment-${VERSION}.json"

echo "✅ Code signing complete!"
echo "📁 Signatures stored in: ${SIGNATURES_DIR}/"
echo "📁 Attestations stored in: ${SECURITY_DIR}/attestations/"

# Display summary
echo ""
echo "🔐 Signing Summary:"
echo "├── Signed artifacts: $(find "${SIGNATURES_DIR}" -name "*.cosign.bundle" | wc -l | tr -d ' ')"
echo "├── Version: ${VERSION}"
echo "├── Signer: $(whoami)@$(hostname)"
echo "└── Timestamp: ${TIMESTAMP}"

echo ""
echo "🔍 Verification Instructions:"
echo "To verify a signed artifact:"
echo "  cosign verify-blob --bundle <bundle-file> <original-artifact>"
echo ""
echo "Example:"
echo "  cosign verify-blob --bundle ${SIGNATURES_DIR}/main-${VERSION}.spdx.json.cosign.bundle ./security/sboms/main-${VERSION}.spdx.json"