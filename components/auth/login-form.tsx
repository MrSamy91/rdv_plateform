'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

import { signIn } from '@/lib/auth/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

type LoginFormValues = z.infer<typeof loginSchema>

interface LoginFormProps {
  callbackUrl?: string
}

function normalizeCallbackUrl(callbackUrl?: string) {
  if (!callbackUrl) {
    return '/client'
  }

  return callbackUrl.startsWith('/') ? callbackUrl : '/client'
}

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const redirectUrl = normalizeCallbackUrl(callbackUrl)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(values: LoginFormValues) {
    setServerError(null)
    setIsLoading(true)

    await signIn.email({
      email: values.email,
      password: values.password,
      fetchOptions: {
        onResponse: (ctx) => {
          // 429 = rate limit BetterAuth (brute force protection)
          if (ctx.response.status === 429) {
            setServerError('Trop de tentatives. Réessaie dans quelques secondes.')
            setIsLoading(false)
          }
        },
        onSuccess: () => {
          // Cookie garanti écrit — redirect safe
          window.location.href = redirectUrl
        },
        onError: () => {
          setServerError('Email ou mot de passe incorrect.')
          setIsLoading(false)
        },
      },
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-email">Adresse email</Label>
        <Input
          id="login-email"
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
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password">Mot de passe</Label>
          <Link
            href="/forgot-password"
            className="text-muted-foreground hover:text-primary text-xs transition-colors"
          >
            Mot de passe oublié ?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
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

      {/* Erreur serveur */}
      {serverError && (
        <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm" role="alert">
          {serverError}
        </p>
      )}

      {/* Submit */}
      <button
        id="login-submit"
        type="submit"
        className="w-full rounded-xl py-3 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        style={{ background: '#489B6E' }}
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Connexion…
          </span>
        ) : (
          'Se connecter'
        )}
      </button>

      <Separator />

      {/* Google OAuth */}
      <button
        id="login-google"
        type="button"
        className="flex w-full items-center justify-center gap-2.5 rounded-xl border py-3 text-sm font-medium transition-all hover:bg-black/5 active:scale-[0.98] disabled:opacity-50"
        style={{ borderColor: 'rgba(37,49,34,0.15)', color: '#253122' }}
        disabled={isLoading}
        onClick={() =>
          signIn.social({
            provider: 'google',
            callbackURL: redirectUrl,
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
      </button>

      <p className="text-muted-foreground text-center text-sm">
        Pas encore de compte ?{' '}
        <Link
          href="/register"
          className="font-semibold hover:underline"
          style={{ color: '#489B6E' }}
        >
          Créer un compte
        </Link>
      </p>
    </form>
  )
}
