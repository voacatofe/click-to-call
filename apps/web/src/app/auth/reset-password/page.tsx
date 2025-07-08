'use client'

import { useState, useEffect } from 'react'

// Force dynamic rendering for auth pages
export const dynamic = 'force-dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'

import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { useAuth } from '@/hooks/useAuth'
import { ResetPasswordFormData } from '@/types/auth'
import { resetPasswordSchema } from '@/lib/validation'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { updatePassword, loading, error } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [success, setSuccess] = useState(false)
  const [validToken, setValidToken] = useState<boolean | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema)
  })

  useEffect(() => {
    // Check if we have the required URL fragments for password reset
    if (typeof window !== 'undefined') {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const type = hashParams.get('type')
      
      setValidToken(Boolean(accessToken && type === 'recovery'))
    } else {
      // During SSR, assume invalid token
      setValidToken(false)
    }
  }, [])

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      await updatePassword(data.password)
      setSuccess(true)
    } catch (error: any) {
      // Error is handled by the useAuth hook
    }
  }

  if (validToken === false) {
    return (
      <AuthLayout
        title="Link inválido"
        subtitle="O link de recuperação não é válido ou expirou"
      >
        <Alert variant="error" title="Link de recuperação inválido">
          <p className="mb-3">
            Este link de recuperação não é válido ou já expirou. 
            Solicite um novo link de recuperação.
          </p>
          <div className="flex justify-center">
            <Link href="/auth/forgot-password">
              <Button variant="outline" size="sm">
                Solicitar novo link
              </Button>
            </Link>
          </div>
        </Alert>
      </AuthLayout>
    )
  }

  if (success) {
    return (
      <AuthLayout
        title="Senha alterada com sucesso"
        subtitle="Sua senha foi redefinida"
      >
        <Alert variant="success" title="Senha redefinida!">
          <div className="flex items-center mb-3">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <span>Sua senha foi alterada com sucesso.</span>
          </div>
          <div className="flex justify-center">
            <Link href="/auth/login">
              <Button size="sm">
                Fazer login
              </Button>
            </Link>
          </div>
        </Alert>
      </AuthLayout>
    )
  }

  if (validToken === null) {
    return (
      <AuthLayout title="Carregando..." subtitle="Verificando link de recuperação">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Redefinir senha"
      subtitle="Digite sua nova senha"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="error" title="Erro ao redefinir senha">
            {error}
          </Alert>
        )}

        <div className="relative">
          <Input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            label="Nova senha"
            placeholder="Digite sua nova senha"
            error={errors.password?.message}
            autoComplete="new-password"
          />
          <button
            type="button"
            className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        <div className="relative">
          <Input
            {...register('confirmPassword')}
            type={showConfirmPassword ? 'text' : 'password'}
            label="Confirmar nova senha"
            placeholder="Confirme sua nova senha"
            error={errors.confirmPassword?.message}
            autoComplete="new-password"
          />
          <button
            type="button"
            className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        <Button
          type="submit"
          className="w-full"
          loading={loading}
          disabled={loading}
        >
          Redefinir senha
        </Button>

        <div className="text-center">
          <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-800">
            Voltar para o login
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}