import type { LucideIcon } from 'lucide-react'
import { CreditCard, Smartphone, Wallet } from 'lucide-react'

export type PaymentModeId = 'CARD' | 'UPI' | 'GPAY' | 'BHIM' | 'PAYTM' | 'PHONEPE'

export interface PaymentModeVisual {
  id: PaymentModeId
  label: string
  description: string
  category: 'cards' | 'upi' | 'wallets'
  accent: string
  accentMuted: string
  monogram: string
  icon: LucideIcon
}

/** Fallback catalog when /api/payments/modes is unavailable */
export const PAYMENT_MODE_CATALOG: PaymentModeVisual[] = [
  {
    id: 'CARD',
    label: 'Debit / Credit Card',
    description: 'Visa, Mastercard, Amex',
    category: 'cards',
    accent: '#6366f1',
    accentMuted: 'rgba(99,102,241,0.15)',
    monogram: 'CARD',
    icon: CreditCard,
  },
  {
    id: 'UPI',
    label: 'UPI',
    description: 'Any UPI app or VPA',
    category: 'upi',
    accent: '#22c55e',
    accentMuted: 'rgba(34,197,94,0.15)',
    monogram: 'UPI',
    icon: Smartphone,
  },
  {
    id: 'GPAY',
    label: 'Google Pay',
    description: 'Pay with GPay UPI',
    category: 'wallets',
    accent: '#4285f4',
    accentMuted: 'rgba(66,133,244,0.15)',
    monogram: 'G',
    icon: Wallet,
  },
  {
    id: 'BHIM',
    label: 'BHIM UPI',
    description: 'Government UPI app',
    category: 'upi',
    accent: '#0ea5e9',
    accentMuted: 'rgba(14,165,233,0.15)',
    monogram: 'BHIM',
    icon: Smartphone,
  },
  {
    id: 'PAYTM',
    label: 'Paytm',
    description: 'Wallet or Paytm UPI',
    category: 'wallets',
    accent: '#00baf2',
    accentMuted: 'rgba(0,186,242,0.15)',
    monogram: 'P',
    icon: Wallet,
  },
  {
    id: 'PHONEPE',
    label: 'PhonePe',
    description: 'PhonePe UPI',
    category: 'wallets',
    accent: '#5f259f',
    accentMuted: 'rgba(95,37,159,0.15)',
    monogram: 'Pe',
    icon: Wallet,
  },
]

export const PAYMENT_MODE_BY_ID = Object.fromEntries(
  PAYMENT_MODE_CATALOG.map((mode) => [mode.id, mode])
) as Record<PaymentModeId, PaymentModeVisual>

export const CATEGORY_LABELS: Record<PaymentModeVisual['category'], string> = {
  cards: 'Cards',
  upi: 'UPI',
  wallets: 'Wallets & apps',
}
