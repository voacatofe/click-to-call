-- Remove colunas do Twilio da tabela 'companies'
ALTER TABLE public.companies
DROP COLUMN IF EXISTS twilio_account_sid,
DROP COLUMN IF EXISTS twilio_auth_token;

-- Altera a tabela 'calls' para a estrutura do Asterisk
ALTER TABLE public.calls
RENAME COLUMN twilio_call_sid TO asterisk_unique_id;

-- Adiciona a coluna para o ID do agente que atendeu/realizou a chamada
ALTER TABLE public.calls
ADD COLUMN agent_id VARCHAR(255); 