<p align="center">
  <h1 align="center">Conecta Vox</h1>
  <p align="center">Plataforma de gamificação para eventos com QR Codes e missões interativas.</p>
</p>

<p align="center">
  <a href="#funcionamento"><strong>Funcionamento</strong></a> ·
  <a href="#arquitetura"><strong>Arquitetura</strong></a> ·
  <a href="#clone-and-run-locally"><strong>Instalação</strong></a>
</p>
<br/>

## Funcionamento

O **Conecta Vox** é uma aplicação web projetada para engajar participantes de eventos através de gamificação.

### Funcionalidades Principais

*   **Eventos**: Os usuários podem visualizar e entrar em eventos ativos.
*   **Missões**: Participantes completam missões encontrando QR Codes espalhados pelo evento (ex: estandes, locais específicos).
*   **Pontos Ocultos**: QR Codes escondidos que geram pontuação extra.
*   **Networking (Conexões)**: Cada participante possui um QR Code único. Escanear o código de outro participante cria uma "conexão" e gera pontos para ambos.
*   **Ranking**: Um leaderboard em tempo real mostra os participantes com maior pontuação no evento.
*   **Admin Dashboard**: Área restrita para organizadores criarem eventos, missões e gerarem os QR Codes para impressão.

## Arquitetura

### Tech Stack

*   **Frontend**: Next.js 15 (App Router), React, Tailwind CSS, Lucide Icons.
*   **Backend**: Supabase (PostgreSQL, Auth, Edge Functions/RPCs).
*   **Estilização**: Tailwind CSS com design system customizado (Dark Mode default).
*   **QR Code**: `qrcode.react` para geração e `html5-qrcode` para leitura.

### Banco de Dados & Segurança

*   **PostgreSQL**: Todo o estado da aplicação é persistido no Supabase.
*   **RLS**: Políticas de segurança rigorosas garantem que usuários só acessem dados permitidos.
*   **RPCs**: Lógica crítica de pontuação e validação de scans é executada diretamente no banco de dados via funções PostgreSQL para segurança e performance.

## Clone and run locally

1.  Crie um projeto no [Supabase](https://database.new).

2.  Clone o repositório e instale as dependências:

    ```bash
    git clone <repo>
    cd conecta-vox
    npm install
    ```

3.  Configure as variáveis de ambiente:
    Renomeie `.env.example` para `.env.local` e adicione suas chaves do Supabase:

    ```env
    NEXT_PUBLIC_SUPABASE_URL=[SUA URL DO SUPABASE]
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[SUA CHAVE PÚBLICA]
    ```

4.  Configure o Banco de Dados:
    Execute o script `schema.sql` (localizado na raiz do projeto) no Editor SQL do seu painel Supabase para criar as tabelas e funções necessárias.

5.  Execute o servidor de desenvolvimento:

    ```bash
    npm run dev
    ```

    Acesse [http://localhost:3000](http://localhost:3000).

## Deployment Supabase

### Push Schema
```sh
supabase login
supabase link
supabase db push
```

### Deploy Functions

```sh
supabase functions deploy process-avatar --use-api
```

### Vault Secret

```sql
SELECT vault.create_secret(
  'https://<project_id>.supabase.co',  -- The secret value
  'SUPABASE_URL',
  'Base URL of the Supabase project'
);
SELECT vault.create_secret(
  '<service_role>',
  'SUPABASE_PRIVATE_KEY',
  'Private Key'
);
```