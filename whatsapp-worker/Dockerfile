FROM node:20-alpine

WORKDIR /app

# Instala dependências do SO que podem ser necessárias para bibliotecas criptográficas do Baileys
RUN apk add --no-cache git tzdata

COPY package.json package-lock.json ./

RUN npm install --production

COPY . .

# Expõe a API do worker
EXPOSE 3001

# PM2 não é estritamente necessário no Docker se usarmos restart: always, 
# mas usar node diretamente é perfeitamente válido no Docker
CMD ["node", "index.js"]

