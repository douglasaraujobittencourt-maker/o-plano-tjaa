# Ativar Foto pessoal no serviço atual

O planner já usa Foto pessoal em Configurações e mostra o avatar no perfil do menu e no cabeçalho móvel. O gerenciamento de logos de concursos não aparece mais em Configurações; as logos salvas e suas exibições continuam preservadas.

Esta configuração deve ser aplicada no projeto atual pelo proprietário. Não foi criado outro serviço nem confirmado acesso ao armazenamento real.

## 1. Criar ou reutilizar o bucket

Na área Storage do serviço atual, crie um bucket **público** chamado `avatars`, limite de **5 MB**, formatos `image/png`, `image/jpeg` e `image/webp`. Se já existir, reutilize-o com essas opções. Cada arquivo fica na pasta do usuário: `<user_id>/<identificador único>.<extensão>`.

Alternativa pela API Storage, somente no terminal do proprietário, com a URL e a chave administrativa em variáveis de ambiente (nunca no código do planner):

```sh
curl --fail-with-body --request POST "$SUPABASE_URL/storage/v1/bucket" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  --data '{"id":"avatars","name":"avatars","public":true,"file_size_limit":5242880,"allowed_mime_types":["image/png","image/jpeg","image/webp"]}'
```

Para atualizar um bucket existente, use `PUT /storage/v1/bucket/avatars` com as mesmas opções. Não crie ou altere buckets por SQL. Por ser público, qualquer pessoa com a URL pode visualizar a foto; envio, listagem, alteração e exclusão ficam restritos à pasta do dono.

## 2. Aplicar as políticas e a coluna de perfil

Execute **personal-avatars-setup.sql** no editor SQL do mesmo serviço. Use este script complementar em vez de executar a migração antiga de fotos, pois a configuração do bucket deve passar pela API Storage.

O script acrescenta `profiles.avatar_url` e políticas de acesso por usuário, sem apagar dados nem modificar os campos `exam_logo_url` e `exam_logo_bb_url` ou o bucket de logos. Revise políticas antigas: políticas permissivas existentes não são removidas e podem ampliar o acesso além das novas restrições.

## 3. Conferir na sua conta

Abra Configurações, envie PNG/JPG/WEBP e confira a foto circular no perfil. Recarregue para confirmar a persistência, altere a foto e teste a remoção: as iniciais devem reaparecer e todas as logos devem continuar iguais. A troca salva primeiro a URL nova e só depois exclui a foto anterior da pasta do dono.

Se a configuração não estiver ativa, o planner informa o erro e não substitui a foto salva. O fluxo na conta real ainda precisa ser validado após aplicar a configuração.