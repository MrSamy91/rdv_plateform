// @vitest-environment node

import 'dotenv/config'

import { beforeAll, describe, expect, it, vi } from 'vitest'
import { runSeed, seedUsers } from '@/prisma/seed'
import { db } from '@/lib/db'

// On mocke Stripe : pas d'appel reseau ni de cle requise. `sessions.create`
// renvoie un faux clientSecret ; `sessions.retrieve` est utilise par le
// fallback /return pour valider l'etat reel de la session paiement.
const { sessionsCreate, sessionsRetrieve } = vi.hoisted(() => ({
  sessionsCreate: vi.fn(),
  sessionsRetrieve: vi.fn(),
}))

vi.mock('@/lib/stripe', () => ({
  getStripe: () => ({
    checkout: { sessions: { create: sessionsCreate, retrieve: sessionsRetrieve } },
  }),
}))

import { createBookingCheckoutSession } from '@/lib/payments/checkout'
import { confirmCheckoutReturn } from '@/lib/payments/confirm-return'
import { markBookingPaid } from '@/lib/payments/webhook'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to run integration tests')
}

// Booking du seed : clientOne, service "cut" a 55 EUR, statut CONFIRMED.
const BOOKING_ID = 'seed-booking-confirmed'

describe('payments', () => {
  beforeAll(async () => {
    await runSeed()
    sessionsCreate.mockResolvedValue({ id: 'cs_test_x', client_secret: 'sec_x' })
  })

  it('refuse de payer la reservation d un autre client', async () => {
    const result = await createBookingCheckoutSession({
      bookingId: BOOKING_ID,
      clientId: seedUsers.clientTwo.id,
    })

    expect(result).toMatchObject({ ok: false, code: 'FORBIDDEN' })
  })

  it('refuse une reservation introuvable', async () => {
    const result = await createBookingCheckoutSession({
      bookingId: 'does-not-exist',
      clientId: seedUsers.clientOne.id,
    })

    expect(result).toMatchObject({ ok: false, code: 'NOT_FOUND' })
  })

  it('cree un Payment PENDING avec le montant de la BDD (jamais du client)', async () => {
    const result = await createBookingCheckoutSession({
      bookingId: BOOKING_ID,
      clientId: seedUsers.clientOne.id,
    })

    expect(result).toEqual({ ok: true, clientSecret: 'sec_x' })

    // Montant envoye a Stripe = totalPrice (55 EUR) en centimes.
    expect(sessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        ui_mode: 'embedded_page',
        mode: 'payment',
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({ unit_amount: 5500 }),
          }),
        ],
      }),
    )

    const payment = await db.payment.findUnique({ where: { bookingId: BOOKING_ID } })
    expect(payment?.status).toBe('PENDING')
    expect(payment?.amount).toBe(55)
    expect(payment?.stripeSessionId).toBe('cs_test_x')
  })

  it('marque le paiement reussi et reporte le PaymentIntent sur le booking', async () => {
    await markBookingPaid({
      sessionId: 'cs_test_x',
      paymentIntentId: 'pi_test_1',
      receiptUrl: 'https://stripe.test/receipt',
    })

    const payment = await db.payment.findUnique({ where: { bookingId: BOOKING_ID } })
    expect(payment?.status).toBe('SUCCEEDED')
    expect(payment?.stripePaymentIntentId).toBe('pi_test_1')
    expect(payment?.paidAt).toBeInstanceOf(Date)

    const booking = await db.booking.findUnique({ where: { id: BOOKING_ID } })
    expect(booking?.stripePaymentId).toBe('pi_test_1')
  })

  it('refuse un second paiement si la reservation est deja payee', async () => {
    const result = await createBookingCheckoutSession({
      bookingId: BOOKING_ID,
      clientId: seedUsers.clientOne.id,
    })

    expect(result).toMatchObject({ ok: false, code: 'ALREADY_PAID' })
  })

  it('est idempotent : un second webhook ne change rien', async () => {
    await markBookingPaid({
      sessionId: 'cs_test_x',
      paymentIntentId: 'pi_test_2_different',
      receiptUrl: 'https://stripe.test/other',
    })

    const payment = await db.payment.findUnique({ where: { bookingId: BOOKING_ID } })
    // Toujours le 1er PaymentIntent : le 2e appel est ignore.
    expect(payment?.stripePaymentIntentId).toBe('pi_test_1')
  })

  // === Fallback confirmCheckoutReturn (page /return) ===
  // En prod : le webhook fait foi et ce fallback est un no-op idempotent.
  // En dev sans `stripe listen` actif : ce fallback prend le relais et marque
  // payé en interrogeant directement l'API Stripe.

  it('confirmReturn : refuse si la session est inconnue', async () => {
    sessionsRetrieve.mockClear()
    const result = await confirmCheckoutReturn({
      sessionId: 'cs_unknown_xyz',
      clientId: seedUsers.clientOne.id,
    })
    expect(result).toEqual({ ok: false, code: 'NOT_FOUND' })
    // Court-circuit avant tout appel reseau Stripe.
    expect(sessionsRetrieve).not.toHaveBeenCalled()
  })

  it('confirmReturn : refuse si la session appartient a un autre client', async () => {
    sessionsRetrieve.mockClear()
    // cs_test_x est lie a seed-booking-confirmed (clientOne).
    const result = await confirmCheckoutReturn({
      sessionId: 'cs_test_x',
      clientId: seedUsers.clientTwo.id,
    })
    expect(result).toEqual({ ok: false, code: 'FORBIDDEN' })
    expect(sessionsRetrieve).not.toHaveBeenCalled()
  })

  it('confirmReturn : no-op idempotent si Payment deja SUCCEEDED (le webhook a gagne)', async () => {
    sessionsRetrieve.mockClear()
    const result = await confirmCheckoutReturn({
      sessionId: 'cs_test_x',
      clientId: seedUsers.clientOne.id,
    })
    expect(result).toEqual({ ok: true, alreadyPaid: true })
    // Court-circuit : pas besoin d'interroger Stripe si la BDD dit deja SUCCEEDED.
    expect(sessionsRetrieve).not.toHaveBeenCalled()
  })

  it('confirmReturn : marque paye via Stripe API si webhook n a pas fire', async () => {
    // Setup : un Payment PENDING tout frais sur seed-booking-completed (clientTwo).
    await db.payment.create({
      data: {
        bookingId: 'seed-booking-completed',
        amount: 42,
        currency: 'eur',
        status: 'PENDING',
        stripeSessionId: 'cs_return_fresh',
      },
    })

    // Stripe retourne une session payee avec un PI + recu (cas du happy path en dev).
    sessionsRetrieve.mockResolvedValueOnce({
      id: 'cs_return_fresh',
      payment_status: 'paid',
      status: 'complete',
      payment_intent: {
        id: 'pi_return_fresh',
        latest_charge: { receipt_url: 'https://stripe.test/return-receipt' },
      },
    })

    const result = await confirmCheckoutReturn({
      sessionId: 'cs_return_fresh',
      clientId: seedUsers.clientTwo.id,
    })

    expect(result).toEqual({ ok: true, alreadyPaid: false })

    const payment = await db.payment.findUnique({ where: { stripeSessionId: 'cs_return_fresh' } })
    expect(payment?.status).toBe('SUCCEEDED')
    expect(payment?.stripePaymentIntentId).toBe('pi_return_fresh')
    expect(payment?.receiptUrl).toBe('https://stripe.test/return-receipt')

    const booking = await db.booking.findUnique({ where: { id: 'seed-booking-completed' } })
    expect(booking?.stripePaymentId).toBe('pi_return_fresh')
  })
})
