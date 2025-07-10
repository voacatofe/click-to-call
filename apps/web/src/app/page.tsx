'use client';

import { useState } from 'react';
import { SimpleSoftphone } from '@/components/SimpleSoftphone';
import { Button } from '@/components/ui/Button';

export default function Home() {
  const [showSoftphone, setShowSoftphone] = useState(false);

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
            <SimpleSoftphone />
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
