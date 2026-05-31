# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat mysql-client

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

RUN npx prisma generate
COPY docker-entrypoint.sh ./
RUN chmod +x ./docker-entrypoint.sh

ENTRYPOINT ["./docker-entrypoint.sh"]


COPY . .

# ---- Production stage ----
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat mysql-client

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev

RUN npx prisma generate
COPY docker-entrypoint.sh ./
RUN chmod +x ./docker-entrypoint.sh

COPY src ./src

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "src/app.js"]