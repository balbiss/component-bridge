# --- STAGE 1: Build Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# As variáveis VITE_ precisam estar presentes no build time se não forem injetadas dinamicamente
# No Coolify, você pode definir as variáveis de ambiente e elas serão usadas aqui
RUN npm run build

# --- STAGE 2: Build Backend & Runtime ---
FROM node:20-alpine
WORKDIR /app

# Instalar dependências de produção para a API
COPY api/package*.json ./api/
RUN cd api && npm install --production

# Copiar código do backend
COPY api/ ./api/

# Copiar frontend buildado do Stage 1
COPY --from=frontend-builder /app/dist ./dist

# Variáveis de ambiente e porta
ENV NODE_ENV=production
ENV PORT=3003
EXPOSE 3003

WORKDIR /app/api
CMD ["node", "server.js"]
