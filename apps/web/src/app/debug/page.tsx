'use client';

import React from 'react';

// Componente para exibir o status de uma variável de ambiente
const EnvVarStatus = ({ name, value }: { name: string; value: string | undefined }) => {
  const isConfigured = value && value !== 'your-secure-agent-password-here';
  
  return (
    <div className="flex items-center justify-between p-2 border-b">
      <span className="font-mono text-sm text-gray-600">{name}</span>
      {isConfigured ? (
        <span className="px-2 py-1 text-xs font-bold text-green-800 bg-green-200 rounded-full">
          {name.includes('PASSWORD') ? '••••••••' : value}
        </span>
      ) : (
        <span className="px-2 py-1 text-xs font-bold text-red-800 bg-red-200 rounded-full">
          ✖ Não configurada
        </span>
      )}
    </div>
  );
};

// Componente para testar um endpoint e mostrar o status
const HealthCheck = ({ title, url, testName }: { title: string; url: string; testName: string }) => {
  const [status, setStatus] = React.useState<{ ok: boolean; message: string }>({ ok: false, message: 'Aguardando teste...' });

  const runTest = async () => {
    setStatus({ ok: false, message: 'Testando...' });
    try {
      // Usa a URL relativa diretamente no fetch
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setStatus({ ok: true, message: `${testName} OK - ${JSON.stringify(data)}` });
      } else {
        throw new Error(data.error || `Erro ${response.status}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setStatus({ ok: false, message: `Falha no teste: ${errorMessage}` });
    }
  };

  React.useEffect(() => {
    runTest();
  }, [url]);

  return (
    <div className="p-4 bg-white border rounded-lg shadow-sm">
      <h3 className="mb-2 text-lg font-semibold text-gray-700">{title}</h3>
      <div className={`p-3 rounded-md ${status.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        <p className="text-sm font-medium">{status.message}</p>
      </div>
      <button 
        onClick={runTest}
        className="w-full px-4 py-2 mt-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Testar Novamente
      </button>
    </div>
  );
};


const DebugPage = () => {
  // Remove a dependência da variável de ambiente NEXT_PUBLIC_API_URL
  const agentPassword = process.env.NEXT_PUBLIC_AGENT_PASSWORD;
  const easypanelHost = process.env.NEXT_PUBLIC_EASYPANEL_HOST;
  const websocketPath = process.env.NEXT_PUBLIC_WEBSOCKET_PATH;
  const realm = process.env.NEXT_PUBLIC_ASTERISK_REALM;

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="mb-4 text-4xl font-bold text-center text-gray-800">Debug - Ambiente EasyPanel</h1>
        <p className="mb-8 text-lg text-center text-gray-600">
          Página de diagnóstico para verificar a saúde e configuração do ambiente de produção.
        </p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Coluna de Variáveis de Ambiente */}
          <div className="p-4 bg-white border rounded-lg shadow-sm">
            <h3 className="mb-3 text-lg font-semibold text-gray-700">🌏 Variáveis de Ambiente (Frontend)</h3>
            <div className="space-y-2">
              {/* Removida a exibição de NEXT_PUBLIC_API_URL pois agora é implícita */}
              <EnvVarStatus name="NEXT_PUBLIC_AGENT_PASSWORD" value={agentPassword} />
              <EnvVarStatus name="NEXT_PUBLIC_EASYPANEL_HOST" value={easypanelHost} />
              <EnvVarStatus name="NEXT_PUBLIC_WEBSOCKET_PATH" value={websocketPath} />
              <EnvVarStatus name="NEXT_PUBLIC_ASTERISK_REALM" value={realm} />
            </div>
          </div>
          
          {/* Coluna de Health Checks */}
          <div className="space-y-6">
            <HealthCheck 
              title="📡 Status da API"
              url="/api/health" // URL relativa
              testName="API"
            />
            <HealthCheck
              title="🧊 ICE Servers (TURN/STUN)"
              url="/api/webrtc/ice-servers" // URL relativa
              testName="ICE"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPage; 