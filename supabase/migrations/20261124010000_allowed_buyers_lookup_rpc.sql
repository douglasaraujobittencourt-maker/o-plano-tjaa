-- Consulta limitada de autorização de compra para a tela de primeiro acesso.
-- Não concede SELECT na tabela de compradores ao navegador.
CREATE OR REPLACE FUNCTION public.is_allowed_buyer(p_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.allowed_buyers AS buyer
    WHERE lower(btrim(buyer.email)) = lower(btrim(p_email))
  );
$$;

REVOKE ALL ON FUNCTION public.is_allowed_buyer(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_allowed_buyer(text) TO anon, authenticated;
