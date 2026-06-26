# Docker Image = แพ็กเกจพร้อมรันของแอป (แม่พิมพ์)
# Docker Container = ตัวที่เอา image ไปรันจริง (docker run / compose up)
# อ่านเพิ่ม: DOCKER.md
#
# ============================================
# Stage 1: Build (สร้าง Standalone output)
# ============================================
FROM node:20 AS builder

WORKDIR /app

# Copy package files (exclude package-lock.json - lock file from Windows skips Linux optional deps)
COPY package.json ./
COPY prisma ./prisma/

# Install deps fresh for Linux - ensures lightningcss-linux-x64-gnu is installed
RUN npm install

# Copy source code (and lock file for reproducibility - but install already done)
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Set dummy DATABASE_URL for build
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/temp_db"
ENV JWT_SECRET="complex_temporary_secret_for_build_only_12345"

# Build Next.js
RUN npm run build

# ============================================
# Stage 2: Production (ใช้ Standalone output)
# ============================================
FROM node:20-slim AS runner

WORKDIR /app

# Install Chromium + Thai fonts สำหรับ Puppeteer PDF generation
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-thai-tlwg \
    fonts-noto \
    fonts-noto-cjk \
    --no-install-recommends \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Copy standalone output จาก builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Copy prisma client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy puppeteer-core (dynamic import อาจไม่ถูก bundle โดย standalone)
COPY --from=builder /app/node_modules/puppeteer-core ./node_modules/puppeteer-core

# ❌ ลบส่วน docker-entrypoint และ chmod ออกหมดแล้ว

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# ✅ ใช้คำสั่งมาตรฐานในการรัน Server แทน
CMD ["node", "server.js"]