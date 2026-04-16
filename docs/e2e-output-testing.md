# E2E Output Testing

Este roteiro cobre o fluxo minimo para validar o produto de ponta a ponta antes de evoluir a camada de UI.

## Pre-requisitos

- dependencias instaladas com `npm install`
- migrations aplicadas e banco acessivel
- sessao autenticada ativa no navegador via Supabase
- app rodando com `npm run dev`

## Meta do teste

Validar que um usuario autenticado consegue:

1. criar ou importar um curriculo
2. gerar uma versao derivada ou adaptada
3. publicar saidas `ATS` e `Visual`
4. abrir preview completo
5. baixar artefatos `HTML` e `JSON`

## Sequencia recomendada

### 1. Entrar na biblioteca

- abrir `http://localhost:3000/resumes`
- confirmar que a biblioteca carrega sem erro de autenticacao

Esperado:
- lista de curriculos do usuario
- CTA para criar/importar novo curriculo

### 2. Criar ou importar um curriculo

- abrir `http://localhost:3000/resumes/new`
- escolher um destes caminhos:
  - criacao manual
  - importacao por arquivo
  - importacao por texto
  - importacao por link

Esperado:
- curriculo salvo
- redirecionamento ou navegacao possivel para o detalhe do curriculo

### 3. Validar o detalhe do curriculo

- abrir `/resumes/[id]`
- confirmar:
  - snapshot atual carregado
  - historico de versoes visivel
  - bloco `Publicacao e saidas`
  - link `Abrir central de saidas`

### 4. Validar adaptacao por vaga

- abrir `/resumes/[id]/tailor`
- preencher vaga e descritivo
- salvar a analise
- se quiser, salvar nova `ResumeVersion`

Esperado:
- ATS/Fit visiveis
- analise persistida
- versao nova aparece no detalhe do curriculo

### 5. Validar central de saidas

- abrir `/resumes/[id]/outputs`
- trocar a versao de origem no seletor
- gerar `ATS`
- gerar `Visual`

Esperado:
- feedback de sucesso por tipo de saida
- preview completo de cada saida
- identificacao da versao de origem

### 6. Validar downloads

- clicar em `Baixar HTML`
- clicar em `Baixar JSON` quando disponivel

Esperado:
- arquivo com nome padronizado por tipo e versao
- HTML abre no navegador
- JSON contem payload persistido da saida

## Checklist de aceite

- biblioteca autenticada carrega
- criacao/importacao funciona
- versao do curriculo aparece no historico
- central de saidas abre
- selecao de versao funciona
- `ATS` gera sem erro
- `Visual` gera sem erro
- preview completo aparece
- download HTML funciona
- download JSON funciona

## Falhas que merecem atencao imediata

- erro `401` com usuario autenticado
- curriculo salvo sem aparecer na biblioteca
- saida gerada para versao errada
- preview vazio com `outputRender` persistido
- download quebrado ou com arquivo corrompido
