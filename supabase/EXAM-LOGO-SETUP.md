# Ativar logos no serviço atual

As telas estão preparadas; esta configuração precisa ser aplicada pelo proprietário no mesmo projeto que já contém os usuários e estudos. Nenhum serviço novo foi criado e este SQL ainda não foi aplicado.

1. Crie um bucket público chamado `logos-concursos` pela API de Storage do projeto atual. Exemplo para executar **somente no seu terminal**, com URL e chave administrativa em variáveis de ambiente (nunca no código do app):

```sh
curl --fail-with-body "$SUPABASE_URL/storage/v1/bucket" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  --data '{"id":"logos-concursos","name":"logos-concursos","public":true,"allowed_mime_types":["image/png","image/jpeg","image/webp"]}'
```

Se já existir, use a API `PUT /storage/v1/bucket/logos-concursos` com as mesmas opções. O bucket é público: qualquer pessoa com a URL poderá ver a logo. Upload e exclusão são restritos ao dono da pasta.

2. Execute `exam-logo-profile-setup.sql` no editor SQL desse mesmo projeto. Revise políticas antigas de `profiles` e `storage.objects`: políticas permissivas pré-existentes não são removidas por este arquivo e devem continuar limitando cada usuário aos próprios dados.
3. Atualize os tipos gerados a partir do esquema real quando a integração estiver conectada.
4. Entre no planner, abra Configurações, selecione PNG/JPG/WEBP, confira a prévia e salve. Recarregue a página e confirme a logo ao lado do concurso na visão geral; teste alterar e remover.

Sem essa configuração, a tentativa de salvar informa um erro e preserva a logo anterior. Não há confirmação de upload real até esses passos serem concluídos.