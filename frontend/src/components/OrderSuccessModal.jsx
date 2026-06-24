import React, { useState } from 'react'
import './OrderSuccessModal.css'

function OrderSuccessModal({ isOpen, onClose, order, onTrack, locale }) {
  const [trackQuery, setTrackQuery] = useState('')
  const [tracking, setTracking] = useState(false)

  if (!isOpen) return null

  const handleTrack = () => {
    if (!trackQuery.trim()) return
    setTracking(true)
    onTrack(trackQuery.trim())
    setTimeout(() => setTracking(false), 1000)
  }

  return (
    <div className="modal-overlay success-overlay">
      <div className="success-modal">
        <div className="success-icon">🎉</div>
        <h3>{locale === 'si' ? 'ඇඳුම් සාර්ථක!' : locale === 'ta' ? 'Order success da!' : 'Order placed successfully!'}</h3>
        
        {order && (
          <div className="success-details">
            <p><strong>Order:</strong> {order.order_number || 'N/A'}</p>
            <p><strong>Total:</strong> LKR {order.total ? order.total.toLocaleString() : 'N/A'}</p>
            {order.pay_link && (
              <a href={order.pay_link} target="_blank" rel="noreferrer" className="pay-link-btn">
                💳 {locale === 'si' ? 'ගෙවුම් ලි้ง్క් විවෘත කරන්න' : locale === 'ta' ? 'Pay link open pannunga' : 'Open Pay Link to Complete Payment'} →
              </a>
            )}
          </div>
        )}

        <div className="track-section">
          <p>{locale === 'si' ? 'පණිවිඩයෙහි ඇඳුම් අංකය ගැනීමට' : locale === 'ta' ? 'Order track panna order number sollunga' : 'Track your order (enter order number)'}</p>
          <div className="track-input-row">
            <input 
              value={trackQuery}
              onChange={(e) => setTrackQuery(e.target.value)}
              placeholder={locale === 'si' ? 'ඇඳුම් අංකය' : locale === 'ta' ? 'Order number' : 'Order number'}
            />
            <button onClick={handleTrack} disabled={tracking || !trackQuery.trim()}>
              {tracking ? 'Track...' : 'Track'}
            </button>
          </div>
        </div>

        <button className="success-close-btn" onClick={onClose}>
          {locale === 'si' ? 'වසා දැමීමට' : locale === 'ta' ? 'Close' : 'Close'}
        </button>
      </div>
    </div>
  )
}

export default OrderSuccessModal
