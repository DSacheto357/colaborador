# ⚡ COLABORADOR - GESTÃO, ESTOQUE & FECHAMENTO INTERNO

Sistema moderno, ultra-ágil e otimizado para **registro direto pelo celular** (PWA), com foco em conciliação de materiais comprados, vendas por conta, controle de estoque e **fechamento da empresa**, com opção de sincronização gratuita em nuvem via **Google Sheets** ou funcionamento 100% autônomo offline.

---

## 🎨 Design & Identidade Visual
- **Tema:** Preto profundo (*Obsidian Black*) e Azul Elétrico Brilhante (*Neon Cyan/Electric Glow*).
- **Mobile-First Ergonomic:** Projetado para operação com o polegar:
  - Botão flutuante gigante (**+ NOVO REGISTRO**) na parte inferior.
  - Gaveta inferior deslizante (*Bottom Sheet*) com abertura em menos de 1 segundo.
  - Teclado numérico nativo automático (`inputmode="decimal"`) para quantidades e valores.
  - *Chips* de toque rápido para as contas e materiais mais frequentes.
  - Feedback tátil com vibração no celular a cada lançamento registrado.

---

## 🚀 Como Rodar Localmente (Agora Mesmo)
O servidor local já está ativo na porta `8080`.
1. No seu computador, abra no navegador:
   ```
   http://localhost:8080
   ```
2. **Para testar no celular na mesma rede Wi-Fi**:
   - Descubra o IP local do seu computador (no terminal digite `ipconfig`, ex: `192.168.1.15`).
   - No navegador do seu celular, acesse: `http://SEU_IP:8080` (ex: `http://192.168.1.15:8080`).

---

## 🌐 Como Publicar no GitHub Pages (Gratuito)
1. Crie um repositório no seu GitHub (ex: `colaborador`).
2. Suba todos os arquivos desta pasta para o repositório (`git add .`, `git commit -m "Inicial"`, `git push`).
3. No GitHub, vá em **Settings > Pages**.
4. Em **Branch**, selecione `main` (ou `master`) e pasta `/ (root)`, depois clique em **Save**.
5. Pronto! Em 1 minuto o link estará disponível para acessar em qualquer celular:
   ```
   https://seu-usuario.github.io/colaborador/
   ```

---

## 📲 Como Instalar como Aplicativo no Celular (PWA)
1. Acesse o link no celular pelo Google Chrome ou Safari.
2. Toque no menu do navegador (três pontinhos ou botão de compartilhar).
3. Selecione **"Adicionar à tela de início"** ou **"Instalar aplicativo"**.
4. O ícone do **Colaborador** ficará na sua tela inicial e abrirá em tela cheia, como um aplicativo nativo da loja!

---

## 📊 Como Conectar com o Google Sheets (Sincronização em Nuvem PC & Celular)
O sistema possui sincronização bidirecional em tempo real: o que você lança no PC aparece no celular e vice-versa!
1. Abra uma planilha em branco no [Google Sheets](https://sheets.google.com).
2. No menu superior, clique em: **Extensões > Apps Script**.
3. Apague o código que estiver lá e cole todo o conteúdo do arquivo [google-apps-script.js](file:///d:/2Programa%C3%A7%C3%A3o/0%20-%20Empresa/Colaborador/google-apps-script.js).
4. Clique no ícone de **Salvar (Disquete 💾 ou Ctrl+S)**.
5. Clique em **Implantar**:
   - **Se for a primeira vez:** Clique em **Nova implantação** > tipo **App da Web** > Executar como: **Eu** > Quem tem acesso: **Qualquer pessoa** > **Implantar**.
   - **Se já implantou antes:** Clique em **Gerenciar implantações** > clique no **Lápis (Editar)** > em **Versão** selecione **Nova versão** > clique em **Implantar**. *(Crucial para o Google carregar o doGet e doPost)*.
6. Copie a **URL do app da Web** gerada (termina com `/exec`).
7. Cole nas Configurações do sistema ou confirme se a URL padrão já está conectada. Pronto! O badge do topo mostrará **"Nuvem Conectada"** e atualizará automaticamente no PC e no celular!

---

## 📑 Módulos & Recursos Atualizados
- **Início / Dashboard:** Resumo financeiro em tempo real, saldo líquido, métricas do dia e últimos lançamentos consolidados.
- **Pedidos (Numeração Automática #1, #2...):** Registro ágil de pedidos com data/hora automática, identificação de conta/cliente e canal de pagamento.
- **Compras & Insumos Gerais:** Registro de compras de materiais (placas, fitas, parafusos, cola, etc.) com conferência e controle de custos.
- **Estoque Exclusivo de Placas (MDF & Acrílico):**
  - Monitoramento estrito das placas de MDF e Acrílico cadastradas.
  - **Cadastro Rápido de Novas Placas:** Botão direto `+ Nova Placa` na aba Estoque e Configurações para cadastrar qualquer novo material (ex: Acrílico Verde, MDF 3mm Verde) com categoria, espessura e quantidade inicial já em estoque.
  - **Ajustes Manuais de Estoque (Aumentar e Abater à Mão):** Botões para aumentar (entrada manual / sobras / contagem) e abater (consumo manual / quebra / testes) com valores decimais (`0.5`, `1`, `2`), pré-visualização do novo saldo em tempo real e histórico auditável de ajustes com opção de exclusão.
  - **Catálogo de Placas em JSON:** Gerenciador visual na aba Configurações que permite adicionar ou customizar novas placas a qualquer momento.
- **Trava de Segurança na Edição:** Ao editar um Pedido, a aba de Compras fica bloqueada, e ao editar uma Compra, a aba de Pedidos fica inacessível.
- **Central de Fechamento:** Conciliação do período com cálculo de margens e consolidação oficial.
- **Exportação:** Exportação instantânea para **Excel (.xlsx)** com abas formatadas, visualização/impressão em **PDF** e backup/restauração em **JSON**.
