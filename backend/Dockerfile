# backend/Dockerfile
# Governance Core container for Secretarybird Guardian Console
#
# NOTE: Build context is the project root, not ./backend
# Run with: docker-compose up --build
#
FROM node:20-alpine

WORKDIR /app

# Install dependencies for better-sqlite3 native bindings
RUN apk add --no-cache python3 make g++

# Install dependencies first (caching layer)
COPY package.json package-lock.json ./

# Use npm since we're copying package.json (pnpm may not be in alpine)
RUN npm install

# Copy backend source code only (we don't need frontend in this container)
COPY backend/src ./backend/src
COPY tsconfig.json ./

# Expose the API port
EXPOSE 3001

# Start backend with tsx
CMD ["npx", "tsx", "backend/src/server.ts"]
