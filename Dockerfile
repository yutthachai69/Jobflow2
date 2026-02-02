# ============================================
# Stage 1: Build (สร้าง Standalone output)
# ============================================
FROM node:20 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# ❌ ลบบรรทัด COPY scripts ออกแล้ว

# Install dependencies
RUN npm ci

# Fix: Ensure lightningcss Linux binary is installed (Tailwind v4 uses it)
# Prevents "Cannot find module lightningcss.linux-x64-gnu.node" in Docker/Linux
RUN npm install lightningcss-linux-x64-gnu --save-optional --no-audit --no-fund

# Copy source code
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
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy standalone output จาก builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Copy prisma client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# ❌ ลบส่วน docker-entrypoint และ chmod ออกหมดแล้ว

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# ✅ ใช้คำสั่งมาตรฐานในการรัน Server แทน
CMD ["node", "server.js"]