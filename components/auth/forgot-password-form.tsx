'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authClient } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
})

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  async function onSubmit(values: ForgotPasswordValues) {
    setServerError(null)
    setIsLoading(true)

    await authClient.requestPasswordReset({
      email: values.email,
      redirectTo: '/reset-password',
      fetchOptions: {
        onResponse: (ctx: { response: Response }) => {
          if (ctx.response.status === 429) {
            setServerError('Trop de tentatives. Reessaie dans quelques secondes.')
            setIsLoading(false)
          }
        },
        onSuccess: () => {
          setSent(true)
          setIsLoading(false)
        },
        onError: () => {
          setSent(true)
          setIsLoading(false)
        },
      },
    })
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <CheckCircle className="text-primary size-12" />
        <div>
          <p className="font-semibold">Email envoye</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Si un compte existe pour{' '}
            <span className="text-foreground font-medium">{getValues('email')}</span>, un lien de
            reinitialisation sera envoye.
          </p>
        </div>
        <Link href="/login" className="text-primary text-sm font-medium hover:underline">
          Retour a la connexion
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="forgot-email">Adresse email</Label>
        <Input
          id="forgot-email"
          type="email"
          autoComplete="email"
          placeholder="toi@exemple.fr"
          aria-invalid={!!errors.email}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-destructive text-xs" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      {serverError && (
        <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm" role="alert">
          {serverError}
        </p>
      )}

      <Button id="forgot-submit" type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Envoi en cours...
          </>
        ) : (
          'Envoyer le lien'
        )}
      </Button>

      <Link
        href="/login"
        className="text-muted-foreground hover:text-foreground text-center text-sm transition-colors"
      >
        Retour a la connexion
      </Link>
    </form>
  )
}
