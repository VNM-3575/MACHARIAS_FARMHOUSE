FROM node:18-alpine AS builder
WORKDIR /app

# Install root deps (server may not need heavy deps) and build admin app
COPY package.json package-lock.json* ./
RUN npm install --production --silent || true

# Build admin React app
COPY admin-app/package.json admin-app/package-lock.json* ./admin-app/
WORKDIR /app/admin-app
RUN npm install --silent
COPY admin-app/ ./
RUN npm run build

# Final image
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app .
COPY --from=builder /app/admin-app/ ../public/admin-app
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
