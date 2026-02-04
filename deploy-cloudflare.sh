#!/bin/bash

# Deploy to Cloudflare Pages with custom domains
echo "🚀 Deploying to Cloudflare Pages..."

# Build the project
echo "📦 Building Next.js project..."
npm run build

# Deploy to Cloudflare Pages
echo "☁️ Deploying to Cloudflare..."
npx wrangler pages deploy .vercel/output/static \
  --project-name=yield-delta-frontend \
  --branch=main \
  --commit-dirty=true

echo "✅ Deployment complete!"
echo ""
echo "🌐 Your app is available at:"
echo "   - https://app.yielddelta.xyz"
echo "   - https://docs.yielddelta.xyz"
echo ""
echo "⚠️ Make sure DNS records are configured:"
echo "   app.yielddelta.xyz  → CNAME → yield-delta-frontend.pages.dev"
echo "   docs.yielddelta.xyz → CNAME → yield-delta-frontend.pages.dev"