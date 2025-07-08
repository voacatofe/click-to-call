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
import { SignUpFormData } from '@/types/auth'
import { signUpSchema } from '@/lib/validation'

export default function RegisterPage() {
  const router = useRouter()
  const { signUp, loading, error } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema)
  })

  const onSubmit = async (data: SignUpFormData) => {
    try {
      await signUp(data)
      setSuccess(true)
    } catch (error: any) {
      if (error.message.includes('already registered')) {
        setFormError('email', {
          type: 'manual',
          message: 'Este email já está cadastrado'
        })
      }
    }
  }

  if (success) {
    return (
      <AuthLayout
        title="Verifique seu email"
        subtitle="Enviamos um link de confirmação para o seu email"
      >
        <Alert variant="success" title="Cadastro realizado com sucesso!">
          <p className="mb-3">
            Verifique sua caixa de entrada e clique no link de confirmação para ativar sua conta.
          </p>
          <div className="flex justify-center">
            <Link href="/auth/login">
              <Button variant="outline" size="sm">
                Voltar para o login
              </Button>
            </Link>
          </div>
        </Alert>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Criar conta"
      subtitle="Preencha os dados para criar sua conta"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="error" title="Erro no cadastro">
            {error}
          </Alert>
        )}

        <Input
          {...register('fullName')}
          label="Nome completo"
          placeholder="Digite seu nome completo"
          error={errors.fullName?.message}
          autoComplete="name"
        />

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
            label="Confirmar senha"
            placeholder="Confirme sua senha"
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
          Criar conta
        </Button>

        <div className="text-center">
          <span className="text-sm text-gray-600">
            Já tem uma conta?{' '}
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Fazer login
            </Link>
          </span>
        </div>
      </form>
    </AuthLayout>
  )
}