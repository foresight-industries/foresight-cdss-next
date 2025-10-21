# Local Development Setup for Subdomain Routing

## Method 1: Using .local domains (Recommended)

### Step 1: Update your /etc/hosts file
Add these entries to `/etc/hosts`:

```bash
# Foresight local development
127.0.0.1 foresight.local
127.0.0.1 www.foresight.local
127.0.0.1 api.foresight.local
127.0.0.1 staging.foresight.local

# Test team subdomains
127.0.0.1 testteam.foresight.local
127.0.0.1 demo.foresight.local
127.0.0.1 acmecorp.foresight.local
```

### Step 2: Update your middleware for local development
The middleware already handles this with:
```typescript
if (hostname.includes('localhost') || hostname.includes('127.0.0.1') || hostname.includes('.local')) {
  return NextResponse.next();
}
```

### Step 3: Run your dev server
```bash
npm run dev -- --hostname foresight.local --port 3000
```

### Step 4: Test your subdomains
- Main site: http://foresight.local:3000
- Test team: http://testteam.foresight.local:3000
- Demo team: http://demo.foresight.local:3000

## Method 2: Using dnsmasq (Alternative)

### Install dnsmasq (macOS with Homebrew)
```bash
brew install dnsmasq

# Configure dnsmasq to resolve *.local to localhost
echo 'address=/.local/127.0.0.1' >> $(brew --prefix)/etc/dnsmasq.conf

# Start dnsmasq
sudo brew services start dnsmasq

# Configure macOS to use dnsmasq for .local domains
sudo mkdir -p /etc/resolver
echo "nameserver 127.0.0.1" | sudo tee /etc/resolver/local
```

## Testing Your Setup

### 1. Create test teams in your database
```sql
INSERT INTO team (id, slug, name, is_active) VALUES 
  ('test-team-1', 'testteam', 'Test Team', true),
  ('demo-team-1', 'demo', 'Demo Team', true),
  ('acme-team-1', 'acmecorp', 'Acme Corporation', true);
```

### 2. Test the routing
```bash
# Test main site
curl -H "Host: foresight.local:3000" http://localhost:3000

# Test team subdomain
curl -H "Host: testteam.foresight.local:3000" http://localhost:3000

# Or just visit in browser:
# http://testteam.foresight.local:3000
```

### 3. Debug middleware
Add console.log to middleware.ts:
```typescript
console.log('Hostname:', hostname);
console.log('Subdomain:', subdomain);
console.log('Team found:', team);
```

## Production vs Development Differences

### Development (.local domains)
- Uses local hosts file or dnsmasq
- No SSL certificates needed
- Easy to add new test teams

### Production (have-foresight.app)
- Uses Cloudflare DNS
- Automatic SSL via Cloudflare
- Real domain validation

## Environment Variables

Add to your `.env.local`:
```bash
# Local development domain
NEXT_PUBLIC_DOMAIN=foresight.local:3000
NEXT_PUBLIC_PROTOCOL=http

# Production would be:
# NEXT_PUBLIC_DOMAIN=have-foresight.app  
# NEXT_PUBLIC_PROTOCOL=https
```

## Troubleshooting

### Common Issues:

1. **"This site can't be reached"**
   - Check /etc/hosts entries
   - Verify dev server is running on correct port
   - Try clearing browser DNS cache

2. **Middleware not working**
   - Check console logs in terminal
   - Verify team exists in database
   - Test with curl to isolate browser issues

3. **Database connection issues**
   - Ensure Supabase environment variables are set
   - Check if local Supabase is running (if using local instance)

### Useful Commands:

```bash
# Clear DNS cache (macOS)
sudo dscacheutil -flushcache

# Test DNS resolution
nslookup testteam.foresight.local

# Check if port is in use
lsof -i :3000
```