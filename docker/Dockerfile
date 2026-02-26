FROM node:20-alpine

RUN apk add --no-cache \
    libreoffice \
    imagemagick \
    ghostscript \
    poppler-utils \
    graphicsmagick \
    fftw \
    tzdata

ENV TZ=Asia/Shanghai

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/
COPY scripts/ ./scripts/
COPY init.sql ./init.sql

RUN mkdir -p public uploads backups

RUN cp init.sql /docker-entrypoint-initdb.d/ 2>/dev/null || true

EXPOSE 3000

CMD ["node", "src/server.js"]
