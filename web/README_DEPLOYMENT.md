# Quantum Chess Battleground - Deployment Guide

## 🚀 Vercel Deployment

This guide provides instructions for deploying the Quantum Chess Battleground to Vercel.

### Prerequisites

1. **Vercel Account**: Create a free account at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally with `npm install -g vercel`
3. **Environment Variables**: Prepare the required values listed below

### Environment Variables Required

Set these in your Vercel project dashboard (Settings → Environment Variables):

#### Core Configuration
```bash
# App URLs (update with your production domain)
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_WS_URL=wss://your-domain.vercel.app

# Feature Flags
ENABLE_3D_BOARD=true
ENABLE_TOURNAMENT_MODE=true
ENABLE_DEBUG_MODE=false

# Rate Limiting
RATE_LIMIT_API_CALLS=100
RATE_LIMIT_WINDOW_MS=60000
```

#### Vercel KV (Redis) - Auto-configured
These are automatically set when you create a Vercel KV store:
- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

#### Optional: AI Model APIs
Add these if you want to enable AI model functionality:
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_AI_API_KEY`

### Deployment Steps

#### 1. Initial Setup
```bash
# Login to Vercel
vercel login

# Link project (in project root)
vercel link

# Create Vercel KV store
vercel env pull  # This will guide you through KV setup
```

#### 2. Deploy to Production
```bash
# Deploy to production
vercel --prod

# Or deploy to preview
vercel
```

#### 3. Automatic Deployments
Vercel automatically deploys:
- **Production**: When you push to `main` branch
- **Preview**: When you create pull requests

### Post-Deployment Checklist

- [ ] Verify app loads at production URL
- [ ] Test Redis connection (create a game)
- [ ] Check API endpoints respond correctly
- [ ] Verify environment variables are loading
- [ ] Test basic game functionality
- [ ] Check CORS headers for API access

### Monitoring & Logs

1. **Function Logs**: `vercel logs`
2. **Build Logs**: `vercel inspect [deployment-url]`
3. **Dashboard**: View analytics at [vercel.com/dashboard](https://vercel.com/dashboard)

### Troubleshooting

#### Build Failures
```bash
# Check build output
vercel logs --output=build

# Test build locally
npm run build
```

#### Runtime Errors
```bash
# View function logs
vercel logs --output=lambda

# Check specific function
vercel logs app/api/game/create/route.ts
```

#### Environment Variable Issues
```bash
# Pull latest env vars
vercel env pull

# List all env vars
vercel env ls
```

### Performance Optimization

The app is configured with:
- **Edge Runtime** for SSE endpoints (game streaming)
- **Function Duration Limits**: 
  - Stream endpoint: 300s
  - Model moves: 30s
  - Tournament start: 60s
- **Caching**: In-memory LRU cache for game states
- **CORS Headers**: Configured for API access

### Database Management

#### Vercel KV (Redis)
- **TTL**: Games expire after 24 hours
- **Cleanup**: Automatic cleanup of expired games
- **Cache**: In-memory cache reduces Redis calls

#### Commands
```bash
# View KV stats
vercel env pull
# Check KV_REST_API_URL and use Redis CLI or REST API

# Clear all data (be careful!)
# Use Vercel dashboard → Storage → KV → Flush All
```

### Security Notes

- Never commit `.env.local` files
- Use Vercel's environment variable UI for sensitive data
- Enable rate limiting in production
- Monitor for unusual API usage
- Keep dependencies updated

### Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Deploy**: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)
- **Issues**: Report at project's GitHub repository

---

Last Updated: 2025-08-07