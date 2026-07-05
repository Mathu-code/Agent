FROM node:20

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm install

COPY backend/ ./

EXPOSE 45678

ENV NODE_ENV=production
ENV PORT=45678

CMD ["node", "server.js"]
