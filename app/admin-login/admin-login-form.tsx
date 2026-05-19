'use client'

import { useActionState, useState } from 'react'
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { adminLogin } from './actions'

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(adminLogin, null)
  const [showPass, setShowPass] = useState(false)

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {/* Identifiant */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="admin-user">Identifiant</Label>
        <Input
          id="admin-user"
          name="user"
          type="text"
          autoComplete="username"
          placeholder="admin"
          required
        />
      </div>

      {/* Mot de passe */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="admin-pass">Mot de passe</Label>
        <div className="relative">
          <Input
            id="admin-pass"
            name="pass"
            type={showPass ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            required
            className="pr-10"
          />
          <button
            type="button"
            aria-label={showPass ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            onClick={() => setShowPass((v) => !v)}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Erreur serveur */}
      {state?.error && (
        <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm" role="alert">
          {state.error}
        </p>
      )}

      {/* Submit */}
      <button
        id="admin-login-submit"
        type="submit"
        className="w-full rounded-xl py-3 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        style={{ background: '#489B6E' }}
        disabled={pending}
      >
        {pending ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Connexion…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <ShieldCheck size={16} />
            Accéder au dashboard
          </span>
        )}
      </button>

      {/* Badge sécurité */}
      <p className="text-muted-foreground text-center text-xs">
        Accès restreint aux administrateurs CutBook
      </p>
    </form>
  )
}
