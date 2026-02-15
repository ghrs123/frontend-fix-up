# Supabase CLI - Instalação e Uso no Windows

## 1. Baixar o Supabase CLI
- Acesse https://github.com/supabase/cli/releases
- Baixe o arquivo `supabase_windows_amd64.tar.gz` (versão mais recente)
- Extraia o arquivo e coloque o executável `supabase.exe` em uma pasta, ex: `C:\Users\SeuUsuario\AppData\Local\Programs\supabase`

## 2. Adicionar ao PATH
- Abra o Painel de Controle > Sistema > Configurações Avançadas do Sistema > Variáveis de Ambiente
- Em "Variáveis de usuário", selecione "Path" e clique em "Editar"
- Clique em "Novo" e adicione o caminho da pasta onde está o `supabase.exe`
- Clique em OK para salvar
- Feche e abra o terminal

## 3. Testar instalação
- No terminal, rode:
  ```
  supabase --help
  ```
- Se aparecer o menu de comandos, está instalado corretamente

## 4. Autenticar e vincular projeto
- Rode:
  ```
  supabase login
  ```
  (Siga as instruções para obter o access token no painel do Supabase)
- Rode:
  ```
  supabase link --project-ref <SEU_PROJECT_REF>
  ```
  (O project ref pode ser encontrado na URL do painel do Supabase)

## 5. Aplicar migrations
- Rode:
  ```
  supabase db push
  ```
  (Confirme quando solicitado)

## 6. Rodar todos os seeds (.sql)

### ⚠️ IMPORTANTE: O comando `supabase db query` NÃO EXISTE

O método anterior **NÃO FUNCIONA** porque o comando `query` não existe na Supabase CLI.

### Solução Correta - Método Recomendado:

**Opção 1: Via SQL Editor do Supabase (Mais Confiável)**

1. Gerar arquivo consolidado:
   ```powershell
   .\run-seeds.ps1
   ```
   
2. Executar no SQL Editor:
   - Acesse: https://supabase.com/dashboard/project/tjduhugyqcaiygexpptp/sql/new
   - Abra o arquivo `supabase\seed.sql` gerado
   - Copie todo o conteúdo
   - Cole no SQL Editor
   - Clique em "Run"
   
3. Verificar:
   - Vá em Table Editor para ver os dados inseridos

**Opção 2: Via Supabase CLI (Pode ter problemas de encoding)**

```powershell
# Primeiro, configure o config.toml (já está feito)
# Depois execute:
supabase db push --include-seed --yes
```

**Nota**: Se encontrar erros de sintaxe SQL, use a Opção 1 (SQL Editor)

## Referência do comando `db` da Supabase CLI

O comando `supabase db` é utilizado para gerenciar o banco de dados Postgres do seu projeto. Veja abaixo os principais subcomandos e flags disponíveis:

### Uso
```
supabase db [comando]
```

### Comandos disponíveis
- **diff**: Compara o banco de dados local para identificar mudanças no esquema
- **dump**: Exporta dados ou esquemas do banco de dados remoto
- **lint**: Verifica erros de tipagem no banco de dados local
- **pull**: Puxa o esquema do banco de dados remoto
- **push**: Envia novas migrações para o banco de dados remoto
- **reset**: Reseta o banco de dados local para as migrações atuais
- **start**: Inicia o banco de dados Postgres local

### Flags comuns
- `-h, --help`: Mostra ajuda para o comando db

### Flags globais
- `--create-ticket`: Cria um ticket de suporte para qualquer erro da CLI
- `--debug`: Exibe logs de debug no stderr
- `--dns-resolver [ native | https ]`: Resolve nomes de domínio usando o resolvedor especificado (padrão native)
- `--experimental`: Habilita recursos experimentais
- `--network-id string`: Usa a rede docker especificada ao invés de uma gerada automaticamente
- `-o, --output [ env | pretty | json | toml | yaml ]`: Formato de saída das variáveis de status (padrão pretty)
- `--profile string`: Usa um perfil específico para conectar à API do Supabase (padrão "supabase")
- `--workdir string`: Caminho para o diretório do projeto Supabase
- `--yes`: Responde sim para todas as perguntas

Para mais informações sobre um comando:
```
supabase db [comando] --help
```

## Observações
- Você só precisa rodar `supabase login` e `supabase link` uma vez por projeto/instalação.
- Para rodar comandos de qualquer lugar, o supabase.exe precisa estar no PATH.
- Se precisar de mais detalhes ou exemplos, consulte https://supabase.com/docs/reference/cli/about ou peça mais instruções!
