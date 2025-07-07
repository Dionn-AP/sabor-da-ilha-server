## Sabor da Ilha - Backend

Este é o repositório do backend da aplicação mobile "Sabor da Ilha", desenvolvida como um sistema de comanda digital para restaurantes e lanchonetes. Ele gerencia todas as requisições da aplicação mobile, incluindo pedidos, gerenciamento de mesas, itens do cardápio e autenticação de usuários.

### Sobre o Projeto

O backend do "Sabor da Ilha" é o cérebro por trás da aplicação mobile, atuando como o servidor que processa e armazena todas as informações relacionadas aos pedidos e operações de um restaurante ou lanchonete. Ele permite que a aplicação mobile funcione como uma comanda digital eficiente, facilitando o gerenciamento de pedidos e o fluxo de trabalho.

### Tecnologias Utilizadas

Este backend foi desenvolvido com as seguintes tecnologias:

* **Node.js:** Ambiente de execução JavaScript assíncrono e orientado a eventos.
* **TypeScript:** Superset de JavaScript que adiciona tipagem estática, proporcionando maior robustez e manutenibilidade ao código.
* **Sequelize:** ORM (Object-Relational Mapper) que facilita a interação com o banco de dados, permitindo a manipulação de dados através de objetos JavaScript.
* **Zod:** Biblioteca para validação de esquemas, garantindo a integridade dos dados recebidos pela API.

### Hospedagem

* **Backend:** A aplicação backend está hospedada na plataforma [Render.com](https://render.com/).
* **Banco de Dados:** A base de dados utilizada pelo projeto está hospedada no [Neon.com](https://neon.tech/).

### Estrutura do Repositório

O repositório possui a seguinte estrutura principal:

* `src/`: Contém todo o código-fonte da aplicação.
* `dist/`: Contém os arquivos compilados (JavaScript) após o processo de build do TypeScript.
* `.env.example`: Exemplo de arquivo para configuração das variáveis de ambiente.
* `package.json`: Informações do projeto e dependências.
* `package-lock.json`: Garante que as mesmas versões das dependências sejam instaladas.
* `tsconfig.json`: Configurações do compilador TypeScript.
* `.gitignore`: Define os arquivos e diretórios a serem ignorados pelo controle de versão Git.

### Instalação e Configuração (Local)

Para configurar e rodar o projeto localmente, siga os passos abaixo:

1.  **Clone o repositório:**

    ```bash
    git clone https://github.com/Dionn-AP/sabor-da-ilha-server.git
    cd sabor-da-ilha-server
    ```

2.  **Instale as dependências:**

    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente:**
    Crie um arquivo `.env` na raiz do projeto, baseado no `.env.example`, e preencha com suas credenciais do banco de dados e outras configurações necessárias:

    ```
    # Exemplo de .env
    DATABASE_URL="sua_url_de_conexao_com_o_banco_de_dados_neon"
    PORT=3000
    # Outras variáveis de ambiente conforme necessário
    ```

4.  **Execute as migrações do banco de dados (se aplicável):**
    Verifique a documentação interna do projeto para comandos específicos do Sequelize para criar as tabelas no banco de dados.

5.  **Inicie o servidor:**

    ```bash
    npm run dev # Ou o comando de inicialização definido no package.json
    ```

    O servidor estará rodando em `http://localhost:3000` (ou na porta configurada no seu arquivo `.env`).

### Contribuição

Se você deseja contribuir com o projeto, siga os seguintes passos:

1.  Faça um fork deste repositório.
2.  Crie uma nova branch para sua feature (`git checkout -b feature/minha-feature`).
3.  Faça suas alterações e commit-as (`git commit -m 'feat: Adiciona minha nova feature'`).
4.  Envie suas alterações para o seu fork (`git push origin feature/minha-feature`).
5.  Abra um Pull Request para a branch principal deste repositório.

### Licença

MIT

---

### Autor

* **Dionn-AP** - [Perfil do GitHub](https://github.com/Dionn-AP)
