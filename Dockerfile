FROM node:12-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
RUN npm i -g nodemon
COPY . .
EXPOSE 3300
CMD ["nodemon", "index.js"]