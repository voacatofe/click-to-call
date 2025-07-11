'use client';

import React, { useEffect, useState, useRef } from 'react';
import * as JsSIP from 'jssip';

// Define as propriedades que o componente Softphone espera receber
interface SoftphoneProps {
  agentId: string;
  agentPassword?: string;
}

export const Softphone: React.FC<SoftphoneProps> = ({ agentId, agentPassword }) => {
  const [status, setStatus] = useState('Desconectado');
  const [inCall, setInCall] = useState(false);
  const uaRef = useRef<JsSIP.UA | null>(null);
  // Usando 'any' como uma solução pragmática para a referência da sessão
  const sessionRef = useRef<any>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  // A agentId agora vem das props

  useEffect(() => {
    // Se não tivermos a senha, não podemos iniciar o softphone
    if (typeof window === 'undefined' || !agentPassword) {
      setStatus('Aguardando credenciais...');
      return;
    }

    // WSS via EasyPanel - SSL Termination otimizado
    // EasyPanel recebe WSS e encaminha como WS para o Asterisk
    const easypanelHost = process.env.NEXT_PUBLIC_EASYPANEL_HOST || 'clicktocall-ctc.2w4klq.easypanel.host';
    const socket = new JsSIP.WebSocketInterface(`wss://${easypanelHost}/ws`);
    
    // Configuração otimizada para SSL termination via EasyPanel
    const configuration = {
      sockets: [socket], // WSS via EasyPanel -> WS para Asterisk
      uri: `sip:agent-1001@clicktocall.local`, // Endpoint atualizado
      password: agentPassword, // Usa a senha recebida via props
      register: true,
      // Configurações adicionais para WebRTC seguro
      session_timers: false,
      rtcp_feedback: {
        audio: true,
        video: false
      }
    };

    const ua = new JsSIP.UA(configuration);
    uaRef.current = ua;

    ua.on('registered', () => setStatus('Registrado via WSS (EasyPanel)'));
    ua.on('unregistered', () => setStatus('Não Registrado'));
    // Usando 'any' para o tipo do evento
    ua.on('registrationFailed', (e: any) => setStatus(`Falha no Registro: ${e.cause}`));

    // Usando 'any' para o tipo do evento
    ua.on('newRTCSession', (data: any) => {
      const session = data.session;
      sessionRef.current = session;

      session.on('peerconnection', (e: any) => {
        e.peerconnection.addEventListener('track', (event: any) => {
          if (remoteAudioRef.current && event.streams[0]) {
            remoteAudioRef.current.srcObject = event.streams[0];
          }
        });
      });

      session.on('accepted', () => {
        setStatus('Em chamada (Segura via DTLS)');
        setInCall(true);
      });

      session.on('ended', () => {
        setStatus('Registrado via WSS (EasyPanel)');
        setInCall(false);
      });

      session.on('failed', (e: any) => {
        setStatus(`Chamada Falhou: ${e.cause}`);
        setInCall(false);
      });
    });

    ua.start();

    return () => {
      if (ua.isRegistered()) {
        ua.unregister();
      }
      ua.stop();
    };
  }, [agentId, agentPassword]); // Adicionado agentId e agentPassword às dependências

  const handleCall = (destination: string) => {
    if (uaRef.current) {
      const options = {
        event_handlers: {
          progress: (e: any) => setStatus('Chamando via WSS...'),
          failed: (e: any) => setStatus(`Falhou: ${e.cause}`),
          ended: (e: any) => setStatus('Finalizada'),
          accepted: (e: any) => setStatus('Em chamada (Segura via DTLS)'),
        },
        mediaConstraints: { audio: true, video: false },
        // Forçar uso de DTLS para mídia segura
        rtcOfferConstraints: {
          offerToReceiveAudio: true,
          offerToReceiveVideo: false
        }
      };
      uaRef.current.call(`sip:${destination}@clicktocall.local`, options);
    }
  };

  const handleHangup = () => {
    if (sessionRef.current) {
      sessionRef.current.terminate();
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-md">
      <h2 className="text-lg font-bold">Softphone Seguro (SSL/TLS)</h2>
      <p>Status: <span className="font-semibold">{status}</span></p>
      <div className="mt-2 text-xs text-gray-600">
        <p>🔒 Conexão: WSS via EasyPanel (SSL Termination)</p>
        <p>🔐 Mídia: DTLS/SRTP (Criptografada)</p>
      </div>
      <div className="mt-4 space-x-2">
        <button
          onClick={() => handleCall('9999')}
          disabled={inCall}
          className="px-4 py-2 font-bold text-white bg-green-500 rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          Ligar para Teste (9999)
        </button>
        <button
          onClick={handleHangup}
          disabled={!inCall}
          className="px-4 py-2 font-bold text-white bg-red-500 rounded hover:bg-red-700 disabled:bg-gray-400"
        >
          Desligar
        </button>
      </div>
      <audio ref={remoteAudioRef} autoPlay />
    </div>
  );
}; 