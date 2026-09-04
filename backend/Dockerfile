FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

RUN mkdir -p /app/data && chown -R node:node /app/data

USER node

EXPOSE 3000
CMD ["npm", "start"]
