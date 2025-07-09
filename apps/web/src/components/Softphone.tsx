'use client';

import React, { useEffect, useState, useRef } from 'react';
import * as JsSIP from 'jssip';

export const Softphone = () => {
  const [status, setStatus] = useState('Desconectado');
  const [inCall, setInCall] = useState(false);
  const uaRef = useRef<JsSIP.UA | null>(null);
  // Usando 'any' como uma solução pragmática para a referência da sessão
  const sessionRef = useRef<any>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const agentId = 'agent-1001-wss'; // WSS-only para segurança

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // FORÇAR WSS - OBRIGATÓRIO para ambiente HTTPS
    const host = process.env.NEXT_PUBLIC_ASTERISK_HOST || 'localhost';
    const wssPort = process.env.NEXT_PUBLIC_ASTERISK_WSS_PORT || '8089';
    const socket = new JsSIP.WebSocketInterface(`wss://${host}:${wssPort}/ws`);
    
    // Removendo a tipagem explícita para evitar o erro do linter
    const configuration = {
      sockets: [socket], // WSS-only socket
      uri: `sip:${agentId}@clicktocall.local`, // WSS endpoint
      password: process.env.NEXT_PUBLIC_AGENT_PASSWORD || 'changeme',
      register: true
    };

    const ua = new JsSIP.UA(configuration);
    uaRef.current = ua;

    ua.on('registered', () => setStatus('Registrado'));
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
        setStatus('Em chamada');
        setInCall(true);
      });

      session.on('ended', () => {
        setStatus('Registrado');
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
  }, []);

  const handleCall = (destination: string) => {
    if (uaRef.current) {
      const options = {
        event_handlers: {
          progress: (e: any) => setStatus('Chamando...'),
          failed: (e: any) => setStatus(`Falhou: ${e.cause}`),
          ended: (e: any) => setStatus('Finalizada'),
          accepted: (e: any) => setStatus('Em chamada'),
        },
        mediaConstraints: { audio: true, video: false },
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
      <h2 className="text-lg font-bold">Softphone</h2>
      <p>Status: <span className="font-semibold">{status}</span></p>
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