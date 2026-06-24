import { useState, useEffect, useRef } from 'react'
import './App.css'
import ProductCard from './components/ProductCard'
import Cart from './components/Cart'
import DeliveryModal from './components/DeliveryModal'
import CheckoutModal from './components/CheckoutModal'

function App() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'agent',
      text: 'Ayubowan! 👋 Welcome to Kapruka Shopping Agent. What can I help you find today?',
      timestamp: new Date()
    }
  ])
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentProducts, setCurrentProducts] = useState([])
  const [showProducts, setShowProducts] = useState(false)
  const messagesEndRef = useRef(null)
  const [deliveryOpen, setDeliveryOpen] = useState(false)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: input,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Send to backend
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      })
      const data = await response.json()
      
      // Add agent response
      const agentMessage = {
        id: messages.length + 2,
        type: 'agent',
        text: data.reply,
        products: data.products || [],
        timestamp: new Date()
      }
      setMessages(prev => [...prev, agentMessage])

      // If products returned, display them
      if (data.products && data.products.length > 0) {
        setCurrentProducts(data.products)
        setShowProducts(true)
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, {
        id: messages.length + 2,
        type: 'agent',
        text: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product_id === product.id)
      if (existingItem) {
        return prevCart.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        return [...prevCart, {
          product_id: product.id,
          name: product.name,
          price: product.selling_price || product.price || 0,
          image_url: product.image_url,
          quantity: 1
        }]
      }
    })
    
    // Show feedback
    const confirmMessage = {
      id: messages.length + 1,
      type: 'agent',
      text: `✅ Added "${product.name}" to your cart!`,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, confirmMessage])
  }

  const handleRemoveFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.product_id !== productId))
  }

  const handleCheckout = () => {
    // Open delivery modal before completing order
    setShowProducts(false)
    setCartOpen(false)
    setDeliveryOpen(true)
  }

  const [deliveryOpen, setDeliveryOpen] = useState(false)

  const handleDeliveryConfirm = ({ city, date, delivery }) => {
    // delivery contains MCP response; show confirmation in chat
    const msg = {
      id: messages.length + 1,
      type: 'agent',
      text: `Delivery to ${city.name || city.canonical || city} on ${date}: ${delivery.can_deliver ? 'Available' : 'Not available'}`,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, msg])
    setDeliveryOpen(false)
    // Open checkout modal next
    setCheckoutOpen(true)
  }

  const [checkoutOpen, setCheckoutOpen] = useState(false)

  const handleViewDetails = (product) => {
    const detailsMessage = {
      id: messages.length + 1,
      type: 'agent',
      text: `📋 ${product.name}\n\nPrice: LKR ${(product.selling_price || product.price || 0).toLocaleString()}\nStock: ${product.in_stock ? '✅ Available' : '❌ Out of Stock'}\n\n${product.description || 'No description available'}`,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, detailsMessage])
  }

  return (
    <div className="app">
      <div className="chat-container">
        <div className="chat-header">
          <div className="header-left">
            <h1>🛍️ Kapruka Shopping Agent</h1>
          </div>
          <button 
            className="cart-button"
            onClick={() => setCartOpen(!cartOpen)}
          >
            🛒 Cart ({cart.length})
          </button>
        </div>

        <div className="chat-content">
          <div className="messages">
            {messages.map(msg => (
              <div key={msg.id} className={`message ${msg.type}`}>
                <div className="message-content">
                  {msg.text}
                </div>
                <div className="message-time">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            
            {showProducts && currentProducts.length > 0 && (
              <div className="products-carousel">
                <div className="carousel-title">Available Products:</div>
                <div className="products-grid">
                  {currentProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="message agent">
                <div className="message-content">
                  <div className="typing">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="input-form">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message... (e.g., 'Find flowers', 'Search electronics')"
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              Send
            </button>
          </form>
        </div>
      </div>

      <Cart
        items={cart}
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onRemove={handleRemoveFromCart}
        onCheckout={handleCheckout}
      />
      <DeliveryModal
        isOpen={deliveryOpen}
        onClose={() => setDeliveryOpen(false)}
        onConfirm={handleDeliveryConfirm}
        cart={cart}
      />
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cart={cart}
        deliveryInfo={{ date: '' }}
      />
    </div>
  )
}

export default App
