-- Add missing storage and URL fields for uploaded PDF candidates, plus worker helper functions.
ALTER TABLE public.pdf_candidates
  ADD COLUMN IF NOT EXISTS file_url text,
  ADD COLUMN IF NOT EXISTS storage_path text;

CREATE OR REPLACE FUNCTION public.incrementar_batch_processado(p_candidate_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_batch_id uuid;
  v_total int;
  v_processados int;
BEGIN
  SELECT batch_id INTO v_batch_id FROM pdf_candidates WHERE id = p_candidate_id;
  IF v_batch_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE pdf_batches
  SET processed_files = processed_files + 1
  WHERE id = v_batch_id
  RETURNING total_files, processed_files INTO v_total, v_processados;

  IF v_processados >= v_total THEN
    UPDATE pdf_batches SET status = 'concluido' WHERE id = v_batch_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.incrementar_creditos_pdf(p_empresa_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  UPDATE empresas SET creditos_pdfs_usados = creditos_pdfs_usados + 1
  WHERE id = p_empresa_id;
END;
$$;

ALTER TABLE public.candidate_evaluations
  DROP CONSTRAINT IF EXISTS candidate_evaluations_candidate_id_criteria_id_key;
ALTER TABLE public.candidate_evaluations
  ADD CONSTRAINT candidate_evaluations_candidate_id_criteria_id_key
  UNIQUE (candidate_id, criteria_id);
