import React from 'react'
import './Cart.css'

function Cart({ items, isOpen, onClose, onRemove, onCheckout }) {
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return (
    <>
      {isOpen && <div className="cart-overlay" onClick={onClose} />}
      
      <div className={`cart-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h2>🛒 Your Cart</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="cart-items">
          {items.length === 0 ? (
            <div className="empty-cart">
              <p>Your cart is empty</p>
              <p className="empty-hint">Add items to get started!</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product_id} className="cart-item">
<img 
                   src={item.image_url?.startsWith('http') || item.image_url?.startsWith('/')
                     ? item.image_url
                     : item.image_url
                       ? `https://www.kapruka.com/images/${item.image_url}`
                       : '/placeholder.png'} 
                   alt={item.name}
                   className="item-image"
                 />
                <div className="item-details">
                  <h4>{item.name}</h4>
                  <p className="item-price">
                    LKR {(item.price * item.quantity).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                  <div className="item-quantity">
                    <span>Qty: {item.quantity}</span>
                  </div>
                </div>
                <button 
                  className="remove-btn"
                  onClick={() => onRemove(item.product_id)}
                  title="Remove from cart"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>Total:</span>
              <span className="total-price">
                LKR {total.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <button 
              className="checkout-btn"
              onClick={onCheckout}
            >
              Proceed to Checkout →
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default Cart
