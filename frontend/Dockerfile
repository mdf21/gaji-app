# Stage 1: Build React App
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Pastikan executable Vite memiliki permission dan build via Node untuk menghindari permission issue di Alpine
RUN chmod +x node_modules/.bin/vite && node node_modules/vite/bin/vite.js build

# Stage 2: Serve dengan Nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
