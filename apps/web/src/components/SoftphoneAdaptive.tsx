'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import * as JsSIP from 'jssip';
import { Phone, PhoneOff, Mic, Ear } from 'lucide-react';

// Sistema de log baseado em environment - Next.js compatível
const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const logger = {
  debug: isDev ? console.log : () => {},
  info: console.info,
  error: console.error,
  warn: console.warn
};

const SoftphoneAdaptive = () => {
  const [status, setStatus] = useState('Desconectado');
  const [inCall, setInCall] = useState(false);
  const [session, setSession] = useState<any | null>(null); // Deixando o tipo mais flexível
  const uaRef = useRef<JsSIP.UA | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const [destination, setDestination] = useState('9999'); // Inicia com o teste de eco

  const agentId = process.env.NEXT_PUBLIC_AGENT_ID || 'agent-1001-wss'; // WSS-only endpoint
  const realm = process.env.NEXT_PUBLIC_ASTERISK_REALM || 'clicktocall.local';

  const connect = useCallback(async () => {
    try {
      setStatus('Obtendo config. de rede...');
      
      // 1. Busca os servidores ICE (STUN/TURN) do nosso backend
      const response = await fetch('/api/webrtc/ice-servers');
      if (!response.ok) {
        throw new Error(`Failed to fetch ICE servers: ${response.statusText}`);
      }
      const iceServers = await response.json();

      setStatus('Conectando...');

      // 2. Configura o JsSIP com as credenciais recebidas
      const host = process.env.NEXT_PUBLIC_ASTERISK_HOST;
      const websocketPath = process.env.NEXT_PUBLIC_WEBSOCKET_PATH || '/ws';
      const password = process.env.NEXT_PUBLIC_AGENT_PASSWORD;
      const agentId = process.env.NEXT_PUBLIC_AGENT_ID || 'agent-1001';
      const realm = process.env.NEXT_PUBLIC_ASTERISK_REALM || 'clicktocall.local';

      if (!host || !password) {
        throw new Error('Variáveis de ambiente do softphone não configuradas.');
      }
      
      const socket = new JsSIP.WebSocketInterface(`wss://${host}${websocketPath}`);
      
      const configuration = {
        sockets: [socket],
        uri: `sip:${agentId}@${realm}`,
        password: password,
        register: true,
        ice_servers: iceServers,
      };

      const ua = new JsSIP.UA(configuration);
      uaRef.current = ua;

      ua.on('registered', () => setStatus('Online'));
      ua.on('unregistered', () => setStatus('Desconectado'));
      ua.on('registrationFailed', (e) => setStatus(`Falha no Registro: ${e?.cause || 'Unknown'}`));
      
      ua.on('newRTCSession', (data: any) => {
        logger.debug('[WSS] Nova sessão RTC via WebSocket Secure');
        const session = data.session;
        setSession(session);

        session.on('peerconnection', (e: any) => {
          logger.debug('[WebRTC] PeerConnection criada via WSS');
          
          const pc = e.peerconnection;
          logger.debug('[WebRTC] Estado inicial da conexão WSS:', pc.connectionState);
          
          pc.addEventListener('connectionstatechange', () => {
            logger.debug('[WebRTC] Estado da conexão WSS:', pc.connectionState);
          });
          
          pc.addEventListener('iceconnectionstatechange', () => {
            logger.debug('[WebRTC] Estado ICE WSS:', pc.iceConnectionState);
          });

          pc.addEventListener('track', (event: any) => {
            logger.debug('[WebRTC] Track recebida via WSS');
            
            if (remoteAudioRef.current && event.streams[0]) {
              logger.debug('[WebRTC] Configurando áudio remoto WSS');
              remoteAudioRef.current.srcObject = event.streams[0];
              
              remoteAudioRef.current.play().then(() => {
                logger.debug('[WebRTC] Áudio WSS iniciado com sucesso');
              }).catch(err => {
                logger.error('[WebRTC] Erro ao reproduzir áudio WSS:', err);
              });
            }
          });
        });

        session.on('accepted', () => {
          logger.info('[WSS] Chamada aceita via WebSocket Secure');
          setStatus('Em chamada (WSS)');
          setInCall(true);
        });

        session.on('ended', () => {
          logger.info('[WSS] Chamada finalizada');
          setStatus('Registrado (WSS)');
          setInCall(false);
        });

        session.on('failed', (e: any) => {
          logger.error('[WSS] Chamada falhou:', e.cause || 'Unknown error');
          setStatus(`Chamada Falhou: ${e.cause || 'Error'}`);
          setInCall(false);
        });
      });

      ua.start();

    } catch (error) {
      console.error('Falha ao configurar ou iniciar o softphone:', error);
      setStatus(`Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    logger.debug('[DEBUG] Iniciando Softphone WSS-Only...');
    
    // Habilitar debug JsSIP apenas em desenvolvimento
    if (isDev) {
      JsSIP.debug.enable('JsSIP:*');
    }

    connect();

    return () => {
      if (uaRef.current && uaRef.current.isRegistered()) {
        uaRef.current.unregister();
      }
      if (uaRef.current) {
        uaRef.current.stop();
      }
    };
  }, [connect]);

  const handleCall = () => {
    if (uaRef.current && destination) {
      const options = {
        'mediaConstraints': { 'audio': true, 'video': false },
      };
      const session = uaRef.current.call(`sip:${destination}@${process.env.NEXT_PUBLIC_ASTERISK_REALM}`, options);
      setSession(session);
    }
  };

  const handleHangup = () => {
    if (session) {
      logger.debug('[WSS] Finalizando chamada');
      session.terminate();
    }
  };

  const handleForceAudioPlay = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.play().catch(logger.error);
      logger.debug('[DEBUG] Tentando ativar áudio WSS');
    }
  };

  const getStatusColor = () => {
    if (status.includes('Online')) return 'text-green-600';
    if (status.includes('Falha') || status.includes('Erro')) return 'text-red-600';
    if (status.includes('Em chamada')) return 'text-blue-600';
    return 'text-gray-600';
  };

  return (
    <div className="p-4 border rounded-lg shadow-md max-w-sm mx-auto">
      <h3 className="text-lg font-semibold text-center mb-2">Softphone</h3>
      <div className="text-center mb-4">
        <p>Status: <span className={getStatusColor()}>{status}</span></p>
      </div>
      <div className="flex flex-col gap-2">
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Digite o número"
          className="p-2 border rounded"
        />
        <div className="flex gap-2">
          <button
            onClick={handleCall}
            disabled={inCall || status !== 'Online'}
            className="flex-1 bg-green-500 text-white p-2 rounded disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            <Phone size={18} /> Ligar
          </button>
          <button
            onClick={handleHangup}
            disabled={!inCall}
            className="flex-1 bg-red-500 text-white p-2 rounded disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            <PhoneOff size={18} /> Desligar
          </button>
        </div>
      </div>
      <audio ref={remoteAudioRef} />
    </div>
  );
};

export default SoftphoneAdaptive; 