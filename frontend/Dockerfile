# Frontend Dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install 
RUN npm install react-router-dom

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
