export interface ConfirmBookingActionState {
  status: 'idle' | 'success' | 'error'
  message?: string
}
