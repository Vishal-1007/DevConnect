import { apiUrl } from '../config'

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

export async function openRazorpayCheckout(options: {
  amount: number
  currency: string
  description: string
  keyId: string
  idempotencyKey: string
}): Promise<{ id: string }> {
  await loadRazorpayScript()

  const orderRes = await fetch(apiUrl('/api/payments/razorpay/orders'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('devconnect_access_token') ?? ''}`,
    },
    body: JSON.stringify({
      amount: options.amount,
      currency: options.currency,
      description: options.description,
      idempotencyKey: options.idempotencyKey,
    }),
  })
  if (!orderRes.ok) throw new Error(await orderRes.text())
  const order = await orderRes.json() as { orderId: string; amount: number; currency: string; keyId: string; description: string }

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay!({
      key: order.keyId,
      amount: Math.round(order.amount * 100),
      currency: order.currency,
      name: 'DevConnect',
      description: order.description,
      order_id: order.orderId,
      theme: { color: '#7c3aed' },
      handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        try {
          const verifyRes = await fetch(apiUrl('/api/payments/razorpay/verify'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('devconnect_access_token') ?? ''}`,
            },
            body: JSON.stringify({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              description: options.description,
              idempotencyKey: options.idempotencyKey,
            }),
          })
          if (!verifyRes.ok) throw new Error(await verifyRes.text())
          const payment = await verifyRes.json() as { id: string }
          resolve(payment)
        } catch (err) {
          reject(err)
        }
      },
      modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
    })
    rzp.open()
  })
}
