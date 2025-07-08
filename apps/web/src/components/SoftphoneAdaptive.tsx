'use client';

import React, { useEffect, useState, useRef } from 'react';
import * as JsSIP from 'jssip';

interface SoftphoneConfig {
  protocol: 'ws' | 'wss';
  port: number;
  endpoint: string;
  enableFallback: boolean;
}

export const SoftphoneAdaptive = () => {
  const [status, setStatus] = useState('Desconectado');
  const [inCall, setInCall] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<SoftphoneConfig | null>(null);
  const uaRef = useRef<JsSIP.UA | null>(null);
  const sessionRef = useRef<any>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const agentId = 'agent-1001';

  // Detectar configuração automaticamente
  const detectConfig = (): SoftphoneConfig => {
    const isSecure = window.location.protocol === 'https:';
    const forceProtocol = process.env.NEXT_PUBLIC_FORCE_PROTOCOL as 'ws' | 'wss' | undefined;
    
    // Se forçado via env, usar configuração específica
    if (forceProtocol) {
      console.log(`[CONFIG] Protocolo forçado via env: ${forceProtocol}`);
      return {
        protocol: forceProtocol,
        port: forceProtocol === 'wss' ? 8089 : 8088,
        endpoint: forceProtocol === 'wss' ? 'agent-1001-wss' : 'agent-1001-ws',
        enableFallback: false
      };
    }

    // Detecção automática baseada no protocolo da página
    if (isSecure) {
      console.log('[CONFIG] Página HTTPS detectada, usando WSS');
      return {
        protocol: 'wss',
        port: 8089,
        endpoint: 'agent-1001-wss',
        enableFallback: true // Fallback para WS se WSS falhar
      };
    } else {
      console.log('[CONFIG] Página HTTP detectada, usando WS');
      return {
        protocol: 'ws',
        port: 8088,
        endpoint: 'agent-1001-ws',
        enableFallback: false
      };
    }
  };

  const createUA = (config: SoftphoneConfig): JsSIP.UA => {
    const host = process.env.NEXT_PUBLIC_ASTERISK_HOST || 'localhost';
    const wsUrl = `${config.protocol}://${host}:${config.port}/ws`;
    
    console.log(`[SIP] Criando UA com configuração:`, {
      protocol: config.protocol,
      port: config.port,
      endpoint: config.endpoint,
      url: wsUrl
    });

    const socket = new JsSIP.WebSocketInterface(wsUrl);
    
    const configuration = {
      sockets: [socket],
      uri: `sip:${config.endpoint}@clicktocall.local`,
      password: process.env.NEXT_PUBLIC_AGENT_PASSWORD || 'changeme',
      register: true
    };

    return new JsSIP.UA(configuration);
  };

  const setupUA = (ua: JsSIP.UA, config: SoftphoneConfig) => {
    ua.on('registered', () => {
      console.log(`[SIP] Registrado com sucesso via ${config.protocol.toUpperCase()}`);
      setStatus(`Registrado (${config.protocol.toUpperCase()})`);
      setCurrentConfig(config);
    });

    ua.on('unregistered', () => {
      console.log('[SIP] Não registrado');
      setStatus('Não Registrado');
    });

    ua.on('registrationFailed', (e: any) => {
      console.error(`[SIP] Falha no registro ${config.protocol.toUpperCase()}:`, e);
      setStatus(`Falha ${config.protocol.toUpperCase()}: ${e.cause}`);
      
      // Tentar fallback se habilitado
      if (config.enableFallback && config.protocol === 'wss') {
        console.log('[SIP] Tentando fallback para WS...');
        tryFallback();
      }
    });

    ua.on('newRTCSession', (data: any) => {
      console.log(`[SIP] Nova sessão RTC via ${config.protocol.toUpperCase()}:`, data);
      const session = data.session;
      sessionRef.current = session;

      session.on('peerconnection', (e: any) => {
        console.log('[WebRTC] PeerConnection criada:', e.peerconnection);
        
        const pc = e.peerconnection;
        console.log(`[WebRTC] Usando ${config.protocol.toUpperCase()} - Estado inicial:`, pc.connectionState);
        
        pc.addEventListener('connectionstatechange', () => {
          console.log('[WebRTC] Estado da conexão:', pc.connectionState);
        });
        
        pc.addEventListener('iceconnectionstatechange', () => {
          console.log('[WebRTC] Estado ICE:', pc.iceConnectionState);
        });

        pc.addEventListener('track', (event: any) => {
          console.log(`[WebRTC] Track recebida via ${config.protocol.toUpperCase()}:`, event);
          
          if (remoteAudioRef.current && event.streams[0]) {
            console.log('[WebRTC] Configurando áudio remoto');
            remoteAudioRef.current.srcObject = event.streams[0];
            
            remoteAudioRef.current.play().then(() => {
              console.log(`[WebRTC] Áudio iniciado com sucesso via ${config.protocol.toUpperCase()}`);
            }).catch(err => {
              console.error('[WebRTC] Erro ao reproduzir áudio:', err);
            });
          }
        });
      });

      session.on('accepted', () => {
        console.log(`[SIP] Chamada aceita via ${config.protocol.toUpperCase()}`);
        setStatus(`Em chamada (${config.protocol.toUpperCase()})`);
        setInCall(true);
      });

      session.on('ended', () => {
        console.log('[SIP] Chamada finalizada');
        setStatus(`Registrado (${config.protocol.toUpperCase()})`);
        setInCall(false);
      });

      session.on('failed', (e: any) => {
        console.error('[SIP] Chamada falhou:', e);
        setStatus(`Chamada Falhou: ${e.cause}`);
        setInCall(false);
      });
    });
  };

  const tryFallback = () => {
    console.log('[FALLBACK] Tentando conexão WS como fallback...');
    
    const fallbackConfig: SoftphoneConfig = {
      protocol: 'ws',
      port: 8088,
      endpoint: 'agent-1001-ws',
      enableFallback: false
    };

    try {
      const fallbackUA = createUA(fallbackConfig);
      setupUA(fallbackUA, fallbackConfig);
      
      // Parar UA anterior se existir
      if (uaRef.current) {
        uaRef.current.stop();
      }
      
      uaRef.current = fallbackUA;
      fallbackUA.start();
      
      setStatus('Tentando fallback WS...');
    } catch (error) {
      console.error('[FALLBACK] Erro no fallback:', error);
      setStatus('Erro no fallback');
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('[DEBUG] Iniciando Softphone Adaptativo...');
    JsSIP.debug.enable('JsSIP:*');

    const config = detectConfig();
    
    try {
      const ua = createUA(config);
      setupUA(ua, config);
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
    if (uaRef.current && currentConfig) {
      console.log(`[SIP] Iniciando chamada para ${destination} via ${currentConfig.protocol.toUpperCase()}`);
      
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
      <h2 className="text-lg font-bold">Softphone Adaptativo</h2>
      <p>Status: <span className={`font-semibold ${getStatusColor()}`}>{status}</span></p>
      
      {currentConfig && (
        <div className="mt-2 text-sm text-gray-600">
          <p>Protocolo: <strong>{currentConfig.protocol.toUpperCase()}</strong></p>
          <p>Porta: <strong>{currentConfig.port}</strong></p>
          <p>Endpoint: <strong>{currentConfig.endpoint}</strong></p>
        </div>
      )}

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

import React, { useEffect, useState, useRef } from 'react';
import * as JsSIP from 'jssip';

interface SoftphoneConfig {
  protocol: 'ws' | 'wss';
  port: number;
  endpoint: string;
  enableFallback: boolean;
}

export const SoftphoneAdaptive = () => {
  const [status, setStatus] = useState('Desconectado');
  const [inCall, setInCall] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<SoftphoneConfig | null>(null);
  const uaRef = useRef<JsSIP.UA | null>(null);
  const sessionRef = useRef<any>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const agentId = 'agent-1001';

  // Detectar configuração automaticamente
  const detectConfig = (): SoftphoneConfig => {
    const isSecure = window.location.protocol === 'https:';
    const forceProtocol = process.env.NEXT_PUBLIC_FORCE_PROTOCOL as 'ws' | 'wss' | undefined;
    
    // Se forçado via env, usar configuração específica
    if (forceProtocol) {
      console.log(`[CONFIG] Protocolo forçado via env: ${forceProtocol}`);
      return {
        protocol: forceProtocol,
        port: forceProtocol === 'wss' ? 8089 : 8088,
        endpoint: forceProtocol === 'wss' ? 'agent-1001-wss' : 'agent-1001-ws',
        enableFallback: false
      };
    }

    // Detecção automática baseada no protocolo da página
    if (isSecure) {
      console.log('[CONFIG] Página HTTPS detectada, usando WSS');
      return {
        protocol: 'wss',
        port: 8089,
        endpoint: 'agent-1001-wss',
        enableFallback: true // Fallback para WS se WSS falhar
      };
    } else {
      console.log('[CONFIG] Página HTTP detectada, usando WS');
      return {
        protocol: 'ws',
        port: 8088,
        endpoint: 'agent-1001-ws',
        enableFallback: false
      };
    }
  };

  const createUA = (config: SoftphoneConfig): JsSIP.UA => {
    const host = process.env.NEXT_PUBLIC_ASTERISK_HOST || 'localhost';
    const wsUrl = `${config.protocol}://${host}:${config.port}/ws`;
    
    console.log(`[SIP] Criando UA com configuração:`, {
      protocol: config.protocol,
      port: config.port,
      endpoint: config.endpoint,
      url: wsUrl
    });

    const socket = new JsSIP.WebSocketInterface(wsUrl);
    
    const configuration = {
      sockets: [socket],
      uri: `sip:${config.endpoint}@clicktocall.local`,
      password: process.env.NEXT_PUBLIC_AGENT_PASSWORD || 'changeme',
      register: true
    };

    return new JsSIP.UA(configuration);
  };

  const setupUA = (ua: JsSIP.UA, config: SoftphoneConfig) => {
    ua.on('registered', () => {
      console.log(`[SIP] Registrado com sucesso via ${config.protocol.toUpperCase()}`);
      setStatus(`Registrado (${config.protocol.toUpperCase()})`);
      setCurrentConfig(config);
    });

    ua.on('unregistered', () => {
      console.log('[SIP] Não registrado');
      setStatus('Não Registrado');
    });

    ua.on('registrationFailed', (e: any) => {
      console.error(`[SIP] Falha no registro ${config.protocol.toUpperCase()}:`, e);
      setStatus(`Falha ${config.protocol.toUpperCase()}: ${e.cause}`);
      
      // Tentar fallback se habilitado
      if (config.enableFallback && config.protocol === 'wss') {
        console.log('[SIP] Tentando fallback para WS...');
        tryFallback();
      }
    });

    ua.on('newRTCSession', (data: any) => {
      console.log(`[SIP] Nova sessão RTC via ${config.protocol.toUpperCase()}:`, data);
      const session = data.session;
      sessionRef.current = session;

      session.on('peerconnection', (e: any) => {
        console.log('[WebRTC] PeerConnection criada:', e.peerconnection);
        
        const pc = e.peerconnection;
        console.log(`[WebRTC] Usando ${config.protocol.toUpperCase()} - Estado inicial:`, pc.connectionState);
        
        pc.addEventListener('connectionstatechange', () => {
          console.log('[WebRTC] Estado da conexão:', pc.connectionState);
        });
        
        pc.addEventListener('iceconnectionstatechange', () => {
          console.log('[WebRTC] Estado ICE:', pc.iceConnectionState);
        });

        pc.addEventListener('track', (event: any) => {
          console.log(`[WebRTC] Track recebida via ${config.protocol.toUpperCase()}:`, event);
          
          if (remoteAudioRef.current && event.streams[0]) {
            console.log('[WebRTC] Configurando áudio remoto');
            remoteAudioRef.current.srcObject = event.streams[0];
            
            remoteAudioRef.current.play().then(() => {
              console.log(`[WebRTC] Áudio iniciado com sucesso via ${config.protocol.toUpperCase()}`);
            }).catch(err => {
              console.error('[WebRTC] Erro ao reproduzir áudio:', err);
            });
          }
        });
      });

      session.on('accepted', () => {
        console.log(`[SIP] Chamada aceita via ${config.protocol.toUpperCase()}`);
        setStatus(`Em chamada (${config.protocol.toUpperCase()})`);
        setInCall(true);
      });

      session.on('ended', () => {
        console.log('[SIP] Chamada finalizada');
        setStatus(`Registrado (${config.protocol.toUpperCase()})`);
        setInCall(false);
      });

      session.on('failed', (e: any) => {
        console.error('[SIP] Chamada falhou:', e);
        setStatus(`Chamada Falhou: ${e.cause}`);
        setInCall(false);
      });
    });
  };

  const tryFallback = () => {
    console.log('[FALLBACK] Tentando conexão WS como fallback...');
    
    const fallbackConfig: SoftphoneConfig = {
      protocol: 'ws',
      port: 8088,
      endpoint: 'agent-1001-ws',
      enableFallback: false
    };

    try {
      const fallbackUA = createUA(fallbackConfig);
      setupUA(fallbackUA, fallbackConfig);
      
      // Parar UA anterior se existir
      if (uaRef.current) {
        uaRef.current.stop();
      }
      
      uaRef.current = fallbackUA;
      fallbackUA.start();
      
      setStatus('Tentando fallback WS...');
    } catch (error) {
      console.error('[FALLBACK] Erro no fallback:', error);
      setStatus('Erro no fallback');
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('[DEBUG] Iniciando Softphone Adaptativo...');
    JsSIP.debug.enable('JsSIP:*');

    const config = detectConfig();
    
    try {
      const ua = createUA(config);
      setupUA(ua, config);
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
    if (uaRef.current && currentConfig) {
      console.log(`[SIP] Iniciando chamada para ${destination} via ${currentConfig.protocol.toUpperCase()}`);
      
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
      <h2 className="text-lg font-bold">Softphone Adaptativo</h2>
      <p>Status: <span className={`font-semibold ${getStatusColor()}`}>{status}</span></p>
      
      {currentConfig && (
        <div className="mt-2 text-sm text-gray-600">
          <p>Protocolo: <strong>{currentConfig.protocol.toUpperCase()}</strong></p>
          <p>Porta: <strong>{currentConfig.port}</strong></p>
          <p>Endpoint: <strong>{currentConfig.endpoint}</strong></p>
        </div>
      )}

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