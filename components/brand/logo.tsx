// Composant logo unifie de CutBook.
//
// Centralise les trois usages du logo dans toute l'application :
// - 'mark'     : monogramme CB seul (carre — favicon, sidebar collapsed, avatar)
// - 'wordmark' : mot "CutBook" image seul (footer, splash, hero)
// - 'compose'  : monogramme + texte "CutBook" CSS + sous-titre optionnel
//                (navbars, sidebars — necessaire pour afficher "Gerant", "Pro", "Admin")
//
// Pourquoi 'compose' garde le texte "CutBook" en CSS au lieu de l'image wordmark :
// 1. permet d'ajouter un sous-titre dynamique (variants par role)
// 2. le texte CSS herite naturellement de la couleur parent (utile pour sidebar
//    sombre vs claire — pas besoin de versions inversees du PNG)
// 3. plus leger et accessible (le mot lisible par screen reader sans alt manuel)
//
// Server Component compatible : aucune interactivite, juste rendu.

import Image from 'next/image'
import { cn } from '@/lib/utils'

type LogoVariant = 'mark' | 'wordmark' | 'compose'
type LogoSize = 'sm' | 'md' | 'lg'

interface LogoProps {
  variant?: LogoVariant
  size?: LogoSize
  // Sous-titre affiche apres "CutBook" en variant 'compose'. Ex: "Gerant", "Pro".
  subtitle?: string
  // priority=true pour les surfaces above-the-fold (navbar, sidebar).
  // Garder false pour le footer ou les contextes off-screen au load.
  priority?: boolean
  className?: string
}

// Tailles calees sur les usages reels :
// - sm : sidebars dashboard (~28px de hauteur)
// - md : navbar publique, footer (~36px)
// - lg : login splash, hero (~56px)
const sizeMap = {
  sm: { mark: 28, wordmarkW: 96, wordmarkH: 28, textClass: 'text-base' },
  md: { mark: 36, wordmarkW: 120, wordmarkH: 36, textClass: 'text-lg' },
  lg: { mark: 56, wordmarkW: 192, wordmarkH: 56, textClass: 'text-2xl' },
} as const

export function Logo({
  variant = 'compose',
  size = 'sm',
  subtitle,
  priority = false,
  className,
}: LogoProps) {
  const dims = sizeMap[size]

  if (variant === 'mark') {
    return (
      <Image
        src="/logo-mark.png"
        alt="CutBook"
        width={dims.mark}
        height={dims.mark}
        priority={priority}
        className={cn(className)}
        style={{ height: dims.mark, width: 'auto' }}
      />
    )
  }

  if (variant === 'wordmark') {
    return (
      <Image
        src="/logo-wordmark.png"
        alt="CutBook"
        width={dims.wordmarkW}
        height={dims.wordmarkH}
        priority={priority}
        className={cn(className)}
        style={{ height: dims.wordmarkH, width: 'auto' }}
      />
    )
  }

  // variant === 'compose' : monogramme + texte "CutBook" CSS + sous-titre optionnel
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Image
        src="/logo-mark.png"
        // alt vide : la presence du texte "CutBook" cote rend le mark
        // redondant pour les screen readers, on l'annonce qu'une fois.
        alt=""
        aria-hidden="true"
        width={dims.mark}
        height={dims.mark}
        priority={priority}
        style={{ height: dims.mark, width: dims.mark }}
      />
      <span className={cn('font-bold tracking-tight', dims.textClass)}>
        CutBook
        {subtitle && <span className="ml-1.5 text-xs font-normal opacity-50">{subtitle}</span>}
      </span>
    </span>
  )
}
