'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import * as JsSIP from 'jssip';
import { Phone, PhoneOff, Mic, Ear, Wifi, WifiOff, Shield } from 'lucide-react';

// Sistema de log robusto baseado em environment
const isDev = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname.includes('dev'));

const logger = {
  debug: isDev ? console.log : () => {},
  info: console.info,
  error: console.error,
  warn: console.warn
};

// Configurações de ambiente robustas
const getEnvironmentConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const easypanelHost = process.env.NEXT_PUBLIC_EASYPANEL_HOST || 'clicktocall-ctc.2w4klq.easypanel.host';
  const realm = process.env.NEXT_PUBLIC_ASTERISK_REALM || 'clicktocall.local';
  
  return {
    isProduction,
    // Configuração para produção (EasyPanel SSL Termination)
    production: {
      wsUri: `wss://${easypanelHost}/ws`,
      sipUri: `sip:agent-1001@${realm}`,
      displayName: 'Agent (SSL via EasyPanel)'
    },
    // Configuração para desenvolvimento (múltiplas opções)
    development: {
      primary: {
        wsUri: `wss://localhost:8089/ws`,
        sipUri: `sip:agent-1001-wss@${realm}`,
        displayName: 'Agent (Direct WSS)'
      },
      fallback: {
        wsUri: `ws://localhost:8088/ws`,
        sipUri: `sip:agent-1001@${realm}`,
        displayName: 'Agent (Direct WS)'
      }
    }
  };
};

