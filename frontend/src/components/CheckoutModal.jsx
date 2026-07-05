import React, { useState } from 'react'
import './CheckoutModal.css'

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const api = (path) => `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`

function CheckoutModal({ isOpen, onClose, cart, deliveryInfo, onOrderCreated, locale }) {
  const [recipient, setRecipient] = useState({ name: '', email: '', phone: '', city: '' })
  const [sender, setSender] = useState({ name: '', email: '', phone: '' })
  const [giftMessage, setGiftMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [payLink, setPayLink] = useState(null)
  const [error, setError] = useState(null)
  const [orderData, setOrderData] = useState(null)

  if (!isOpen) return null

  const handleCreateOrder = async () => {
    if (!recipient.name || !recipient.phone || !recipient.city) {
      setError(locale === 'ta' ? 'Name, phone, city fill pannu machan!' : locale === 'si' ? 'නම, දුරකථන අංක, නගරය ඇතුළත් කරන්න.' : 'Please fill recipient name, phone and city.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const payload = {
        cart: cart.map(item => ({ product_id: item.product_id, quantity: item.quantity })),
        recipient: { ...recipient },
        delivery: { city: recipient.city, date: deliveryInfo?.date },
        sender: sender.name ? { ...sender } : undefined,
        giftMessage: giftMessage || undefined,
        currency: 'LKR'
      }
      const res = await fetch(api('/api/create-order'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (data && (data.pay_link || data.payLink)) {
        const link = data.pay_link || data.payLink
        setPayLink(link)
        setOrderData(data)
        if (onOrderCreated) onOrderCreated(data)
      } else {
        setError(locale === 'ta' ? 'Order create aayiduchu but pay link illa' : 'Order created but no pay link returned')
      }
    } catch (err) {
      console.error('Create order error', err)
      setError(locale === 'ta' ? 'Order create panna mudiyala da!' : 'Failed to create order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal checkout-modal">
        <div className="modal-header">
          <h3>{locale === 'si' ? 'ඇඳුම් කිරීම' : locale === 'ta' ? 'Checkout' : 'Checkout'}</h3>
          <button className="close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {payLink ? (
            <div className="paylink">
              <p>{locale === 'ta' ? 'Order create aayiduchu! Pay link click pannu:' : locale === 'si' ? 'ඇඳුම් සාර්ථකයි! ගෙවුම් ලින්ක් මත ක්ලික් කරන්න:' : 'Order created! Click the link below to pay and complete your order:'}</p>
              <a href={payLink} target="_blank" rel="noreferrer" className="pay-link">💳 {locale === 'ta' ? 'Pay Link' : locale === 'si' ? 'ගෙවුම් ලින්ක්' : 'Open Pay Link'} →</a>
              <p className="note">Prices are locked for 60 minutes.</p>
            </div>
          ) : (
            <>
              <div className="checkout-section">
                <div className="checkout-label-row">
                  <span className="checkout-label">{locale === 'ta' ? 'Recipient Details' : locale === 'si' ? 'ලබා ගන්නා අයගේ තොරතුරු' : 'Recipient Details'}</span>
                </div>
                <label>{locale === 'ta' ? '👤 Name' : locale === 'si' ? 'නම' : 'Recipient name'}</label>
                <input value={recipient.name} onChange={(e) => setRecipient({...recipient, name: e.target.value})} placeholder={locale === 'ta' ? 'Inga type pannu' : locale === 'si' ? 'නම ඇතුළත් කරන්න' : 'Full name'} />
                <label>{locale === 'ta' ? '📱 Phone' : locale === 'si' ? 'දුරකථන අංකය' : 'Recipient phone'}</label>
                <input value={recipient.phone} onChange={(e) => setRecipient({...recipient, phone: e.target.value})} placeholder="07X XXX XXXX" />
                <label>{locale === 'ta' ? '📍 City' : locale === 'si' ? 'නගරය' : 'Recipient city'}</label>
                <input value={recipient.city} onChange={(e) => setRecipient({...recipient, city: e.target.value})} placeholder={locale === 'ta' ? 'Colombo, Kandy...' : locale === 'si' ? 'කොළඹ, කන්ද...' : 'Colombo, Kandy...'} />
                <label>{locale === 'ta' ? '📧 Email (optional)' : locale === 'si' ? 'විද්‍යුත් ලිපිනය (විකල්ප)' : 'Recipient email (optional)'}</label>
                <input value={recipient.email} onChange={(e) => setRecipient({...recipient, email: e.target.value})} placeholder="email@example.com" />
              </div>

              <div className="checkout-section">
                <div className="checkout-label-row">
                  <span className="checkout-label">{locale === 'ta' ? 'Sender (Gift mode)' : locale === 'si' ? 'යවන්නා (ගිft් මාතරය)' : 'Sender (optional, for gifts)'}</span>
                </div>
                <label>{locale === 'ta' ? '👤 Name' : locale === 'si' ? 'යවන්නාගේ නම' : 'Sender name'}</label>
                <input value={sender.name} onChange={(e) => setSender({...sender, name: e.target.value})} placeholder={locale === 'ta' ? 'Sollu machan' : locale === 'si' ? 'නම' : 'Your name'} />
                <label>{locale === 'ta' ? '📝 Gift Message' : locale === 'si' ? 'අරුත පණිවිඩය' : 'Gift message'}</label>
                <textarea value={giftMessage} onChange={(e) => setGiftMessage(e.target.value)} placeholder={locale === 'ta' ? 'Unkalukka enna ennavendum solli vekkanum da!' : locale === 'si' ? 'ඔබගේ අනතුරු පණිවිඩය මෙතැනට ටයිප් කරන්න...' : 'Write a heartfelt message for the recipient...'} rows={3} />
              </div>

              {error && <div className="error">{error}</div>}
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>{locale === 'ta' ? 'Thavippen' : locale === 'si' ? 'වසා දැමීමට' : 'Close'}</button>
          {!payLink && <button className="btn-primary" onClick={handleCreateOrder} disabled={loading}>{loading ? 'Creating…' : (locale === 'ta' ? 'Order Create Pannu' : locale === 'si' ? 'ඇඳුම් සකසන්න' : 'Create Order')}</button>}
        </div>
      </div>
    </div>
  )
}

export default CheckoutModal
