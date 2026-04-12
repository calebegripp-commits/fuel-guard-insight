-- Allow public update on relacao_frota
CREATE POLICY "Allow public update relacao_frota"
ON public.relacao_frota
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow public delete on relacao_frota
CREATE POLICY "Allow public delete relacao_frota"
ON public.relacao_frota
FOR DELETE
USING (true);