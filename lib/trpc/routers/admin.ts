// Router tRPC admin : actions reservees aux administrateurs plateforme.
import { z } from 'zod'
import { Role } from '@/generated/prisma/enums'
import { adminProcedure, router } from '../init'

export const adminRouter = router({
  /**
   * Change le role plateforme d'un utilisateur (ADMIN | CLIENT).
   * Garde adminProcedure -> role verifie frais en BDD cote serveur.
   */
  updateUserRole: adminProcedure
    .input(z.object({ userId: z.string().min(1), role: z.enum(Role) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
      })

      return { success: true }
    }),
})
