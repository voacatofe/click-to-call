'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function DebugPage() {
  const [apiStatus, setApiStatus] = useState('Testando...');
  const [iceStatus, setIceStatus] = useState('Testando...');
  const [envVars, setEnvVars] = useState<Record<string, string | undefined>>({});

  // Carregar variáveis de ambiente do cliente
  useEffect(() => {
    setEnvVars({
      API_URL: process.env.NEXT_PUBLIC_API_URL,
      ASTERISK_HOST: process.env.NEXT_PUBLIC_ASTERISK_HOST,
      AGENT_PASSWORD: process.env.NEXT_PUBLIC_AGENT_PASSWORD,
      WEBSOCKET_PATH: process.env.NEXT_PUBLIC_WEBSOCKET_PATH,
    });
  }, []);

  // Testar API Health
  const testApiHealth = async () => {
    try {
      setApiStatus('Testando...');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${apiUrl}/api/health`);
      
      if (response.ok) {
        const data = await response.json();
        setApiStatus(`✅ API OK - ${data.service} v${data.version}`);
      } else {
        setApiStatus(`❌ API Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      setApiStatus(`❌ API Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  // Testar ICE Servers
  const testIceServers = async () => {
    try {
      setIceStatus('Testando...');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${apiUrl}/api/webrtc/ice-servers`);
      
      if (response.ok) {
        const data = await response.json();
        setIceStatus(`✅ ICE Servers OK - ${JSON.stringify(data, null, 2)}`);
      } else {
        setIceStatus(`❌ ICE Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      setIceStatus(`❌ ICE Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  // Auto-test ao carregar
  useEffect(() => {
    testApiHealth();
    testIceServers();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🔍 Debug - Ambiente Easypanel</h1>
        
        {/* Variáveis de Ambiente */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🌍 Variáveis de Ambiente</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(envVars).map(([key, value]) => (
              <div key={key} className="border-l-4 border-blue-500 pl-4">
                <div className="font-mono text-sm font-medium text-gray-700">{key}</div>
                <div className="font-mono text-xs text-gray-500 break-all">
                  {value || '❌ Não configurada'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status da API */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🏥 Status da API</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Health Check:</span>
              <Button onClick={testApiHealth} className="bg-blue-600 hover:bg-blue-700">
                🔄 Testar Again
              </Button>
            </div>
            <div className={`p-3 rounded font-mono text-sm ${
              apiStatus.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {apiStatus}
            </div>
          </div>
        </div>

        {/* Status ICE Servers */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🧊 ICE Servers (TURN/STUN)</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">WebRTC ICE Servers:</span>
              <Button onClick={testIceServers} className="bg-purple-600 hover:bg-purple-700">
                🔄 Testar Again
              </Button>
            </div>
            <div className={`p-3 rounded font-mono text-sm max-h-64 overflow-auto ${
              iceStatus.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <pre className="whitespace-pre-wrap">{iceStatus}</pre>
            </div>
          </div>
        </div>

        {/* URLs de Teste */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🔗 URLs para Teste Manual</h2>
          <div className="space-y-2">
            <div>
              <strong>API Health:</strong>{' '}
              <a 
                href={`${envVars.API_URL}/api/health`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-mono text-sm"
              >
                {envVars.API_URL}/api/health
              </a>
            </div>
            <div>
              <strong>ICE Servers:</strong>{' '}
              <a 
                href={`${envVars.API_URL}/api/webrtc/ice-servers`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-mono text-sm"
              >
                {envVars.API_URL}/api/webrtc/ice-servers
              </a>
            </div>
            <div>
              <strong>WebSocket WSS:</strong>{' '}
              <span className="font-mono text-sm text-gray-700">
                wss://{envVars.ASTERISK_HOST}:8089/ws
              </span>
            </div>
          </div>
        </div>

        {/* Botão para voltar */}
        <div className="text-center">
          <Button 
            onClick={() => window.location.href = '/'}
            className="bg-gray-600 hover:bg-gray-700"
          >
            ← Voltar para o Softphone
          </Button>
        </div>
      </div>
    </div>
  );
} 