/** Returns Tailwind className for the primary action button based on the current user's company/role. */
export function getPrimaryBtnClass(role?: string, company?: string | null): string {
  if (role === 'ADMIN' || company === 'STATE_GRID') {
    return 'bg-[#008C6A] hover:bg-[#006B50] text-white'
  }
  return 'bg-red-600 hover:bg-red-700 text-white'
}
