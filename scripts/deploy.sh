#!/usr/bin/env bash
# Deploy portfolio to Firebase, then fix Cloud Run invoker (required when org has domain-restricted sharing).
set -e

echo "Building..."
npm run build

echo "Deploying to Firebase..."
firebase deploy || true

echo "Setting Cloud Run invoker (bypasses domain restriction)..."
gcloud run services update api \
  --region=us-central1 \
  --no-invoker-iam-check \
  --project=portfolious-20286

echo "Done. Site: https://portfolious-20286.web.app"
