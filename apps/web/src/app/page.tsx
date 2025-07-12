'use client';

import { useState, useEffect } from 'react';
import { Softphone } from '@/components/Softphone';
import { Button } from '@/components/ui/Button';
import { getApiUrl } from '@/lib/api'; // Importa a função para construir URLs da API

export default function Home() {
  const [showSoftphone, setShowSoftphone] = useState(false);
  const [agentId, setAgentId] = useState<string>('');
  const [agentPassword, setAgentPassword] = useState<string>();
  const [error, setError] = useState<string | null>(null);

  const fetchAgentCredentials = async () => {
    try {
      const response = await fetch(getApiUrl('/webrtc/credentials'));
      if (response.ok) {
        const data = await response.json();
        setAgentId(data.agentId);
        setAgentPassword(data.password);
      } else {
        setError('Falha ao buscar credenciais do WebRTC.');
        console.error('Failed to fetch credentials:', response.statusText);
      }
    } catch (err) {
      setError('Erro ao conectar com a API para buscar credenciais.');
      console.error(err);
    }
  };

  // Busca as credenciais quando o usuário decide mostrar o softphone
  useEffect(() => {
    if (showSoftphone) {
      fetchAgentCredentials();
    }
  }, [showSoftphone]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Click-to-Call System
          </h1>
          <p className="text-xl text-gray-600">
            Sistema de chamadas profissional com Asterisk e WebRTC
          </p>
        </div>

        {/* Actions */}
        <div className="text-center mb-8">
          {!showSoftphone ? (
            <Button 
              onClick={() => setShowSoftphone(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg transition-all transform hover:scale-105"
            >
              🎯 Iniciar Softphone
            </Button>
          ) : (
            <Button 
              onClick={() => setShowSoftphone(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg transition-all"
            >
              ❌ Fechar Softphone
            </Button>
          )}
        </div>

        {/* Softphone Area */}
        {showSoftphone && (
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl mx-auto">
            {error ? (
              <div className="text-red-600 text-center">{error}</div>
            ) : (
              <Softphone agentId={agentId} agentPassword={agentPassword} />
            )}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-16 text-center text-gray-500 text-sm">
          <p>🔐 Conexão segura via WebSocket (WSS)</p>
          <p>Desenvolvido para ambientes profissionais</p>
        </div>
      </div>
    </div>
  );
}
