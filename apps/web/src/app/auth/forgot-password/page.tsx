'use client'

import { useState } from 'react'

// Force dynamic rendering for auth pages
export const dynamic = 'force-dynamic'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { useAuth } from '@/hooks/useAuth'
import { ForgotPasswordFormData } from '@/types/auth'
import { forgotPasswordSchema } from '@/lib/validation'

export default function ForgotPasswordPage() {
  const { resetPassword, loading, error } = useAuth()
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema)
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await resetPassword(data.email)
      setSuccess(true)
    } catch (error: any) {
      // Error is handled by the useAuth hook
    }
  }

  if (success) {
    return (
      <AuthLayout
        title="Email enviado"
        subtitle="Verifique sua caixa de entrada"
      >
        <Alert variant="success" title="Link de recuperação enviado!">
          <p className="mb-3">
            Enviamos um link de recuperação de senha para <strong>{getValues('email')}</strong>.
            Verifique sua caixa de entrada e spam.
          </p>
          <div className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSuccess(false)}
              className="w-full"
            >
              Enviar novamente
            </Button>
            <Link href="/auth/login" className="w-full">
              <Button variant="ghost" size="sm" className="w-full">
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
      title="Esqueceu sua senha?"
      subtitle="Digite seu email para receber um link de recuperação"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="error" title="Erro ao enviar email">
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
          helperText="Enviaremos um link de recuperação para este email"
        />

        <Button
          type="submit"
          className="w-full"
          loading={loading}
          disabled={loading}
        >
          Enviar link de recuperação
        </Button>

        <div className="text-center">
          <Link 
            href="/auth/login" 
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar para o login
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}