const SoftphoneAdaptive = () => {
  const [status, setStatus] = useState('Desconectado');
  const [connectionType, setConnectionType] = useState('');
  const [inCall, setInCall] = useState(false);
  const [session, setSession] = useState<any | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isSecure, setIsSecure] = useState(false);
  
  const uaRef = useRef<JsSIP.UA | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [destination, setDestination] = useState('9999');
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  // Configuração robusta de conexão
  const connect = useCallback(async (forceConfig?: any) => {
    try {
      setStatus('Obtendo configuração...');
      
      // Buscar ICE servers
      let iceServers = [];
      try {
        const response = await fetch('/api/webrtc/ice-servers');
        if (response.ok) {
          iceServers = await response.json();
          logger.debug('ICE servers obtidos:', iceServers);
        }
      } catch (error) {
        logger.warn('Falha ao obter ICE servers, usando padrão:', error);
      }

      const envConfig = getEnvironmentConfig();
      const password = process.env.NEXT_PUBLIC_AGENT_PASSWORD;

      if (!password) {
        throw new Error('Senha do agente não configurada');
      }

      let config: { wsUri: string; sipUri: string; displayName: string };
      let connectionInfo: string;

      if (forceConfig) {
        config = forceConfig;
        connectionInfo = forceConfig.displayName;
      } else if (envConfig.isProduction) {
        // Produção: Sempre usar EasyPanel SSL Termination
        config = envConfig.production;
        connectionInfo = 'Produção (EasyPanel SSL)';
        setIsSecure(true);
      } else {
        // Desenvolvimento: Tentar WSS primeiro, depois WS
        if (reconnectAttempts < 3) {
          config = envConfig.development.primary;
          connectionInfo = 'Dev (Direct WSS)';
          setIsSecure(true);
        } else {
          config = envConfig.development.fallback;
          connectionInfo = 'Dev (Direct WS)';
          setIsSecure(false);
        }
      }

      setConnectionType(connectionInfo);
      setStatus(`Conectando via ${connectionInfo}...`);
      
      logger.info(`Tentando conectar via: ${config.wsUri}`);
      
      const socket = new JsSIP.WebSocketInterface(config.wsUri);
      
      // A linha que causava o erro de build foi removida.
      // O tratamento de erro robusto já está nos eventos 'registrationFailed' e 'disconnected' da UA.
      
      const configuration = {
        sockets: [socket],
        uri: config.sipUri,
        password: password,
        register: true,
        ice_servers: iceServers,
        session_timers: false,
        rtcp_feedback: {
          audio: true,
          video: false
        },
        connection_recovery_min_interval: 2,
        connection_recovery_max_interval: 30
      };

      // Limpar UA anterior se existir
      if (uaRef.current) {
        try {
          if (uaRef.current.isRegistered()) {
            uaRef.current.unregister();
          }
          uaRef.current.stop();
        } catch (error) {
          logger.warn('Erro ao limpar UA anterior:', error);
        }
      }

      const ua = new JsSIP.UA(configuration);
      uaRef.current = ua;

      // Event handlers robustos
      ua.on('registered', (e) => {
        logger.info(`Registrado com sucesso via ${connectionInfo}`);
        setStatus(`Online (${connectionInfo})`);
        setReconnectAttempts(0);
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      });

      ua.on('unregistered', (e) => {
        setStatus('Desconectado');
        logger.info(`Desregistrado. Causa: ${e.cause}`);
      });

      ua.on('registrationFailed', (e) => {
        const cause = e.cause || 'Unknown';
        logger.error(`Falha no registro via ${connectionInfo}:`, cause);
        // Verifica se o erro é de conexão WebSocket
        if (cause === JsSIP.C.causes.CONNECTION_ERROR) {
          setStatus(`Falha WebSocket: Verifique o proxy e a rede.`);
        } else {
          setStatus(`Falha no Registro: ${cause}`);
        }
        
        // Lógica de reconexão
        if (reconnectAttempts < maxReconnectAttempts) {
          const nextAttempt = reconnectAttempts + 1;
          setReconnectAttempts(nextAttempt);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay * nextAttempt); // Aumenta o delay a cada tentativa
        } else {
          setStatus('Falha na conexão (máx. tentativas)');
          logger.error('Máximo de tentativas de reconexão atingido.');
        }
      });

      ua.on('disconnected', () => {
        logger.warn('WebSocket desconectado. Tentando reconectar...');
        setStatus('Desconectado (WebSocket)');
        
        // Inicia a lógica de reconexão
        if (reconnectAttempts < maxReconnectAttempts) {
          const nextAttempt = reconnectAttempts + 1;
          setReconnectAttempts(nextAttempt);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        }
      });

      ua.on('connected', () => {
        logger.info('WebSocket conectado');
      });
      
      ua.on('newRTCSession', (data: any) => {
        logger.debug(`Nova sessão RTC via ${connectionInfo}`);
        const session = data.session;
        setSession(session);

        session.on('peerconnection', (e: any) => {
          logger.debug('PeerConnection criada');
          
          const pc = e.peerconnection;
          
          pc.addEventListener('connectionstatechange', () => {
            logger.debug('Estado da conexão:', pc.connectionState);
          });
          
          pc.addEventListener('iceconnectionstatechange', () => {
            logger.debug('Estado ICE:', pc.iceConnectionState);
          });

          pc.addEventListener('track', (event: any) => {
            logger.debug('Track de áudio recebida');
            
            if (remoteAudioRef.current && event.streams[0]) {
              remoteAudioRef.current.srcObject = event.streams[0];
              
              remoteAudioRef.current.play().then(() => {
                logger.debug('Áudio iniciado com sucesso');
              }).catch(err => {
                logger.error('Erro ao reproduzir áudio:', err);
              });
            }
          });
        });

        session.on('accepted', () => {
          logger.info('Chamada aceita');
          setStatus(`Em chamada (${isSecure ? '🔐 Segura' : '⚠️ Não segura'})`);
          setInCall(true);
        });

        session.on('ended', () => {
          logger.info('Chamada finalizada');
          setStatus(`Online (${connectionInfo})`);
          setInCall(false);
        });

        session.on('failed', (e: any) => {
          const cause = e.cause || 'Unknown';
          logger.error('Chamada falhou:', cause);
          setStatus(`Chamada falhou: ${cause}`);
          setInCall(false);
        });
      });

      ua.start();

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Falha na configuração:', error);
      setStatus(`Erro: ${errorMsg}`);
      
      // Tentar reconexão em caso de erro
      if (reconnectAttempts < maxReconnectAttempts) {
        const nextAttempt = reconnectAttempts + 1;
        setReconnectAttempts(nextAttempt);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectDelay);
      }
    }
  }, [reconnectAttempts]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    logger.debug('Iniciando Softphone Robusto...');
    
    // Habilitar debug JsSIP apenas em desenvolvimento
    if (isDev) {
      JsSIP.debug.enable('JsSIP:*');
    }

    connect();

    return () => {
      // Cleanup
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (uaRef.current) {
        try {
          if (uaRef.current.isRegistered()) {
            uaRef.current.unregister();
          }
          uaRef.current.stop();
        } catch (error) {
          logger.warn('Erro no cleanup:', error);
        }
      }
    };
  }, [connect]);

  const handleCall = () => {
    if (uaRef.current && destination) {
      const options = {
        'mediaConstraints': { 'audio': true, 'video': false },
        rtcOfferConstraints: {
          offerToReceiveAudio: true,
          offerToReceiveVideo: false
        }
      };
      
      const realm = process.env.NEXT_PUBLIC_ASTERISK_REALM || 'clicktocall.local';
      const session = uaRef.current.call(`sip:${destination}@${realm}`, options);
      setSession(session);
      logger.info(`Iniciando chamada para: ${destination}`);
    }
  };

  const handleHangup = () => {
    if (session) {
      logger.debug('Finalizando chamada');
      session.terminate();
    }
  };

  const handleReconnect = () => {
    setReconnectAttempts(0);
    connect();
  };

  const getStatusColor = () => {
    if (status.includes('Online')) return 'text-green-600';
    if (status.includes('Falha') || status.includes('Erro')) return 'text-red-600';
    if (status.includes('Em chamada')) return 'text-blue-600';
    if (status.includes('Conectando')) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getConnectionIcon = () => {
    if (status.includes('Online')) {
      return isSecure ? <Shield className="w-4 h-4 text-green-600" /> : <Wifi className="w-4 h-4 text-yellow-600" />;
    }
    return <WifiOff className="w-4 h-4 text-red-600" />;
  };

  return (
    <div className="p-4 border rounded-lg shadow-md max-w-sm mx-auto">
      <h3 className="text-lg font-semibold text-center mb-2 flex items-center justify-center gap-2">
        {getConnectionIcon()}
        Softphone Robusto
      </h3>
      
      <div className="text-center mb-2">
        <p>Status: <span className={getStatusColor()}>{status}</span></p>
        <div className="text-xs text-gray-600 mt-1">
          <p>🔗 Conexão: {connectionType}</p>
          <p>{isSecure ? '🔒 SSL/TLS + DTLS/SRTP' : '⚠️ Não seguro'}</p>
          {reconnectAttempts > 0 && (
            <p className="text-yellow-600">🔄 Tentativas: {reconnectAttempts}/{maxReconnectAttempts}</p>
          )}
        </div>
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
            disabled={inCall || !status.includes('Online')}
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
        
        {(status.includes('Falha') || status.includes('Erro')) && (
          <button
            onClick={handleReconnect}
            className="w-full bg-blue-500 text-white p-2 rounded flex items-center justify-center gap-2"
          >
            <Wifi size={18} /> Reconectar
          </button>
        )}
      </div>
      
      <audio ref={remoteAudioRef} autoPlay />
    </div>
  );
};

export default SoftphoneAdaptive; 