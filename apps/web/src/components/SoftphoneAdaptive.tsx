'use client';

import React, { useEffect, useState, useRef } from 'react';
import * as JsSIP from 'jssip';

export const SoftphoneAdaptive = () => {
  const [status, setStatus] = useState('Desconectado');
  const [inCall, setInCall] = useState(false);
  const uaRef = useRef<JsSIP.UA | null>(null);
  const sessionRef = useRef<any>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const agentId = 'agent-1001-wss'; // WSS-only endpoint

  // Configuração WSS-only
  const createUA = (): JsSIP.UA => {
    const host = process.env.NEXT_PUBLIC_ASTERISK_HOST || 'localhost';
    const wssPort = process.env.NEXT_PUBLIC_ASTERISK_WSS_PORT || '8089';
    const wsUrl = `wss://${host}:${wssPort}/ws`;
    
    console.log(`[WSS] Criando UA com configuração WSS-only:`, {
      protocol: 'wss',
      port: wssPort,
      endpoint: agentId,
      url: wsUrl
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
      console.log('[WSS] Registrado com sucesso via WebSocket Secure');
      setStatus('Registrado (WSS)');
    });

    ua.on('unregistered', () => {
      console.log('[WSS] Não registrado');
      setStatus('Não Registrado');
    });

    ua.on('registrationFailed', (e: any) => {
      console.error('[WSS] Falha no registro WSS:', e);
      setStatus(`Falha WSS: ${e.cause}`);
    });

    ua.on('newRTCSession', (data: any) => {
      console.log('[WSS] Nova sessão RTC via WebSocket Secure:', data);
      const session = data.session;
      sessionRef.current = session;

      session.on('peerconnection', (e: any) => {
        console.log('[WebRTC] PeerConnection criada via WSS:', e.peerconnection);
        
        const pc = e.peerconnection;
        console.log('[WebRTC] Estado inicial da conexão WSS:', pc.connectionState);
        
        pc.addEventListener('connectionstatechange', () => {
          console.log('[WebRTC] Estado da conexão WSS:', pc.connectionState);
        });
        
        pc.addEventListener('iceconnectionstatechange', () => {
          console.log('[WebRTC] Estado ICE WSS:', pc.iceConnectionState);
        });

        pc.addEventListener('track', (event: any) => {
          console.log('[WebRTC] Track recebida via WSS:', event);
          
          if (remoteAudioRef.current && event.streams[0]) {
            console.log('[WebRTC] Configurando áudio remoto WSS');
            remoteAudioRef.current.srcObject = event.streams[0];
            
            remoteAudioRef.current.play().then(() => {
              console.log('[WebRTC] Áudio WSS iniciado com sucesso');
            }).catch(err => {
              console.error('[WebRTC] Erro ao reproduzir áudio WSS:', err);
            });
          }
        });
      });

      session.on('accepted', () => {
        console.log('[WSS] Chamada aceita via WebSocket Secure');
        setStatus('Em chamada (WSS)');
        setInCall(true);
      });

      session.on('ended', () => {
        console.log('[WSS] Chamada finalizada');
        setStatus('Registrado (WSS)');
        setInCall(false);
      });

      session.on('failed', (e: any) => {
        console.error('[WSS] Chamada falhou:', e);
        setStatus(`Chamada Falhou: ${e.cause}`);
        setInCall(false);
      });
    });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('[DEBUG] Iniciando Softphone WSS-Only...');
    JsSIP.debug.enable('JsSIP:*');

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
      console.error('[DEBUG] Erro ao iniciar Softphone WSS:', error);
      setStatus('Erro ao iniciar WSS');
    }
  }, []);

  const handleCall = (destination: string) => {
    if (uaRef.current) {
      console.log(`[WSS] Iniciando chamada para ${destination} via WebSocket Secure`);
      
      const options = {
        event_handlers: {
          progress: (e: any) => {
            console.log('[WSS] Progresso da chamada:', e);
            setStatus('Chamando...');
          },
          failed: (e: any) => {
            console.error('[WSS] Chamada falhou:', e);
            setStatus(`Falhou: ${e.cause}`);
          },
          ended: (e: any) => {
            console.log('[WSS] Chamada finalizada:', e);
            setStatus('Finalizada');
          },
          accepted: (e: any) => {
            console.log('[WSS] Chamada aceita:', e);
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
      console.log('[WSS] Finalizando chamada');
      sessionRef.current.terminate();
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
            if (remoteAudioRef.current) {
              remoteAudioRef.current.play().catch(console.error);
            }
            handleCall('9999');
          }}
          disabled={inCall}
          className="px-4 py-2 font-bold text-white bg-green-500 rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          🔒 Teste Echo WSS (9999)
        </button>
        
        <button
          onClick={() => {
            if (remoteAudioRef.current) {
              remoteAudioRef.current.play().catch(console.error);
            }
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
          onClick={() => {
            if (remoteAudioRef.current) {
              remoteAudioRef.current.play().catch(console.error);
              console.log('[DEBUG] Forçando reprodução de áudio WSS');
            }
          }}
          className="px-4 py-2 font-bold text-white bg-purple-500 rounded hover:bg-purple-700"
        >
          🔊 Ativar Áudio WSS
        </button>
      </div>
      
      <audio 
        ref={remoteAudioRef} 
        autoPlay 
        playsInline
        controls={true}
        style={{ marginTop: '10px', width: '100%' }}
      />
    </div>
  );
}; 