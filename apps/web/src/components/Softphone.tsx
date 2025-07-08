'use client';

import React, { useEffect, useState, useRef } from 'react';
import * as JsSIP from 'jssip';

export const Softphone = () => {
  const [status, setStatus] = useState('Desconectado');
  const [inCall, setInCall] = useState(false);
  const uaRef = useRef<JsSIP.UA | null>(null);
  const sessionRef = useRef<any>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const agentId = 'agent-1001';

  const createUA = (): JsSIP.UA => {
    const host = process.env.NEXT_PUBLIC_ASTERISK_HOST || 'localhost';
    const port = process.env.NEXT_PUBLIC_ASTERISK_WSS_PORT || '8089';
    const wsUrl = `wss://${host}:${port}/ws`;
    
    console.log(`[SIP] Criando UA com WSS:`, { url: wsUrl });

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
      console.log('[SIP] Registrado com sucesso via WSS');
      setStatus('Registrado (WSS)');
    });

    ua.on('unregistered', () => {
      console.log('[SIP] Não registrado');
      setStatus('Não Registrado');
    });

    ua.on('registrationFailed', (e: any) => {
      console.error('[SIP] Falha no registro WSS:', e);
      setStatus(`Falha WSS: ${e.cause}`);
    });

    ua.on('newRTCSession', (data: any) => {
      console.log('[SIP] Nova sessão RTC via WSS:', data);
      const session = data.session;
      sessionRef.current = session;

      session.on('peerconnection', (e: any) => {
        console.log('[WebRTC] PeerConnection criada:', e.peerconnection);
        
        const pc = e.peerconnection;
        console.log('[WebRTC] Usando WSS - Estado inicial:', pc.connectionState);
        
        pc.addEventListener('connectionstatechange', () => {
          console.log('[WebRTC] Estado da conexão:', pc.connectionState);
        });
        
        pc.addEventListener('iceconnectionstatechange', () => {
          console.log('[WebRTC] Estado ICE:', pc.iceConnectionState);
        });

        pc.addEventListener('track', (event: any) => {
          console.log('[WebRTC] Track recebida via WSS:', event);
          
          if (remoteAudioRef.current && event.streams[0]) {
            console.log('[WebRTC] Configurando áudio remoto');
            remoteAudioRef.current.srcObject = event.streams[0];
            
            remoteAudioRef.current.play().then(() => {
              console.log('[WebRTC] Áudio iniciado com sucesso via WSS');
            }).catch(err => {
              console.error('[WebRTC] Erro ao reproduzir áudio:', err);
            });
          }
        });
      });

      session.on('accepted', () => {
        console.log('[SIP] Chamada aceita via WSS');
        setStatus('Em chamada (WSS)');
        setInCall(true);
      });

      session.on('ended', () => {
        console.log('[SIP] Chamada finalizada');
        setStatus('Registrado (WSS)');
        setInCall(false);
      });

      session.on('failed', (e: any) => {
        console.error('[SIP] Chamada falhou:', e);
        setStatus(`Chamada Falhou: ${e.cause}`);
        setInCall(false);
      });
    });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('[DEBUG] Iniciando Softphone WSS...');
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
      console.error('[DEBUG] Erro ao iniciar Softphone:', error);
      setStatus('Erro ao iniciar');
    }
  }, []);

  const handleCall = (destination: string) => {
    if (uaRef.current) {
      console.log(`[SIP] Iniciando chamada para ${destination} via WSS`);
      
      const options = {
        event_handlers: {
          progress: (e: any) => {
            console.log('[SIP] Progresso da chamada:', e);
            setStatus('Chamando...');
          },
          failed: (e: any) => {
            console.error('[SIP] Chamada falhou:', e);
            setStatus(`Falhou: ${e.cause}`);
          },
          ended: (e: any) => {
            console.log('[SIP] Chamada finalizada:', e);
            setStatus('Finalizada');
          },
          accepted: (e: any) => {
            console.log('[SIP] Chamada aceita:', e);
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
      console.log('[SIP] Finalizando chamada');
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
      <h2 className="text-lg font-bold">Softphone WebRTC</h2>
      <p>Status: <span className={`font-semibold ${getStatusColor()}`}>{status}</span></p>
      
      <div className="mt-2 text-sm text-gray-600">
        <p>Protocolo: <strong>WSS (Seguro)</strong></p>
        <p>Porta: <strong>{process.env.NEXT_PUBLIC_ASTERISK_WSS_PORT || '8089'}</strong></p>
        <p>Endpoint: <strong>{agentId}</strong></p>
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
          Teste Echo (9999)
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
          Teste Playback (8888)
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
              console.log('[DEBUG] Forçando reprodução de áudio');
            }
          }}
          className="px-4 py-2 font-bold text-white bg-purple-500 rounded hover:bg-purple-700"
        >
          🔊 Ativar Áudio
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