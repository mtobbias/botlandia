# Etapa 1: Construção para Desenvolvimento
FROM node:21 AS development

# Labels para a etapa de desenvolvimento
LABEL maintainer="Marcelo Tobias <marcelo.tobbias@gmail.com>"
LABEL org.opencontainers.image.title="Botlandia Client Web - Development Stage"
LABEL org.opencontainers.image.description="Etapa de desenvolvimento para a aplicação Botlandia Client Web."
LABEL org.opencontainers.image.url="https://www.botlandia.com.br"
LABEL org.opencontainers.image.source="https://github.com/mtobbias/botlandia"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.licenses="MIT"

# Define o diretório de trabalho
WORKDIR /app

# Atualiza o gerenciador de pacotes e instala dependências de sistema necessárias
RUN apt-get update && apt-get install -y \
    build-essential \
    libx11-dev \
    libxtst-dev \
    libpng-dev \
    libxext-dev \
    && rm -rf /var/lib/apt/lists/*

# Copia os arquivos de dependências
COPY package*.json ./

# Instala todas as dependências, incluindo devDependencies
RUN npm install

# Copia o restante do código da aplicação
COPY .. .

# Executa o build da aplicação para gerar a pasta /app/dist e resolver path aliases
RUN npm run build
RUN cp env.example dist/.env

# Etapa 2: Produção
FROM node:21 AS production

# Labels para a etapa de produção
LABEL maintainer="Marcelo Tobias <marcelo.tobbias@gmail.com>"
LABEL org.opencontainers.image.title="Botlandia Client Web - Production Stage"
LABEL org.opencontainers.image.description="Imagem de produção para a aplicação Botlandia Client Web."
LABEL org.opencontainers.image.url="https://www.botlandia.com.br"
LABEL org.opencontainers.image.source="https://github.com/mtobbias/botlandia"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.licenses="MIT"

# Define o diretório de trabalho
WORKDIR /app

# Atualiza o gerenciador de pacotes e instala dependências de sistema necessárias para produção
RUN apt-get update && apt-get install -y \
    libx11-dev \
    libxtst-dev \
    libpng-dev \
    libxext-dev \
    && rm -rf /var/lib/apt/lists/*

# Copia os arquivos de dependências
COPY package*.json ./
COPY env.example ./.env

# Instala apenas as dependências de produção
RUN npm install --only=production

# Copia o código compilado da etapa de desenvolvimento
COPY --from=development /app/dist ./dist
# Copia a pasta 'souls' da etapa de desenvolvimento para '/app/souls'
COPY --from=development /app/souls ./souls
COPY --from=development /app/souls ./souls

# Exponha a porta que a aplicação irá rodar
EXPOSE 3001

# Definir usuário não-root para melhorar a segurança
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser

# Definir as variáveis de ambiente (opcional, pode ser substituído pelo docker-compose ou runtime)
ENV PORT=3001
ENV WHATSAPP_API_URL=http://botlandia-api-whatsapp:3002
ENV RABBITMQ_URL=amqp://botlandia:botlandia@botlandia-rabbitmq:5672
ENV MONGO_URI=mongodb://botlandia:botlandia@botlandia-mongo:27017/admin

# Comando para iniciar a aplicação
CMD ["npm", "start"]

# Healthcheck para monitorar a saúde do container
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1
