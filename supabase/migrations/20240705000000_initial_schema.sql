-- Tabela de Configurações da Empresa
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rdcrm_token TEXT, -- Idealmente, deve ser criptografado na aplicação antes de salvar
  twilio_account_sid TEXT,
  twilio_auth_token TEXT, -- Criptografado na aplicação
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Chamadas
CREATE TABLE calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  twilio_call_sid TEXT UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  from_number TEXT,
  to_number TEXT,
  status TEXT,
  direction TEXT,
  duration INT,
  recording_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS (Row-Level Security) para as tabelas
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY; 