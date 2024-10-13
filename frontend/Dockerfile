# Construir a aplicação React usando uma imagem Node.js como base
FROM node:18-alpine AS build

# Definir o diretório de trabalho
WORKDIR /app

# Copiar os arquivos package.json e package-lock.json para o container
COPY package*.json ./

# Instalar as dependências
RUN npm install

# Copiar o restante dos arquivos do projeto para o diretório de trabalho
COPY . .

# Construir a aplicação para produção
RUN npm run build

# Servir a aplicação com Nginx
FROM nginx:stable-alpine

# Copiar os arquivos de build do React para o diretório de conteúdo estático do Nginx
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

# Comando padrão para rodar o Nginx
CMD ["nginx", "-g", "daemon off;"]
