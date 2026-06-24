import React, { useState } from 'react'
import './CheckoutModal.css'

function CheckoutModal({ isOpen, onClose, cart, deliveryInfo }) {
  const [recipient, setRecipient] = useState({ name: '', email: '', phone: '', city: '' })
  const [sender, setSender] = useState({ name: '', email: '', phone: '' })
  const [giftMessage, setGiftMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [payLink, setPayLink] = useState(null)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const handleCreateOrder = async () => {
    if (!recipient.name || !recipient.phone || !recipient.city) {
      setError('Please fill recipient name, phone and city')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const orderPayload = {
        cart: cart.map(item => ({ product_id: item.product_id, quantity: item.quantity })),
        recipient: { ...recipient },
        delivery: { city: recipient.city, date: deliveryInfo?.date },
        sender: { ...sender },
        giftMessage,
        currency: 'LKR'
      }
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      })
      const data = await res.json()
      if (data && data.pay_link) {
        setPayLink(data.pay_link)
      } else if (data && data.payLink) {
        setPayLink(data.payLink)
      } else {
        setError('Order created but no pay link returned')
      }
    } catch (err) {
      console.error('Create order error', err)
      setError('Failed to create order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal checkout-modal">
        <div className="modal-header">
          <h3>Checkout</h3>
          <button className="close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {payLink ? (
            <div className="paylink">
              <p>Order created. Click the link below to pay and complete your order:</p>
              <a href={payLink} target="_blank" rel="noreferrer" className="pay-link">Open Pay Link</a>
              <p className="note">Prices are locked for 60 minutes.</p>
            </div>
          ) : (
            <>
              <label>Recipient name</label>
              <input value={recipient.name} onChange={(e) => setRecipient({...recipient, name: e.target.value})} />

              <label>Recipient phone</label>
              <input value={recipient.phone} onChange={(e) => setRecipient({...recipient, phone: e.target.value})} />

              <label>Recipient city</label>
              <input value={recipient.city} onChange={(e) => setRecipient({...recipient, city: e.target.value})} />

              <label>Recipient email (optional)</label>
              <input value={recipient.email} onChange={(e) => setRecipient({...recipient, email: e.target.value})} />

              <hr />

              <label>Sender name (optional)</label>
              <input value={sender.name} onChange={(e) => setSender({...sender, name: e.target.value})} />

              <label>Gift message (optional)</label>
              <textarea value={giftMessage} onChange={(e) => setGiftMessage(e.target.value)} />

              {error && <div className="error">{error}</div>}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
          {!payLink && <button className="btn-primary" onClick={handleCreateOrder} disabled={loading}>{loading ? 'Creating…' : 'Create Order'}</button>}
        </div>
      </div>
    </div>
  )
}

export default CheckoutModal
