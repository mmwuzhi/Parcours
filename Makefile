.PHONY: dev setup migrate db-studio down logs check

# Load .env into Make variables and export them to all shell commands.
# drizzle-kit reads DATABASE_URL from process.env and doesn't auto-load .env.
-include .env
export

# Start the full dev environment (data layer + apps)
dev:
	docker compose up -d postgres redis
	pnpm dev

# First-time setup: copy env, install deps, start data layer, run migrations
setup:
	@[ -f .env ] || cp .env.example .env
	pnpm install
	docker compose up -d postgres redis
	@echo "Waiting for postgres to be healthy..."
	@until docker compose exec postgres pg_isready -U parcours > /dev/null 2>&1; do sleep 1; done
	pnpm --filter api db:migrate

# Apply pending DB migrations
migrate:
	pnpm --filter api db:migrate

# Open Drizzle Studio
db-studio:
	pnpm --filter api db:studio

# Stop all Docker services and remove containers
down:
	docker compose down

# Tail logs from all running Docker services
logs:
	docker compose logs -f

# Run the full pre-push checklist
check:
	pnpm format
	pnpm lint
	pnpm typecheck
	pnpm test
	NODE_ENV=production pnpm --filter web build
