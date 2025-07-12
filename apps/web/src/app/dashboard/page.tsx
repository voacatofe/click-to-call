'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Settings, Save, Eye, EyeOff, LogOut, User, Phone } from 'lucide-react'
import { Softphone } from '@/components/Softphone'
import { getApiUrl } from '@/lib/api' // Importa a função para construir URLs da API

// Force dynamic rendering since we use auth
export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const { user, signOut, loading: authLoading } = useAuth()
  const router = useRouter()
  const [token, setToken] = useState('')
  const [isTokenVisible, setIsTokenVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasExistingToken, setHasExistingToken] = useState(false)
  const [agentId, setAgentId] = useState<string>('')
  const [agentPassword, setAgentPassword] = useState<string>()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  // Load existing token status on mount
  useEffect(() => {
    if (user) {
      checkExistingToken()
      fetchAgentCredentials()
    }
  }, [user])

  const fetchAgentCredentials = async () => {
    try {
      // Este endpoint precisará ser criado na nossa API
      const response = await fetch(getApiUrl('/webrtc/credentials'))
      if (response.ok) {
        const data = await response.json()
        setAgentId(data.agentId)
        setAgentPassword(data.password)
      } else {
        setError('Falha ao buscar credenciais do WebRTC.')
      }
    } catch (err) {
      setError('Erro ao conectar com a API para buscar credenciais.')
      console.error(err)
    }
  }

  const checkExistingToken = async () => {
    try {
      const response = await fetch(getApiUrl('/rd-station/token'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setHasExistingToken(data.hasToken)
      }
    } catch (error) {
      console.error('Error checking existing token:', error)
    }
  }

  const handleSaveToken = async () => {
    if (!token.trim()) {
      setError('Token é obrigatório')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch(getApiUrl('/rd-station/token'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: token.trim() }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao salvar token')
      }

      setSuccess(true)
      setHasExistingToken(true)
      setToken('')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Settings className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500">Configurações da ferramenta</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6">
            
            {/* RD Station Token Configuration Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Settings className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Configuração RD Station
                    </h3>
                    <p className="text-sm text-gray-500">
                      Configure o token de acesso da API do RD Station CRM
                    </p>
                  </div>
                </div>

                {/* Status indicator */}
                <div className="mb-6">
                  <div className="flex items-center space-x-2">
                    <div className={`h-3 w-3 rounded-full ${hasExistingToken ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                    <span className={`text-sm font-medium ${hasExistingToken ? 'text-green-700' : 'text-gray-500'}`}>
                      {hasExistingToken ? 'Token configurado' : 'Token não configurado'}
                    </span>
                  </div>
                </div>

                {/* Success Alert */}
                {success && (
                  <div className="mb-4">
                    <Alert variant="success" title="Token salvo com sucesso!">
                      O token do RD Station foi configurado e já pode ser utilizado.
                    </Alert>
                  </div>
                )}

                {/* Error Alert */}
                {error && (
                  <div className="mb-4">
                    <Alert variant="error" title="Erro ao salvar token" onClose={() => setError(null)}>
                      {error}
                    </Alert>
                  </div>
                )}

                {/* Token Input Form */}
                <div className="space-y-4">
                  <div className="relative">
                    <Input
                      type={isTokenVisible ? 'text' : 'password'}
                      label="Token de Acesso"
                      placeholder="Cole aqui o token da API do RD Station"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      helperText="Você pode encontrar este token nas configurações da API do RD Station CRM"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                      onClick={() => setIsTokenVisible(!isTokenVisible)}
                    >
                      {isTokenVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  <Button
                    onClick={handleSaveToken}
                    loading={loading}
                    disabled={loading || !token.trim()}
                    className="flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>{hasExistingToken ? 'Atualizar Token' : 'Salvar Token'}</span>
                  </Button>
                </div>

                {/* Instructions */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">
                    Como obter o token do RD Station:
                  </h4>
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Acesse sua conta do RD Station CRM</li>
                    <li>Vá em Configurações → Integrações → API</li>
                    <li>Gere um novo token de acesso</li>
                    <li>Copie o token e cole no campo acima</li>
                    <li>Clique em "Salvar Token"</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Softphone Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Phone className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Telefone Virtual
                    </h3>
                    <p className="text-sm text-gray-500">
                      Realize e receba chamadas diretamente do navegador
                    </p>
                  </div>
                </div>
                <Softphone agentId={agentId} agentPassword={agentPassword} />
              </div>
            </div>

            {/* Future sections placeholder */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="text-center py-12">
                  <Settings className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Mais configurações em breve</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Novas funcionalidades e configurações serão adicionadas em futuras atualizações.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}