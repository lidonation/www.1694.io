.PHONY: backend-install
backend-install:
	docker-compose run --rm backend yarn install

.PHONY: queue-backend-install
queue-backend-install:
	docker-compose run --rm queue-backend yarn install

.PHONY: frontend-install
frontend-install:
	docker-compose run --rm frontend yarn install

.PHONY: restart
restart:
	make down
	make up

.PHONY: restart-new
restart-new:
	make down
	docker-compose up --build

.PHONY: up
up:
	docker-compose up -d

.PHONY: down
down:
	docker-compose down

.PHONY: status
status:
	docker-compose ps

.PHONY: migrate
migrate:
	docker-compose exec backend yarn run migrate:up

.PHONY: migrate-revert
migrate-revert:
	docker-compose exec backend yarn run migrate:down

.PHONY: watch
watch:
	docker-compose up -d && docker-compose exec frontend yarn run dev

.PHONY: build
build:
	docker-compose exec frontend yarn run build

.PHONY: sh-backend
sh-backend:
	docker-compose exec backend sh

.PHONY: sh-queue
sh-queue:
	docker-compose exec queue-backend sh

generate-migration:
	@if [ -z "$(MIGRATION_NAME)" ]; then \
		echo "Error: MIGRATION_NAME is required. Usage: make generate-migration MIGRATION_NAME=YourMigrationName"; \
		exit 1; \
	fi
	docker-compose exec backend npx ts-node ./node_modules/.bin/typeorm migration:generate -d ./src/typeorm.config.ts ./src/migrations/$(MIGRATION_NAME)

.PHONY: sh-cardano
sh-cardano:
	docker-compose exec cardano-node sh

.PHONY: sh-frontend
sh-frontend:
	docker-compose exec frontend sh

.PHONY: test-backend
test-backend:
	docker-compose exec backend yarn run test

.PHONY test-backend-e2e:
test-backend-e2e:
	docker-compose exec backend yarn run test:e2e

.PHONY: frontend-clean
frontend-clean:
	rm -rf frontend/node_modules 2>/dev/null || true
	docker-compose exec frontend yarn cache clean

.PHONY: rm
rm:
	docker-compose down -v

.PHONY: logs
logs:
	docker-compose logs -f

.PHONY: logs-frontend
logs-frontend:
	docker-compose logs -f frontend

.PHONY: logs-backend
logs-backend:
	docker-compose logs -f backend

.PHONY: logs-queue
logs-queue:
	docker-compose logs -f queue-backend

.PHONY: image-build-frontend
image-build-frontend:
	docker build \
	-f ./frontend/Dockerfile.dev \
	-t frontend \
	./frontend/.

.PHONY: image-build-backend
image-build-backend:
	docker build \
	-f ./backend/Dockerfile.dev \
	-t backend \
	./backend/.

.PHONY: governance-indexer-logs
governance-indexer-logs:
	docker-compose logs -f governance-indexer

.PHONY: governance-indexer-restart
governance-indexer-restart:
	docker-compose restart governance-indexer

.PHONY: governance-db-shell
governance-db-shell:
	docker-compose exec dbsync_db psql -U postgres -d cexplorer

.PHONY: build-governance-indexer
build-governance-indexer:
	docker-compose build governance-indexer

.PHONY: governance-indexer-status
governance-indexer-status:
	docker-compose ps governance-indexer dbsync_db

.PHONY: sync-governance
sync-governance:
	@echo "🔄 Triggering governance sync..."
	docker-compose exec queue-backend npm run job:trigger:governance

.PHONY: sync-governance-force
sync-governance-force:
	@echo "🔄 Triggering governance sync (force refresh)..."
	docker-compose exec queue-backend npm run job:trigger:governance-force

.PHONY: sync-proposals
sync-proposals:
	@echo "🔄 Triggering proposals sync..."
	docker-compose exec queue-backend npm run job:trigger:proposals

.PHONY: sync-proposals-force
sync-proposals-force:
	@echo "🔄 Triggering proposals sync (force refresh)..."
	docker-compose exec queue-backend npm run job:trigger:proposals-force

.PHONY: sync-drep-votes
sync-drep-votes:
	@echo "🔄 Triggering DRep votes sync..."
	docker-compose exec queue-backend npm run job:trigger:drep-votes

.PHONY: sync-drep-votes-force
sync-drep-votes-force:
	@echo "🔄 Triggering DRep votes sync (force refresh)..."
	docker-compose exec queue-backend npm run job:trigger:drep-votes-force

.PHONY: sync-stake
sync-stake:
	@echo "🔄 Triggering stake sync..."
	docker-compose exec queue-backend npm run job:trigger:stake

.PHONY: sync-all
sync-all:
	@echo "🚀 Running all sync jobs in sequence..."
	docker-compose exec queue-backend npm run job:trigger:all

.PHONY: sync-all-force
sync-all-force:
	@echo "🚀 Running all sync jobs in sequence (force refresh)..."
	docker-compose exec queue-backend npm run job:trigger:all-force

.PHONY: clean-db-and-sync
clean-db-and-sync:
	@echo "⚠️  Warning: This will clean governance tables and run full sync"
	@echo "❌ Press Ctrl+C within 5 seconds to cancel..."
	@sleep 5
	@echo "🧹 Cleaning governance tables..."
	@docker exec -it voltaire_db psql -U voltaire -d 1694 -c "TRUNCATE TABLE dreps, drep_delegators, proposals, proposal_metadata, proposal_votes CASCADE;"
	@echo "🔄 Running full sync..."
	@$(MAKE) sync-all-force

.PHONY: db-stats
db-stats:
	@echo "📊 Governance database statistics:"
	@docker exec -it voltaire_db psql -U voltaire -d 1694 -c "SELECT 'dreps' as table_name, COUNT(*) as count FROM dreps UNION ALL SELECT 'proposals', COUNT(*) FROM proposals UNION ALL SELECT 'proposal_votes', COUNT(*) FROM proposal_votes UNION ALL SELECT 'drep_delegators', COUNT(*) FROM drep_delegators UNION ALL SELECT 'timeline_events', COUNT(*) FROM drep_timeline_event ORDER BY table_name;"

.PHONY: db-clean-governance
db-clean-governance:
	@echo "⚠️  WARNING: This will delete all governance data!"
	@echo "❌ Press Ctrl+C within 10 seconds to cancel..."
	@sleep 10
	@docker exec -it voltaire_db psql -U voltaire -d 1694 -c "TRUNCATE TABLE dreps, drep_delegators, proposals, proposal_metadata, proposal_votes CASCADE;"
	@echo "✅ Governance tables cleaned"

.PHONY: quick-sync
quick-sync:
	@$(MAKE) sync-proposals
	@$(MAKE) sync-governance
	@$(MAKE) sync-drep-votes
