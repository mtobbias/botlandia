<img src="front/public/logo.png"/>

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![OpenAI](https://img.shields.io/badge/OpenAI-333333?style=for-the-badge&logo=openai&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4DB33D?style=for-the-badge&logo=mongodb&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

## 🚀 Sobre o Projeto

Botlandia é um projeto pessoal de um assistente para facilitar o dia a dia.

## 🛠️ Algumas funcionalidades

- 🔍 **Pesquisa na Internet:** Encontre informações atualizadas e precisas com facilidade.
- 📺 **Pesquisa no YouTube:** Descubra vídeos relevantes e personalizados de acordo com suas preferências.
- 🎨 **Criação de Imagens:** Gere imagens incríveis a partir de descrições textuais.
- 🗣️ **Conversão de Texto em Fala:** Transforme texto em fala de forma clara e natural.
- 🗄️ **Gerenciamento de Bancos de Dados:** Utilize MongoDB, SQLite ou MySQL para armazenar e gerenciar informações de maneira eficiente.
- 🔄 **Mensageria com RabbitMQ:** Gerencie filas e mensagens de forma robusta e escalável.
- ✉️ **Envio de E-mails com Gmail:** Envie e gerencie e-mails de forma prática e segura através do Gmail.
- 💬 **Atendimento via WhatsApp:** Interaja com os usuários de maneira automatizada e amigável através do WhatsApp.

---

### 📁 **Projetos**

- **api-whatsapp/** 📱
  - **Cliente API para WhatsApp Não Oficial:** Conecta-se através da aplicação de navegador WhatsApp Web.
  - **Funcionamento com Puppeteer:** A biblioteca lança a aplicação WhatsApp Web no navegador e a gerencia utilizando o Puppeteer para criar uma instância do WhatsApp Web, reduzindo o risco de bloqueio.
  - **Referência:** [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)
  - **Observação:** Esta API não é oficial e utiliza métodos não suportados diretamente pelo WhatsApp, o que pode implicar em riscos de bloqueio da conta se os termos de uso forem violados.

- **back/** 🖥️
  - **Backend em Node.js:** Desenvolvido com **Node.js** e **Express** para garantir um desempenho robusto.
  - **Lógica de Negócios:** Gerencia as regras de negócios e processos internos da aplicação.
  - **Integração com Bancos de Dados:** Conecta-se a MongoDB, SQLite ou MySQL para armazenamento eficiente de dados.
  - **MemoryTool:** Ferramenta para gerenciar a memória e personalizar as interações com os usuários, proporcionando uma experiência mais dinâmica.

- **front/** 🎨
  - **Frontend em React:** Construído com **React** para oferecer uma interface de usuário intuitiva e responsiva.
  - **Experiência do Usuário:** Proporciona uma navegação fluida e amigável para interagir com a aplicação.
  - **Integração com Backend:** Conecta-se perfeitamente com as funcionalidades do backend, garantindo uma experiência de uso coesa e eficiente.

- **docker-compose.yml** 🐳
  - **Orquestração de Serviços:** Utiliza **Docker Compose** para integrar e gerenciar todos os serviços necessários da aplicação.
  - **Facilidade de Deploy:** Simplifica o processo de setup e deployment, assegurando que todas as dependências sejam configuradas corretamente.
  - **Ambiente Consistente:** Garante que a aplicação rode de maneira uniforme em diferentes ambientes, minimizando problemas de compatibilidade.

---

## 🐳 Docker Compose

O arquivo `docker-compose.yml` está localizado na raiz do projeto e facilita a configuração e execução de todos os serviços necessários para rodar a aplicação de forma integrada.

````
docker-compose up -d
````

[![Run Docker Compose](https://img.shields.io/badge/Run-Docker%20Compose-blue.svg)](./docker-compose.yml)

---

# <img src="front/public/iara.png" alt="Iara Banner" width="42"/> Iara 
