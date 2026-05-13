import { RewardStatus } from '@/generated/prisma/enums'
import { db } from '@/lib/db'

export async function getClientRewardsOverview(clientId: string) {
  const user = await db.user.findUnique({
    where: { id: clientId },
    select: {
      loyaltyPoints: true,
    },
  })

  const rewards = await db.reward.findMany({
    where: {
      clientId,
      status: RewardStatus.AVAILABLE,
    },
    select: {
      id: true,
      type: true,
      status: true,
      expirationDate: true,
    },
    orderBy: { expirationDate: 'asc' },
  })

  return {
    loyaltyPoints: user?.loyaltyPoints ?? 0,
    availableRewards: rewards.map((reward) => ({
      ...reward,
      expirationDate: reward.expirationDate.toISOString(),
    })),
  }
}
