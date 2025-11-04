#
# Frontend Dockerfile
#

# --- Étape 1 : Build Angular ---
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build --omit=dev

# --- Étape 2 : Serveur Nginx ---
FROM nginx:1.29.2-alpine
WORKDIR /usr/share/nginx/html

# Copie du build Angular (Angular >= 17 structure)
COPY --from=build /app/dist/frontend/browser/ ./

# Configuration nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
