# ============================================
# Stage 1: Build (สร้าง Standalone output)
# ============================================
FROM node:20 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# 👉 แก้ไขตรงนี้: เพิ่มบรรทัดนี้ เพื่อเอา script เข้าไปก่อน npm ci
COPY scripts ./scripts/

# Install dependencies
RUN npm ci

# Copy source code (ส่วนที่เหลือค่อยตามมาทีหลัง)
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

# Copy prisma client ที่สร้างเสร็จแล้วมาด้วย
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"


# ใช้ standalone server
CMD ["node", "server.js"]