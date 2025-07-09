'use client';

import React, { useEffect, useState, useRef } from 'react';
import * as JsSIP from 'jssip';

// Sistema de log baseado em environment - Next.js compatível
const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const logger = {
  debug: isDev ? console.log : () => {},
  info: console.info,
  error: console.error,
  warn: console.warn
};

export const SoftphoneAdaptive = () => {
  const [status, setStatus] = useState('Desconectado');
  const [inCall, setInCall] = useState(false);
  const uaRef = useRef<JsSIP.UA | null>(null);
  const sessionRef = useRef<any>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const agentId = 'agent-1001-wss'; // WSS-only endpoint

  // Configuração WSS-only (OBRIGATÓRIO para HTTPS)
  const createUA = (): JsSIP.UA => {
    const host = process.env.NEXT_PUBLIC_ASTERISK_HOST || 'localhost';
    const wssPort = process.env.NEXT_PUBLIC_ASTERISK_WSS_PORT || '8089';
    
    // FORÇAR WSS para segurança - nunca WS em ambiente HTTPS
    const wsUrl = `wss://${host}:${wssPort}/ws`;
    
    logger.debug(`[WSS-ONLY] Criando UA com configuração segura:`, {
      protocol: 'wss (FORCED)',
      port: wssPort,
      endpoint: agentId,
      url: wsUrl,
      security: 'ENCRYPTED'
    });

    const socket = new JsSIP.WebSocketInterface(wsUrl);
    
    const configuration = {
      sockets: [socket],
      uri: `sip:${agentId}@clicktocall.local`,
      password: process.env.NEXT_PUBLIC_AGENT_PASSWORD || 'changeme',
      register: true
    };

    return new JsSIP.UA(configuration);
  };

  const setupUA = (ua: JsSIP.UA) => {
    ua.on('registered', () => {
      logger.info('[WSS] Registrado com sucesso via WebSocket Secure');
      setStatus('Registrado (WSS)');
    });

    ua.on('unregistered', () => {
      logger.debug('[WSS] Não registrado');
      setStatus('Não Registrado');
    });

    ua.on('registrationFailed', (e: any) => {
      logger.error('[WSS] Falha no registro WSS:', e.cause || 'Unknown error');
      setStatus(`Falha WSS: ${e.cause || 'Connection error'}`);
    });

    ua.on('newRTCSession', (data: any) => {
      logger.debug('[WSS] Nova sessão RTC via WebSocket Secure');
      const session = data.session;
      sessionRef.current = session;

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
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    logger.debug('[DEBUG] Iniciando Softphone WSS-Only...');
    
    // Habilitar debug JsSIP apenas em desenvolvimento
    if (isDev) {
      JsSIP.debug.enable('JsSIP:*');
    }

    try {
      const ua = createUA();
      setupUA(ua);
      uaRef.current = ua;
      ua.start();

      return () => {
        if (ua.isRegistered()) {
          ua.unregister();
        }
        ua.stop();
      };
    } catch (error) {
      logger.error('[DEBUG] Erro ao iniciar Softphone WSS:', error);
      setStatus('Erro ao iniciar WSS');
    }
  }, []);

  const handleCall = (destination: string) => {
    if (uaRef.current) {
      logger.debug(`[WSS] Iniciando chamada para ${destination} via WebSocket Secure`);
      
      const options = {
        event_handlers: {
          progress: (e: any) => {
            logger.debug('[WSS] Progresso da chamada');
            setStatus('Chamando...');
          },
          failed: (e: any) => {
            logger.error('[WSS] Chamada falhou:', e.cause || 'Unknown error');
            setStatus(`Falhou: ${e.cause || 'Error'}`);
          },
          ended: (e: any) => {
            logger.debug('[WSS] Chamada finalizada');
            setStatus('Finalizada');
          },
          accepted: (e: any) => {
            logger.info('[WSS] Chamada aceita');
            setStatus('Em chamada');
          },
        },
        mediaConstraints: { audio: true, video: false },
      };
      
      uaRef.current.call(`sip:${destination}@clicktocall.local`, options);
    }
  };

  const handleHangup = () => {
    if (sessionRef.current) {
      logger.debug('[WSS] Finalizando chamada');
      sessionRef.current.terminate();
    }
  };

  const handleForceAudioPlay = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.play().catch(logger.error);
      logger.debug('[DEBUG] Tentando ativar áudio WSS');
    }
  };

  const getStatusColor = () => {
    if (status.includes('Registrado')) return 'text-green-600';
    if (status.includes('Falha') || status.includes('Erro')) return 'text-red-600';
    if (status.includes('Em chamada')) return 'text-blue-600';
    return 'text-gray-600';
  };

  return (
    <div className="p-4 border rounded-lg shadow-md">
      <h2 className="text-lg font-bold">Softphone WSS-Only</h2>
      <p>Status: <span className={`font-semibold ${getStatusColor()}`}>{status}</span></p>
      
      <div className="mt-2 text-sm text-gray-600">
        <p>Protocolo: <strong>WSS (WebSocket Secure)</strong></p>
        <p>Porta: <strong>8089</strong></p>
        <p>Endpoint: <strong>{agentId}</strong></p>
        <p>🔒 <strong>Conexão Segura</strong></p>
      </div>

      <div className="mt-4 space-x-2">
        <button
          onClick={() => {
            handleForceAudioPlay();
            handleCall('9999');
          }}
          disabled={inCall}
          className="px-4 py-2 font-bold text-white bg-green-500 rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          🔒 Teste Echo WSS (9999)
        </button>
        
        <button
          onClick={() => {
            handleForceAudioPlay();
            handleCall('8888');
          }}
          disabled={inCall}
          className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          🔒 Teste Playback WSS (8888)
        </button>
        
        <button
          onClick={handleHangup}
          disabled={!inCall}
          className="px-4 py-2 font-bold text-white bg-red-500 rounded hover:bg-red-700 disabled:bg-gray-400"
        >
          Desligar
        </button>
        
        <button
          onClick={handleForceAudioPlay}
          className="px-4 py-2 font-bold text-white bg-purple-500 rounded hover:bg-purple-700"
        >
          🔊 Ativar Áudio WSS
        </button>
      </div>
      
      <audio 
        ref={remoteAudioRef} 
        autoPlay 
        playsInline
        controls={isDev} // Mostrar controles apenas em desenvolvimento
        style={{ 
          marginTop: '10px', 
          width: '100%',
          display: isDev ? 'block' : 'none' // Ocultar em produção
        }}
      />
    </div>
  );
}; 