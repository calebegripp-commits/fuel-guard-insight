
-- Create veiculos table
CREATE TABLE public.veiculos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  placa TEXT NOT NULL UNIQUE,
  modelo TEXT NOT NULL,
  capacidade_tanque NUMERIC NOT NULL DEFAULT 0,
  contrato TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create abastecimentos table
CREATE TABLE public.abastecimentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
  placa_original TEXT NOT NULL,
  placa_validada TEXT REFERENCES public.veiculos(placa),
  litros NUMERIC NOT NULL,
  valor_total NUMERIC NOT NULL,
  posto TEXT,
  motorista TEXT,
  km_odometro NUMERIC,
  status_auditoria TEXT NOT NULL DEFAULT 'PENDENTE',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rastreamento table
CREATE TABLE public.rastreamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  placa TEXT NOT NULL REFERENCES public.veiculos(placa),
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  ignicao BOOLEAN DEFAULT false,
  velocidade NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_abastecimentos_placa_validada ON public.abastecimentos(placa_validada);
CREATE INDEX idx_abastecimentos_data_hora ON public.abastecimentos(data_hora);
CREATE INDEX idx_rastreamento_placa ON public.rastreamento(placa);
CREATE INDEX idx_rastreamento_data_hora ON public.rastreamento(data_hora);
CREATE INDEX idx_rastreamento_placa_data ON public.rastreamento(placa, data_hora);

-- Enable RLS
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abastecimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rastreamento ENABLE ROW LEVEL SECURITY;

-- Public access policies
CREATE POLICY "Allow public read veiculos" ON public.veiculos FOR SELECT USING (true);
CREATE POLICY "Allow public insert veiculos" ON public.veiculos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read abastecimentos" ON public.abastecimentos FOR SELECT USING (true);
CREATE POLICY "Allow public insert abastecimentos" ON public.abastecimentos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read rastreamento" ON public.rastreamento FOR SELECT USING (true);
CREATE POLICY "Allow public insert rastreamento" ON public.rastreamento FOR INSERT WITH CHECK (true);
