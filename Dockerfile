# Etapa de construcción
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Etapa de producción (Servidor Web)
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Reemplazamos la configuración por defecto de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]