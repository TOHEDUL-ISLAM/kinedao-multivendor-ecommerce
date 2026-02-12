#!/bin/bash

echo "🛑 Stopping dev servers..."
pkill -9 -f "bun.*dev" 2>/dev/null

echo "📦 Resetting Supabase with new bucket configuration..."
cd packages/db
bunx supabase db reset --local

echo "✅ Supabase reset complete! The bucket is now public."
echo ""
echo "🚀 Restart your dev servers with: bun run dev"
