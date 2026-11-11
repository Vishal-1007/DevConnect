import { apiUrl } from '../config'
import type { RecruiterPlanType } from '../types/recruiterSubscription'

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void }
  }
}

function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout'))
    document.body.appendChild(script)
  })
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('devconnect_access_token') ?? ''}`,
  }
}

export async function completeRecruiterUpgradeCheckout(planType: RecruiterPlanType): Promise<void> {
  await loadRazorpayScript()
  const idempotencyKey = `recruiter-upgrade-${planType}-${Date.now()}`

  const orderRes = await fetch(
    apiUrl(`/api/payments/recruiter/subscription/upgrade/order?planType=${planType}`),
    { method: 'POST', headers: authHeaders() },
  )
  if (!orderRes.ok) throw new Error(await orderRes.text())
  const order = (await orderRes.json()) as {
    orderId: string
    amount: number
    currency: string
    keyId: string
    description: string
  }

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay!({
      key: order.keyId,
      amount: Math.round(order.amount * 100),
      currency: order.currency,
      name: 'DevConnect',
      description: order.description,
      order_id: order.orderId,
      theme: { color: '#7c3aed' },
      handler: async (response: {
        razorpay_order_id: string
        razorpay_payment_id: string
        razorpay_signature: string
      }) => {
        try {
          const confirmRes = await fetch(
            apiUrl('/api/payments/recruiter/subscription/upgrade/confirm'),
            {
              method: 'POST',
              headers: authHeaders(),
              body: JSON.stringify({
                planType,
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                idempotencyKey,
              }),
            },
          )
          if (!confirmRes.ok) throw new Error(await confirmRes.text())
          resolve()
        } catch (err) {
          reject(err)
        }
      },
      modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
    })
    rzp.open()
  })
}
