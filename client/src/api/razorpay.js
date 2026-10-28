// Loads Razorpay's Checkout script once, the first time someone buys credits.
let loading = null

export function loadCheckout() {
  if (window.Razorpay) return Promise.resolve()
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = resolve
    script.onerror = () => {
      loading = null // allow a retry
      reject(new Error('Could not load the payment window. Check your connection and try again.'))
    }
    document.body.appendChild(script)
  })
  return loading
}
