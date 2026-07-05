FROM node:20

WORKDIR /app

# Install backend deps
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Copy source and build frontend
COPY . .
RUN cd backend && npm run build

EXPOSE 45678
ENV NODE_ENV=production
ENV PORT=45678

CMD ["node", "backend/server.js"]
