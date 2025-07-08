'use client'

import { useState } from 'react'

// Force dynamic rendering for auth pages
export const dynamic = 'force-dynamic'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'

import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { useAuth } from '@/hooks/useAuth'
import { SignInFormData } from '@/types/auth'
import { signInSchema } from '@/lib/validation'

export default function LoginPage() {
  const router = useRouter()
  const { signIn, loading, error } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema)
  })

  const onSubmit = async (data: SignInFormData) => {
    try {
      await signIn(data)
      router.push('/') // Redirect to home after successful login
    } catch (error: any) {
      if (error.message.includes('Invalid login credentials')) {
        setFormError('email', {
          type: 'manual',
          message: 'Email ou senha incorretos'
        })
        setFormError('password', {
          type: 'manual',
          message: 'Email ou senha incorretos'
        })
      } else if (error.message.includes('Email not confirmed')) {
        setFormError('email', {
          type: 'manual',
          message: 'Verifique seu email e confirme sua conta'
        })
      }
    }
  }

  return (
    <AuthLayout
      title="Entrar na sua conta"
      subtitle="Digite seus dados para fazer login"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="error" title="Erro no login">
            {error}
          </Alert>
        )}

        <Input
          {...register('email')}
          type="email"
          label="Email"
          placeholder="Digite seu email"
          error={errors.email?.message}
          autoComplete="email"
        />

        <div className="relative">
          <Input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            label="Senha"
            placeholder="Digite sua senha"
            error={errors.password?.message}
            autoComplete="current-password"
          />
          <button
            type="button"
            className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link href="/auth/forgot-password" className="text-blue-600 hover:text-blue-700">
              Esqueceu sua senha?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          loading={loading}
          disabled={loading}
        >
          Entrar
        </Button>

        <div className="text-center">
          <span className="text-sm text-gray-600">
            Não tem uma conta?{' '}
            <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-medium">
              Criar conta
            </Link>
          </span>
        </div>
      </form>
    </AuthLayout>
  )
}