# 📱 BOTLANDIA-API-WHATSAPP

![WhatsApp](https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

## 🌐 Tecnologias Utilizadas

- **Backend:**
  - [Node.js](https://nodejs.org/) 🟢
  - [Express](https://expressjs.com/) 📦
  - [TypeScript](https://www.typescriptlang.org/) 🔷
  - [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) 📱
  - [RabbitMQ](https://www.rabbitmq.com/) 🐇

- **Configurações:**
  - **.env.example** 📄
    - Arquivo de exemplo para configuração das variáveis de ambiente.
  - **Dockerfile** 🐳
    - Define a imagem Docker para containerização da aplicação.

## 📦 Instalação

### 🔧 Pré-requisitos

- [Node.js](https://nodejs.org/) instalado
- [Git](https://git-scm.com/) instalado
- [Docker](https://www.docker.com/) instalado

### 🚀 Passos de Instalação

1. **Clone o repositório:**

    ```bash
    git clone https://github.com/seu-usuario/botlandia-api-whatsapp.git
    cd botlandia-api-whatsapp
    ```

2. **Instale as dependências:**

    ```bash
    npm install
    ```

3. **Configure as variáveis de ambiente:**

    - Renomeie o arquivo `.env.example` para `.env`:

        ```bash
        cp .env.example .env
        ```

    - Preencha as variáveis necessárias no arquivo `.env`.

4. **Build da imagem Docker:**

    ```bash
    docker build -t botlandia-api-whatsapp:0.0.1 .
    ```

5. **Inicie os containers com Docker Compose:**

    Se você tiver um `docker-compose.yml`, utilize:

    ```bash
    docker-compose up -d
    ```

    Caso contrário, inicie manualmente:

    ```bash
    docker run -d -p 3000:3000 --env-file .env botlandia-api-whatsapp:0.0.1
    ```

## 📚 Documentação

### 📢 Endpoints da API

API **BOTLANDIA-API-WHATSAPP** 
expõe diversos endpoints para interagir com o WhatsApp. 

Abaixo estão detalhados os principais endpoints disponíveis:

#### 1. Enviar Mensagem

- **Endpoint:** `/send-message`
- **Método:** `POST`
- **Descrição:** Envia uma mensagem de texto para um contato específico.
- **Parâmetros no Corpo da Requisição:**
  - `phone` (string, obrigatório): Número de telefone do destinatário no formato internacional (ex.: "5511999998888").
  - `message` (string, obrigatório): Conteúdo da mensagem a ser enviada.
- **Exemplo de Requisição:**

    ```json
    {
      "phone": "5511999998888",
      "message": "Olá! Esta é uma mensagem de teste."
    }
    ```

- **Exemplo de Resposta:**

    ```json
    {
      "status": "success",
      "message": "Mensagem enviada com sucesso."
    }
    ```

#### 2. Enviar Mensagem com Anexo

- **Endpoint:** `/send-message-with-attachment`
- **Método:** `POST`
- **Descrição:** Envia uma mensagem com um anexo (imagem, vídeo, documento, etc.) para um contato específico.
- **Parâmetros no Corpo da Requisição:**
  - `phone` (string, obrigatório): Número de telefone do destinatário no formato internacional.
  - `message` (string, opcional): Conteúdo da mensagem.
  - `attachment` (file, obrigatório): Arquivo a ser enviado como anexo.
- **Exemplo de Requisição:**

    ```multipart
    POST /send-message-with-attachment
    Content-Type: multipart/form-data

    {
      "phone": "5511999998888",
      "message": "Aqui está o arquivo solicitado.",
      "attachment": <arquivo>
    }
    ```

- **Exemplo de Resposta:**

    ```json
    {
      "status": "success",
      "message": "Mensagem com anexo enviada com sucesso."
    }
    ```

#### 3. Enviar Mensagem para um Grupo

- **Endpoint:** `/send-message-group`
- **Método:** `POST`
- **Descrição:** Envia uma mensagem de texto para um grupo específico no WhatsApp.
- **Parâmetros no Corpo da Requisição:**
  - `groupId` (string, obrigatório): ID do grupo destinatário.
  - `message` (string, obrigatório): Conteúdo da mensagem a ser enviada.
- **Exemplo de Requisição:**

    ```json
    {
      "groupId": "123456789@g.us",
      "message": "Olá, grupo! Esta é uma mensagem de teste."
    }
    ```

- **Exemplo de Resposta:**

    ```json
    {
      "status": "success",
      "message": "Mensagem enviada para o grupo com sucesso."
    }
    ```

#### 4. Obter Lista de Grupos

- **Endpoint:** `/groups`
- **Método:** `GET`
- **Descrição:** Recupera a lista de grupos aos quais a conta do WhatsApp está conectada.
- **Exemplo de Requisição:**

    ```http
    GET /groups
    ```

- **Exemplo de Resposta:**

    ```json
    {
      "status": "success",
      "groups": [
        {
          "id": "123456789@g.us",
          "name": "Grupo de Teste"
        },
        {
          "id": "987654321@g.us",
          "name": "Outro Grupo"
        }
      ]
    }
    ```

#### 5. Obter Lista de Contatos

- **Endpoint:** `/contacts`
- **Método:** `GET`
- **Descrição:** Recupera a lista de contatos da conta do WhatsApp.
- **Exemplo de Requisição:**

    ```http
    GET /contacts
    ```

- **Exemplo de Resposta:**

    ```json
    {
      "status": "success",
      "contacts": [
        {
          "id": "5511999998888",
          "name": "João Silva"
        },
        {
          "id": "5511888887777",
          "name": "Maria Souza"
        }
      ]
    }
    ```

#### 6. Obter QR Code

- **Endpoint:** `/qrcode`
- **Método:** `GET`
- **Descrição:** Obtém o QR Code necessário para autenticar a sessão do WhatsApp.
- **Exemplo de Requisição:**

    ```http
    GET /qrcode
    ```

- **Exemplo de Resposta:**

    ```json
    {
      "status": "success",
      "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
    }
    ```

### 🔄 Fluxo de Autenticação

1. **Obtenção do QR Code:**
   - Faça uma requisição GET para `/qrcode` para receber o QR Code.
   - Utilize um leitor de QR Code para escanear e autenticar a sessão.

2. **Envio de Mensagens:**
   - Após a autenticação, utilize os endpoints `/send-message`, `/send-message-with-attachment` ou `/send-message-group` para enviar mensagens.

3. **Gerenciamento de Grupos e Contatos:**
   - Utilize os endpoints `/groups` e `/contacts` para gerenciar e visualizar grupos e contatos.

### 📌 Considerações sobre Segurança

- **Autenticação:** Implemente mecanismos de autenticação (como JWT) para proteger os endpoints da API.
- **Validação de Dados:** Assegure que todos os dados recebidos nas requisições sejam validados para evitar injeções de código e outros ataques.
- **Rate Limiting:** Considere implementar limitação de taxa para evitar abusos e sobrecarga no servidor.

## 🧪 Testes

Explique como rodar os testes, quais frameworks estão sendo utilizados, etc.

```bash
npm run test
