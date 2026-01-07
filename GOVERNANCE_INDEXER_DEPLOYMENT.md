# Governance Indexer Deployment Setup

## Overview
The governance indexer is now configured for Kubernetes deployment using Helm charts.

## CI/CD Variables Required

Add this environment variable to your GitLab CI/CD variables:

```bash
GOVERNANCE_INDEXER_DATABASE_URL="postgres://username:password@hostname:port/database"
```

### Examples:

**Preview Environment:**
```bash
GOVERNANCE_INDEXER_DATABASE_URL="postgres://voltaire:preview_password@www-1694-preview-web-db-postgresql:5432/1694"
```

**Production Environment:**
```bash
GOVERNANCE_INDEXER_DATABASE_URL="postgres://voltaire:production_password@www-1694-production-web-db-postgresql:5432/1694"
```

## Deployment Configuration

### Values.yaml Configuration
The indexer is configured with these default values:
- **Replica Count**: 1 (single instance)
- **CPU Request**: 100m
- **Memory Request**: 256Mi
- **CPU Limit**: 500m  
- **Memory Limit**: 1024Mi
- **Relay Address**: backbone.mainnet.emurgornd.com:3001
- **Network Magic**: 764824073 (Mainnet)
- **Max Workers**: 8
- **Batch Size**: 100
- **Log Level**: info

### Helm Deployment
The indexer will be deployed automatically with your existing CI/CD pipeline:

**Preview**: 1 replica
**Production**: 1 replica

## Files Modified
- `chart/templates/deployment.governance-indexer.yaml` - Kubernetes deployment
- `chart/values.yaml` - Configuration values
- `.gitlab-ci.yml` - Added indexer to preview and production deployments
- `frontend/next.config.js` - Fixed ESLint build issues

## Monitoring
The indexer will log to stdout/stderr with RUST_LOG=info level. View logs with:

```bash
kubectl logs -f deployment/www-1694-governance-indexer -n your-namespace
```

## What's Deployed
✅ **Governance Indexer Kubernetes Deployment**
✅ **CI/CD Pipeline Integration** 
✅ **Database URL Configuration**
✅ **Resource Limits and Requests**
✅ **Fixed CI/CD Build Issues**
✅ **Fixed Frontend ESLint Build Issues**