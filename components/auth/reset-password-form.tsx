'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

import { authClient } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const resetSchema = z
  .object({
    password: z.string().min(8, '8 caractères minimum'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

type ResetFormValues = z.infer<typeof resetSchema>

export function ResetPasswordForm() {
  const searchParams = useSearchParams()
  // Le token est passé en query param par BetterAuth dans le lien email
  const token = searchParams.get('token') ?? ''

  const [done, setDone] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
  })

  async function onSubmit(values: ResetFormValues) {
    setServerError(null)
    setIsLoading(true)

    await authClient.resetPassword({
      token,
      newPassword: values.password,
      fetchOptions: {
        onResponse: (ctx) => {
          if (ctx.response.status === 400) {
            setServerError('Lien expiré ou invalide. Refais une demande de réinitialisation.')
            setIsLoading(false)
          }
        },
        onSuccess: () => {
          setDone(true)
          setIsLoading(false)
        },
        onError: () => {
          setServerError('Une erreur est survenue. Réessaie.')
          setIsLoading(false)
        },
      },
    })
  }

  if (!token) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-destructive text-sm">Lien de réinitialisation invalide.</p>
        <Link href="/forgot-password" className="text-primary text-sm hover:underline">
          Faire une nouvelle demande
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <CheckCircle className="text-primary size-12" />
        <div>
          <p className="font-semibold">Mot de passe modifié !</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Tu peux maintenant te connecter avec ton nouveau mot de passe.
          </p>
        </div>
        <Link href="/login" className="text-primary text-sm font-medium hover:underline">
          Se connecter
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reset-password">Nouveau mot de passe</Label>
        <Input
          id="reset-password"
          type="password"
          autoComplete="new-password"
          placeholder="8 caractères minimum"
          aria-invalid={!!errors.password}
          {...register('password')}
        />
        {errors.password && (
          <p className="text-destructive text-xs" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reset-confirm-password">Confirmer le mot de passe</Label>
        <Input
          id="reset-confirm-password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          aria-invalid={!!errors.confirmPassword}
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p className="text-destructive text-xs" role="alert">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {serverError && (
        <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm" role="alert">
          {serverError}
        </p>
      )}

      <Button id="reset-submit" type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Modification…
          </>
        ) : (
          'Modifier mon mot de passe'
        )}
      </Button>
    </form>
  )
}
