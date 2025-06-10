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
