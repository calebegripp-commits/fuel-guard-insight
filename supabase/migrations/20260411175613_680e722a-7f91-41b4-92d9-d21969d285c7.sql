
-- Tabela rastreador_bruto
CREATE TABLE public.rastreador_bruto (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  area_rota TEXT,
  unidade_rastreada TEXT NOT NULL,
  modelo_extraido TEXT,
  placa_extraida TEXT,
  data_inicial_timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.rastreador_bruto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read rastreador_bruto" ON public.rastreador_bruto FOR SELECT USING (true);
CREATE POLICY "Allow public insert rastreador_bruto" ON public.rastreador_bruto FOR INSERT WITH CHECK (true);

-- Função para extrair modelo e placa da unidade_rastreada
CREATE OR REPLACE FUNCTION public.extrair_modelo_placa()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.unidade_rastreada IS NOT NULL AND length(trim(NEW.unidade_rastreada)) >= 7 THEN
    NEW.placa_extraida := upper(replace(right(trim(NEW.unidade_rastreada), 7), ' ', ''));
    NEW.modelo_extraido := trim(left(trim(NEW.unidade_rastreada), greatest(length(trim(NEW.unidade_rastreada)) - 7, 0)));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_extrair_modelo_placa
BEFORE INSERT OR UPDATE ON public.rastreador_bruto
FOR EACH ROW
EXECUTE FUNCTION public.extrair_modelo_placa();

-- Índice para buscas por placa
CREATE INDEX idx_rastreador_bruto_placa ON public.rastreador_bruto(placa_extraida);

-- Tabela relacao_frota
CREATE TABLE public.relacao_frota (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  placa TEXT NOT NULL,
  modelo TEXT,
  responsavel_local TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.relacao_frota ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read relacao_frota" ON public.relacao_frota FOR SELECT USING (true);
CREATE POLICY "Allow public insert relacao_frota" ON public.relacao_frota FOR INSERT WITH CHECK (true);

CREATE INDEX idx_relacao_frota_placa ON public.relacao_frota(placa);

-- Tabela historico_consumo
CREATE TABLE public.historico_consumo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data_hora TIMESTAMP WITH TIME ZONE,
  placa TEXT,
  motorista TEXT,
  km_anterior NUMERIC,
  km_rodado NUMERIC,
  km_litro NUMERIC,
  quantidade_total NUMERIC,
  preco_unitario NUMERIC,
  valor_venda NUMERIC,
  produto TEXT,
  posto TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.historico_consumo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read historico_consumo" ON public.historico_consumo FOR SELECT USING (true);
CREATE POLICY "Allow public insert historico_consumo" ON public.historico_consumo FOR INSERT WITH CHECK (true);

CREATE INDEX idx_historico_consumo_placa ON public.historico_consumo(placa);
CREATE INDEX idx_historico_consumo_data ON public.historico_consumo(data_hora);
