FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
ENV APP_PORT=9090
EXPOSE 9090
CMD ["node", "index.js"]
