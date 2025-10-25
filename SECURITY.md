# Security Policy & Attestation

## 🔐 Code Signing & Software Bill of Materials (SBOM)

This healthcare RCM platform implements comprehensive security attestation including code signing and SBOM generation for compliance with healthcare regulations and supply chain security best practices.

## 🏥 Healthcare Compliance

### HIPAA Compliance
- ✅ **Audit Trail**: All deployments are signed and logged
- ✅ **Integrity**: Code signing ensures artifact integrity
- ✅ **Non-repudiation**: Keyless signing with Sigstore provides attribution
- ✅ **Supply Chain**: SBOM tracks all dependencies for security analysis

### Supported Standards
- **SLSA Level 1**: Build integrity and provenance
- **SPDX 2.3**: Software Package Data Exchange format
- **CycloneDX**: Industry standard SBOM format
- **Sigstore**: Keyless code signing with transparency logs

## 🛠️ Usage

### Local Development

#### Generate SBOM
```bash
# Generate comprehensive SBOM
npm run security:sbom

# Manual generation
./scripts/generate-sbom.sh
```

#### Sign Deployment Artifacts
```bash
# Sign all deployment artifacts
npm run security:sign

# Manual signing
./scripts/sign-deployment.sh
```

#### Full Security Workflow
```bash
# Generate SBOM and sign artifacts
npm run security:full
```

#### Verify Signatures
```bash
# Verify a specific artifact
cosign verify-blob --bundle ./security/signatures/main-{version}.spdx.json.cosign.bundle ./security/sboms/main-{version}.spdx.json

# Quick verification check
npm run security:verify
```

### CI/CD Pipeline

The GitHub Actions workflow automatically:

1. **Generates SBOM** for all dependencies
2. **Signs deployment artifacts** using keyless signing
3. **Creates attestations** for provenance tracking
4. **Validates healthcare compliance** requirements
5. **Stores artifacts** with appropriate retention policies

#### Triggered On:
- Push to `main`, `staging`, `production` branches
- Pull requests to `main`
- Release publications

## 📁 File Structure

```
security/
├── sboms/                          # Software Bill of Materials
│   ├── main-{version}.spdx.json    # Main project SBOM
│   ├── infra-{version}.spdx.json   # Infrastructure SBOM
│   ├── packages-{version}.spdx.json # Packages SBOM
│   └── apps-{version}.spdx.json    # Applications SBOM
├── signatures/                     # Code signatures
│   ├── *.cosign.bundle            # Cosign signature bundles
│   └── deployment-attestation-{version}.cosign.bundle
├── attestations/                   # Deployment attestations
│   └── deployment-{version}.json   # Deployment metadata
└── compliance-report-{sha}.json    # Compliance validation report
```

## 🔍 Verification Process

### For Healthcare Auditors

1. **Download artifacts** from GitHub releases or CI artifacts
2. **Verify signatures** using cosign:
   ```bash
   cosign verify-blob --bundle <bundle-file> <artifact>
   ```
3. **Review SBOM** for dependency analysis:
   ```bash
   jq '.packages[] | select(.name | contains("medical"))' sbom.json
   ```
4. **Check compliance report** for healthcare-specific validations

### For Security Teams

1. **Automated validation** runs on every deployment
2. **Supply chain analysis** via SBOM dependency tracking
3. **Signature verification** ensures artifact integrity
4. **Transparency logs** provide immutable audit trail

## 🚨 Security Incident Response

### If Signature Verification Fails:
1. **Stop deployment** immediately
2. **Investigate artifact tampering**
3. **Review git commit history**
4. **Re-generate and re-sign** from clean source

### If SBOM Shows Vulnerable Dependencies:
1. **Check vulnerability databases**
2. **Update dependencies** if patches available
3. **Document risk assessment** for healthcare context
4. **Re-generate SBOM** after updates

## 📋 Compliance Checklist

### For Healthcare Deployments:
- [ ] SBOM generated and stored
- [ ] All artifacts signed
- [ ] GitHub attestation created
- [ ] Compliance report generated
- [ ] Audit trail preserved
- [ ] Dependencies analyzed for healthcare context

### For Production Releases:
- [ ] Full security workflow completed
- [ ] Signatures verified
- [ ] SBOM analyzed for vulnerabilities
- [ ] Compliance report approved
- [ ] Deployment artifacts archived (365 days)

## 🔧 Tools & Dependencies

### Required Tools:
- **[Syft](https://github.com/anchore/syft)**: SBOM generation
- **[Cosign](https://github.com/sigstore/cosign)**: Code signing
- **[Sigstore](https://www.sigstore.dev/)**: Keyless signing infrastructure

### Installation:
```bash
# macOS
brew install syft cosign

# Linux
curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh
curl -O -L "https://github.com/sigstore/cosign/releases/latest/download/cosign-linux-amd64"
```

## 📞 Support

For security-related questions or issues:
- **Healthcare Compliance**: Review this document and compliance reports
- **Technical Issues**: Check GitHub Actions logs and artifact verification
- **Emergency**: Follow incident response procedures above

## 🔄 Updates

This security policy is versioned with the codebase and automatically updated through the CI/CD pipeline. Changes are tracked in git history with full provenance.