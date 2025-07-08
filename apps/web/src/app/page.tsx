'use client'

// Force dynamic rendering since we use auth
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { LogOut, User, UserPlus, LogIn, Settings } from 'lucide-react'
import { Softphone } from '@/components/Softphone';
import { SoftphoneAdaptive } from '@/components/SoftphoneAdaptive';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const { user, signOut, loading } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      {/* Header with Auth */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">Click-to-Call System</h1>
          <p className="text-lg text-gray-600 mt-2">
            Sistema de chamadas com Asterisk, WebRTC e Next.js
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                loading={loading}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Entrar
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Criar conta
                </Button>
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl">
          {/* Softphone Original (WS apenas) */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Softphone Original (WS)</h2>
            <p className="text-sm text-gray-600">
              Componente original que usa apenas WebSocket não-seguro (ws://)
            </p>
            <Softphone />
          </div>

          {/* Softphone Adaptativo (WS + WSS) */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Softphone Adaptativo (WS/WSS)</h2>
            <p className="text-sm text-gray-600">
              Componente que detecta automaticamente HTTP/HTTPS e usa WS ou WSS adequadamente
            </p>
            <SoftphoneAdaptive />
          </div>
        </div>

        {/* Informações de Debug */}
        <div className="w-full max-w-6xl mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">🔧 Informações de Debug</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium">Protocolo da Página:</h4>
              <p className="text-gray-600">
                {typeof window !== 'undefined' ? window.location.protocol : 'Carregando...'}
              </p>
            </div>
            <div>
              <h4 className="font-medium">Host:</h4>
              <p className="text-gray-600">
                {typeof window !== 'undefined' ? window.location.host : 'Carregando...'}
              </p>
            </div>
            <div>
              <h4 className="font-medium">Variáveis de Ambiente:</h4>
              <ul className="text-gray-600 text-xs space-y-1">
                <li>ASTERISK_HOST: {process.env.NEXT_PUBLIC_ASTERISK_HOST || 'localhost'}</li>
                <li>WS_PORT: {process.env.NEXT_PUBLIC_ASTERISK_WS_PORT || '8088'}</li>
                <li>WSS_PORT: {process.env.NEXT_PUBLIC_ASTERISK_WSS_PORT || '8089'}</li>
                <li>FORCE_PROTOCOL: {process.env.NEXT_PUBLIC_FORCE_PROTOCOL || 'auto'}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium">Testes Disponíveis:</h4>
              <ul className="text-gray-600 text-xs space-y-1">
                <li>• 9999: Teste de eco (Echo)</li>
                <li>• 8888: Teste de playback</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Instruções */}
        <div className="w-full max-w-6xl mt-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">📋 Como Testar</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Modo WS (Desenvolvimento):</strong></p>
            <ul className="list-disc list-inside text-gray-600 ml-4 space-y-1">
              <li>Acesse via HTTP: <code>http://localhost:3000</code></li>
              <li>Ambos componentes devem usar WS (ws://localhost:8088/ws)</li>
              <li>Componente adaptativo mostra "WS" no status</li>
            </ul>
            
            <p className="mt-4"><strong>Modo WSS (Produção):</strong></p>
            <ul className="list-disc list-inside text-gray-600 ml-4 space-y-1">
              <li>Acesse via HTTPS: <code>https://localhost:3000</code></li>
              <li>Aceite o certificado auto-assinado no navegador</li>
              <li>Componente adaptativo deve usar WSS (wss://localhost:8089/ws)</li>
              <li>Fallback para WS se WSS falhar</li>
            </ul>

            <p className="mt-4"><strong>Scripts de Configuração:</strong></p>
            <ul className="list-disc list-inside text-gray-600 ml-4 space-y-1">
              <li><code>.\scripts\setup-wss.ps1 ws</code> - Modo WS apenas</li>
              <li><code>.\scripts\setup-wss.ps1 wss</code> - Modo WS + WSS</li>
              <li><code>.\scripts\setup-wss.ps1 test</code> - Testar conectividade</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
