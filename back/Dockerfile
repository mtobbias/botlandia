# Utilizar a imagem oficial do Node.js na versão 20
FROM node:20

# Definir o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copiar os arquivos de dependências para o diretório de trabalho
COPY package*.json ./

# Instalar todas as dependências (incluindo devDependencies)
RUN npm install

# Copiar o restante do código da aplicação para o diretório de trabalho
COPY . .

# Compilar o código TypeScript
RUN npm run build

# Expor a porta que a aplicação irá utilizar (ajuste conforme necessário)
EXPOSE 3000

# Definir a variável de ambiente NODE_ENV para produção
ENV NODE_ENV=production

# Comando para iniciar a aplicação em modo de produção
CMD ["npm", "start"]
