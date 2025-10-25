# Tests

This directory contains integration and unit tests for the application.

## Structure

- `integration/` - Integration tests that test multiple components working together
- `unit/` - Unit tests for individual components (to be added)

## Integration Tests

### Browserbase Testing

Test the Browserbase integration locally before deploying:

```bash
# Install tsx if not already installed
npm install -g tsx

# Set environment variables (optional for remote testing)
export BROWSERBASE_API_KEY="your_api_key"
export BROWSERBASE_PROJECT_ID="your_project_id"

# Run the test
tsx tests/integration/browserbase.test.ts
```

The test includes:
- **Local Mode**: Tests Stagehand in LOCAL mode (uses local browser)
- **Remote Mode**: Tests Stagehand with actual Browserbase (requires credentials)  
- **Workflow Test**: Tests the full prior auth workflow integration

### What gets tested:

1. **Local Browser Automation**: 
   - Initializes Stagehand in LOCAL mode
   - Tests basic navigation and actions
   - Runs with visible browser for debugging

2. **Remote Browserbase**:
   - Tests connection to Browserbase service
   - Validates API credentials
   - Tests extraction capabilities

3. **Prior Auth Workflow**:
   - Tests the full StagehandAutomation service
   - Validates integration with PortalSessionManager
   - Tests error handling and fallbacks

### Prerequisites

- Node.js with TypeScript support (tsx)
- Chrome/Chromium browser (for LOCAL mode)
- Browserbase account and credentials (for remote testing)
- Database connection (for workflow testing)

### Environment Variables

Add to your `.env.local`:

```env
# Browserbase Configuration (optional - only needed for remote testing)
BROWSERBASE_API_KEY=your_browserbase_api_key
BROWSERBASE_PROJECT_ID=your_browserbase_project_id

# Test Portal Credentials (optional - for CoverMyMeds login testing)
TEST_PORTAL_USERNAME=your_test_username@example.com
TEST_PORTAL_PASSWORD=your_test_password

# Database and other configs (needed for workflow testing)
NODE_ENV=development
```