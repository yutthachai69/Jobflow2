# ============================================
# Stage 1: Build (สร้าง Standalone output)
# ============================================
FROM node:20 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client (สร้างที่นี่ครั้งเดียวพอ)
RUN npx prisma generate

# Set dummy DATABASE_URL for build
ENV DATABASE_URL="file:./dev.db"

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

# --- แก้ไขตรงนี้: ห้ามรัน generate ใหม่ แต่ให้ COPY ตัวที่เสร็จแล้วมาใช้ ---
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
# -------------------------------------------------------------------

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# ใช้ standalone server
CMD ["node", "server.js"]