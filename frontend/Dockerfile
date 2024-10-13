# Etapa 1: Construir a aplicação
FROM nginx:stable-alpine AS builder

# Definir o diretório de trabalho
WORKDIR /app

# Copiar os arquivos de package.json e package-lock.json
COPY package*.json ./

# Instalar as dependências
RUN npm install

# Copiar todo o código fonte
COPY . .

# Construir a aplicação para produção
RUN npm run build

# Etapa 2: Servir a aplicação com Nginx
FROM nginx:stable-alpine

# Remover o arquivo de configuração padrão do Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiar os arquivos estáticos da etapa de build
COPY --from=builder /app/build /usr/share/nginx/html

# Copiar a configuração personalizada do Nginx, se necessário
# COPY nginx.conf /etc/nginx/nginx.conf

# Expor a porta 80
EXPOSE 80

# Comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]

