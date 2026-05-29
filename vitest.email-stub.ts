// Stub Vitest pour les sous-chemins prettier importes par @react-email/render.
// @react-email/render charge `prettier/plugins/html` + `prettier/standalone`
// au niveau module uniquement pour le pretty-print du HTML. Nos tests de templates
// utilisent renderToStaticMarkup et n'appellent jamais render(), donc ces imports
// doivent juste se charger sans planter (le sous-chemin n'est pas resolvable ici).
export const format = (input: string) => input
export default {}
