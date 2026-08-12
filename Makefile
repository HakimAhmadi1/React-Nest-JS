.PHONY: help install dev dev-backend dev-frontend build lint test test-e2e \
        migrate seed docker-up docker-down docker-build clean

help:
	@echo "Setup"
	@echo "  make install        Install dependencies for both apps"
	@echo "  make migrate        Run database migrations"
	@echo "  make seed           Seed the database (run after migrate)"
	@echo ""
	@echo "Development"
	@echo "  make dev            Run backend and frontend together"
	@echo "  make dev-backend    Run NestJS in watch mode"
	@echo "  make dev-frontend   Run the Vite dev server"
	@echo ""
	@echo "Quality"
	@echo "  make lint           Lint both apps"
	@echo "  make test           Unit tests for both apps"
	@echo "  make test-e2e       Backend e2e tests (needs a database)"
	@echo "  make build          Production build of both apps"
	@echo ""
	@echo "Docker"
	@echo "  make docker-up      Start db + api + web"
	@echo "  make docker-down    Stop everything"
	@echo "  make docker-build   Rebuild images and start"

# --legacy-peer-deps is gone: the dependency tree resolves cleanly.
install:
	npm install

dev:
	npm run dev

dev-backend:
	npm run dev:backend

dev-frontend:
	npm run dev:frontend

build:
	npm run build

lint:
	npm run lint

test:
	npm test

test-e2e:
	npm run test:e2e

migrate:
	npm run migration:run

seed:
	npm run seed

# Compose lives at the repo root now, so these work from here.
docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-build:
	docker compose up --build -d

clean:
	rm -rf backend/dist backend/coverage frontend/dist frontend/coverage
