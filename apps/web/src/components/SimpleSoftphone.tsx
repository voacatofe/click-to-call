'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import * as JsSIP from 'jssip';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const SimpleSoftphone = () => {
  const [status, setStatus] = useState('Desconectado');
  const [phoneNumber, setPhoneNumber] = useState('9999'); // Teste de eco por padrão
  const [inCall, setInCall] = useState(false);
  const [callStatus, setCallStatus] = useState('');
  
  const uaRef = useRef<JsSIP.UA | null>(null);
  const sessionRef = useRef<any>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  // Conectar ao Asterisk
  const connect = useCallback(async () => {
    try {
      setStatus('Obtendo configurações...');
      
      // 1. Buscar servidores ICE do backend (produção)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const iceResponse = await fetch(`${apiUrl}/api/webrtc/ice-servers`);
      if (!iceResponse.ok) {
        throw new Error(`Erro ao obter servidores ICE: ${iceResponse.statusText}`);
      }
      const iceServers = await iceResponse.json();
      console.log('ICE Servers obtidos:', iceServers);

      setStatus('Conectando...');

      // 2. Configurar conexão para produção
      const host = process.env.NEXT_PUBLIC_ASTERISK_HOST;
      const websocketPath = process.env.NEXT_PUBLIC_WEBSOCKET_PATH || '/ws';
      const password = process.env.NEXT_PUBLIC_AGENT_PASSWORD;
      const agentId = 'agent-1001';
      const realm = 'clicktocall.local';

      if (!host || !password) {
        throw new Error('Configurações do softphone não encontradas no ambiente.');
      }
      
      // Forçar o uso de WSS para ambiente de produção seguro
      const wssUrl = `wss://${host}:8089${websocketPath}`;
      console.log('Conectando para:', wssUrl);
      
      const socket = new JsSIP.WebSocketInterface(wssUrl);
      
      const configuration = {
        sockets: [socket],
        uri: `sip:${agentId}@${realm}`,
        password: password,
        register: true,
        ice_servers: iceServers,
        register_expires: 300,
        // Configurações adicionais para produção
        session_timers: false,
        use_preloaded_route: false,
      };

      console.log('Configuração JsSIP:', configuration);

      const ua = new JsSIP.UA(configuration);
      uaRef.current = ua;

      // Eventos de conexão
      ua.on('registered', () => {
        console.log('✅ Registrado com sucesso no Asterisk');
        setStatus('✅ Conectado');
      });
      
      ua.on('unregistered', () => {
        console.log('❌ Desregistrado do Asterisk');
        setStatus('❌ Desconectado');
      });
      
      ua.on('registrationFailed', (e: any) => {
        console.error('❌ Falha no registro:', e);
        setStatus(`❌ Falha: ${e?.cause || 'Erro desconhecido'}`);
      });

      // Eventos de chamada
      ua.on('newRTCSession', (e: any) => {
        console.log('📞 Nova sessão RTC:', e);
        const session = e.session;
        sessionRef.current = session;

        if (session.direction === 'incoming') {
          setCallStatus('📞 Chamada recebida');
          setInCall(true);
        }

        session.on('accepted', () => {
          console.log('📞 Chamada aceita');
          setCallStatus('📞 Em chamada');
          setInCall(true);
        });

        session.on('ended', () => {
          console.log('📞 Chamada terminada');
          setCallStatus('');
          setInCall(false);
          sessionRef.current = null;
        });

        session.on('failed', (e: any) => {
          console.error('❌ Chamada falhou:', e);
          setCallStatus('❌ Chamada falhou');
          setInCall(false);
          sessionRef.current = null;
        });

        // Configurar áudio
        session.on('addstream', (e: any) => {
          console.log('🔊 Stream de áudio adicionado:', e);
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = e.stream;
            remoteAudioRef.current.play();
          }
        });
      });

      // Eventos de debugging
      ua.on('connecting', () => {
        console.log('🔄 Conectando...');
        setStatus('🔄 Conectando...');
      });

      ua.on('connected', () => {
        console.log('🔗 WebSocket conectado');
        setStatus('🔗 WebSocket conectado');
      });

      ua.on('disconnected', (e: any) => {
        console.error('🔌 WebSocket desconectado:', e);
        setStatus('🔌 Desconectado');
      });

      ua.start();

    } catch (error) {
      console.error('Erro na conexão:', error);
      setStatus(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }, []);

  // Desconectar
  const disconnect = useCallback(() => {
    if (uaRef.current) {
      uaRef.current.stop();
      uaRef.current = null;
    }
    setStatus('❌ Desconectado');
    setInCall(false);
    setCallStatus('');
  }, []);

  // Fazer chamada
  const makeCall = useCallback(() => {
    if (!uaRef.current || !phoneNumber.trim()) return;

    try {
      console.log(`📞 Fazendo chamada para: ${phoneNumber}`);
      const session = uaRef.current.call(phoneNumber, {
        mediaConstraints: { audio: true, video: false },
        rtcOfferConstraints: { offerToReceiveAudio: true, offerToReceiveVideo: false }
      });
      sessionRef.current = session;
      setCallStatus('📞 Chamando...');
    } catch (error) {
      console.error('Erro ao fazer chamada:', error);
      setCallStatus('❌ Erro na chamada');
    }
  }, [phoneNumber]);

  // Desligar chamada
  const hangup = useCallback(() => {
    if (sessionRef.current) {
      console.log('📞 Desligando chamada');
      sessionRef.current.terminate();
    }
  }, []);

  // Auto-conectar quando componente carrega
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Softphone</h2>
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            status.includes('✅') ? 'bg-green-100 text-green-800' : 
            status.includes('🔄') || status.includes('🔗') ? 'bg-blue-100 text-blue-800' : 
            'bg-red-100 text-red-800'
          }`}>
            {status}
          </span>
        </div>
      </div>

      {/* Debug Info para Produção */}
      <div className="bg-gray-100 p-3 rounded text-xs">
        <div><strong>Host:</strong> {process.env.NEXT_PUBLIC_ASTERISK_HOST}</div>
        <div><strong>API:</strong> {process.env.NEXT_PUBLIC_API_URL}</div>
        <div><strong>WS:</strong> wss://{process.env.NEXT_PUBLIC_ASTERISK_HOST}:8089/ws (seguro)</div>
      </div>

      {/* Área de Chamada */}
      {status.includes('✅') && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="space-y-4">
            {/* Status da Chamada */}
            {callStatus && (
              <div className="text-center p-3 bg-blue-100 text-blue-800 rounded-lg font-medium">
                {callStatus}
              </div>
            )}

            {/* Input do Número */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número para ligar:
              </label>
              <Input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ex: 9999 (teste de eco)"
                className="text-center text-lg"
                disabled={inCall}
              />
              <p className="text-xs text-gray-500 mt-1 text-center">
                💡 Dica: Use 9999 para teste de eco ou 8888 para teste de som
              </p>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-3 justify-center">
              {!inCall ? (
                <Button
                  onClick={makeCall}
                  disabled={!phoneNumber.trim()}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                >
                  📞 Ligar
                </Button>
              ) : (
                <Button
                  onClick={hangup}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                >
                  📞 Desligar
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Botões de Conexão */}
      <div className="flex gap-3 justify-center">
        <Button
          onClick={connect}
          disabled={status.includes('✅') || status.includes('🔄')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          🔌 Conectar
        </Button>
        <Button
          onClick={disconnect}
          disabled={!status.includes('✅') && !status.includes('🔄')}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
        >
          🔌 Desconectar
        </Button>
      </div>

      {/* Áudio elemento (hidden) */}
      <audio 
        ref={remoteAudioRef} 
        autoPlay 
        style={{ display: 'none' }}
      />
    </div>
  );
}; 