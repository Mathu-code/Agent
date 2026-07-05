FROM node:20-slim

WORKDIR /app/backend

# Install backend dependencies
COPY backend/package*.json ./
RUN npm install --production=false

# Build frontend
RUN apt-get update && apt-get install -y curl && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && npm install -g npm@latest
COPY backend/ ./backend/
COPY frontend/ ./frontend/
RUN cd backend && npm run build

# Expose port
EXPOSE 45678

ENV NODE_ENV=production
ENV PORT=45678

# Start server
CMD ["node", "server.js"]
