'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

import { signUp, signIn } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

const registerSchema = z
  .object({
    name: z.string().min(2, 'Prénom et nom requis (2 caractères min)'),
    email: z.string().email('Email invalide'),
    password: z.string().min(8, '8 caractères minimum'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null)
    setIsLoading(true)

    await signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
      fetchOptions: {
        onResponse: (ctx) => {
          if (ctx.response.status === 429) {
            setServerError('Trop de tentatives. Réessaie dans quelques secondes.')
            setIsLoading(false)
          }
          if (ctx.response.status === 422) {
            setServerError('Un compte avec cet email existe déjà.')
            setIsLoading(false)
          }
        },
        onSuccess: () => {
          // Redirect vers page de vérification email
          window.location.href = '/verify-email'
        },
        onError: () => {
          setServerError('Une erreur est survenue. Réessaie.')
          setIsLoading(false)
        },
      },
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      {/* Nom complet */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="register-name">Nom complet</Label>
        <Input
          id="register-name"
          type="text"
          autoComplete="name"
          placeholder="Jean Dupont"
          aria-invalid={!!errors.name}
          {...register('name')}
        />
        {errors.name && (
          <p className="text-destructive text-xs" role="alert">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="register-email">Adresse email</Label>
        <Input
          id="register-email"
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

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="register-password">Mot de passe</Label>
        <div className="relative">
          <Input
            id="register-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="8 caractères minimum"
            aria-invalid={!!errors.password}
            className="pr-10"
            {...register('password')}
          />
          <button
            type="button"
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            onClick={() => setShowPassword((v) => !v)}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-destructive text-xs" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="register-confirm-password">Confirmer le mot de passe</Label>
        <Input
          id="register-confirm-password"
          type={showPassword ? 'text' : 'password'}
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

      {/* Erreur serveur */}
      {serverError && (
        <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm" role="alert">
          {serverError}
        </p>
      )}

      {/* Submit */}
      <Button id="register-submit" type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Création du compte…
          </>
        ) : (
          'Créer mon compte'
        )}
      </Button>

      <Separator />

      {/* Google OAuth */}
      <Button
        id="register-google"
        type="button"
        variant="outline"
        className="w-full"
        disabled={isLoading}
        onClick={() =>
          signIn.social({
            provider: 'google',
            callbackURL: '/client',
          })
        }
      >
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continuer avec Google
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        Déjà un compte ?{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  )
}
