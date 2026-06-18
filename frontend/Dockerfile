FROM node:22-slim

WORKDIR /app

# Install dependencies first to leverage Docker layer cache
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
