export function normalizePublicOrgSlug(orgSlug: string) {
  return orgSlug.startsWith('@') ? orgSlug.slice(1) : orgSlug
}

export function getPublicOrgHref(orgSlug: string) {
  return `/${normalizePublicOrgSlug(orgSlug)}`
}

export function getPublicOrgBookingHref(orgSlug: string) {
  return `${getPublicOrgHref(orgSlug)}/booking`
}

type RouteSearch = string | URLSearchParams | Record<string, string | undefined>

function formatSearchSuffix(search?: RouteSearch) {
  if (!search) {
    return ''
  }

  const formattedSearch =
    typeof search === 'string'
      ? search.replace(/^\?/, '')
      : new URLSearchParams(
          Object.entries(search instanceof URLSearchParams ? Object.fromEntries(search) : search)
            .filter(([, value]) => value)
            .map(([key, value]) => [key, value as string]),
        ).toString()

  return formattedSearch ? `?${formattedSearch}` : ''
}

export function getPublicOrgBookingSlotHref(orgSlug: string, search?: RouteSearch) {
  return `${getPublicOrgBookingHref(orgSlug)}/slot${formatSearchSuffix(search)}`
}

export function getPublicOrgBookingConfirmHref(orgSlug: string, search?: RouteSearch) {
  return `${getPublicOrgBookingHref(orgSlug)}/confirm${formatSearchSuffix(search)}`
}

export function getPublicOrgBookingPaymentHref(orgSlug: string, search?: RouteSearch) {
  return `${getPublicOrgBookingHref(orgSlug)}/payment${formatSearchSuffix(search)}`
}
