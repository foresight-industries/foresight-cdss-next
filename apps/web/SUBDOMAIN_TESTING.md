# Subdomain Setup Testing Guide

## Quick Testing Steps

### 1. **Set up local hosts file**
Add to `/etc/hosts`:
```bash
127.0.0.1 foresight.local
127.0.0.1 testteam.foresight.local
127.0.0.1 demo.foresight.local
```

### 2. **Create test teams in your database**
```sql
INSERT INTO team (id, slug, name, is_active, created_at) VALUES 
  (gen_random_uuid(), 'testteam', 'Test Team', true, NOW()),
  (gen_random_uuid(), 'demo', 'Demo Team', true, NOW()),
  (gen_random_uuid(), 'acme', 'Acme Corp', true, NOW());
```

### 3. **Run dev server**
```bash
npm run dev -- --hostname foresight.local --port 3000
```

### 4. **Test URLs**
- Main site: http://foresight.local:3000
- Test team: http://testteam.foresight.local:3000  
- Demo team: http://demo.foresight.local:3000
- Non-existent team: http://badteam.foresight.local:3000 (should redirect to team-not-found)

## Production Deployment Steps

### 1. **Deploy to Vercel**
Make sure your middleware.ts is included in the deployment.

### 2. **Configure Cloudflare DNS**
In Cloudflare dashboard:
- Type: CNAME
- Name: `*` 
- Target: `have-foresight.app`
- Proxy: Enabled (orange cloud)

### 3. **Test production**
- https://have-foresight.app (main site)
- https://testteam.have-foresight.app (team subdomain)

## Debugging Tips

### Check middleware logs
Add to middleware.ts for debugging:
```typescript
console.log('🔍 Middleware Debug:', {
  hostname,
  subdomain,
  parts,
  teamSlug,
  isReserved: RESERVED_SUBDOMAINS.includes(subdomain)
});
```

### Test with curl
```bash
# Test team subdomain
curl -H "Host: testteam.foresight.local:3000" http://localhost:3000

# Check headers
curl -I -H "Host: testteam.foresight.local:3000" http://localhost:3000
```

### Browser DevTools
1. Open Network tab
2. Look for middleware redirects/rewrites
3. Check if team headers are set

## Common Issues & Solutions

### "This site can't be reached"
**Problem**: Local domain not resolving
**Solution**: 
- Check /etc/hosts entries
- Clear DNS cache: `sudo dscacheutil -flushcache`
- Try different browser

### Middleware not triggering
**Problem**: Middleware config issue
**Solution**:
- Check middleware.ts config.matcher
- Verify file is in root of app directory
- Check console for errors

### Team not found errors
**Problem**: Database query failing
**Solution**:
- Verify team exists in database
- Check Supabase connection
- Verify team slug matches exactly

### SSL issues in production
**Problem**: Certificate not covering subdomains
**Solution**:
- Ensure Cloudflare proxy is enabled
- Check DNS configuration
- Wait for DNS propagation (up to 24 hours)

## Environment Variables

### Development (.env.local)
```bash
NEXT_PUBLIC_DOMAIN=foresight.local:3000
NEXT_PUBLIC_PROTOCOL=http
```

### Production (.env.production)
```bash
NEXT_PUBLIC_DOMAIN=have-foresight.app
NEXT_PUBLIC_PROTOCOL=https
```

## Migration Strategy

### Phase 1: Both URLs work
- Keep existing /team/[slug] routes
- Add subdomain routing
- Users can access either way

### Phase 2: Gradual migration  
- Redirect old URLs to subdomains
- Update all internal links
- Communicate change to users

### Phase 3: Full migration
- Remove old routes
- All traffic uses subdomains

## Performance Considerations

### Middleware overhead
- Middleware runs on every request
- Database lookup for team validation
- Consider caching team validation

### Caching strategy
```typescript
// Add to middleware for caching
const cache = new Map();
const cacheKey = `team:${teamSlug}`;

if (cache.has(cacheKey)) {
  // Use cached result
} else {
  // Fetch and cache
}
```

### Edge deployment
- Middleware runs at edge
- Consider edge database for team lookups
- Monitor performance metrics