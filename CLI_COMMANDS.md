# CLI Commands for Kubernetes Deployment

## Governance Sync Job Commands

### Individual Sync Jobs

```bash
# Governance sync (DReps and delegators)
npm run job:trigger:governance

# Governance sync with force refresh
npm run job:trigger:governance-force

# Proposals sync
npm run job:trigger:proposals

# Proposals sync with force refresh  
npm run job:trigger:proposals-force

# DRep votes sync
npm run job:trigger:drep-votes

# DRep votes sync with force refresh
npm run job:trigger:drep-votes-force

# Stake sync
npm run job:trigger:stake
```

### Combined Operations

```bash
# Run all sync jobs in sequence
npm run job:trigger:all

# Run all sync jobs with force refresh
npm run job:trigger:all-force
```


## Database Operations

```bash
npm run migrate:up
npm run migrate:down
npm run migration:show
```

## Kubernetes Usage Examples

```bash
kubectl exec -it <backend-pod-name> -- npm run job:trigger:governance
kubectl exec -it <backend-pod-name> -- npm run job:trigger:all-force
kubectl exec -it <backend-pod-name> -- npm run migrate:up
```

```bash
kubectl exec -it $(kubectl get pods -l app=backend -o jsonpath='{.items[0].metadata.name}') -- npm run job:trigger:governance
kubectl exec -it $(kubectl get pods -l app=backend -o jsonpath='{.items[0].metadata.name}') -- npm run job:trigger:all-force
```

## Job Sequence

```bash
npm run job:trigger:proposals
npm run job:trigger:governance  
npm run job:trigger:drep-votes
```

Or combined:
```bash
npm run job:trigger:all
```

## Notes

- Jobs are queued using BullMQ and processed asynchronously
- The `--force` flag performs a full refresh
- Use force refresh sparingly to avoid API rate limits
