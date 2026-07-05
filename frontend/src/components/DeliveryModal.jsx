import React, { useState, useEffect } from 'react'
import './DeliveryModal.css'

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const api = (path) => `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`

async function fetchWithTimeout(url, options = {}, timeout = 20000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    return res
  } finally {
    clearTimeout(id)
  }
}

function DeliveryModal({ isOpen, onClose, onConfirm, cart }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [selectedCity, setSelectedCity] = useState(null)
  const [date, setDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setSuggestions([])
      setSelectedCity(null)
      setDate('')
      setResult(null)
    }
  }, [isOpen])

  const searchCities = async (q) => {
    if (!q) return setSuggestions([])
    try {
      const res = await fetchWithTimeout(api(`/api/cities?q=${encodeURIComponent(q)}&limit=10`))
      const data = await res.json()
      const cities = data.cities || data.matches || data || []
      setSuggestions(cities.map(c => typeof c === 'string' ? { name: c } : c))
    } catch (err) {
      console.error('City search error', err)
    }
  }

  useEffect(() => {
    const t = setTimeout(() => searchCities(query), 300)
    return () => clearTimeout(t)
  }, [query])

  const handleConfirm = async () => {
    if (!query && !selectedCity) return
    if (!date) return
    if (!cart || cart.length === 0) return
    setLoading(true)
    setResult(null)
    try {
      // Check delivery for the first product in cart for simplicity
      const productId = String(cart[0].product_id || cart[0].id || '')
      const cityValue = selectedCity?.name || selectedCity?.canonical || selectedCity || query
      // Convert YYYY-MM-DD to MM/DD/YYYY format
      const dateObj = new Date(date)
      const formattedDate = dateObj.toLocaleDateString('en-US')
      const res = await fetchWithTimeout(api('/api/check-delivery'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: cityValue, deliveryDate: formattedDate, productId })
      })
      const data = await res.json()
      setResult(data)
      if (data && (data.can_deliver === true || data.can_deliver === 'true')) {
        onConfirm({ city: selectedCity?.name || query, date, delivery: data })
      }
    } catch (err) {
      console.error('Delivery check error', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Delivery details</h3>
          <button className="close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <label>City</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type city name (e.g., Colombo)"
          />
          {suggestions && suggestions.length > 0 && (
            <ul className="suggestions">
              {suggestions.map((s, idx) => (
                <li key={idx} onClick={() => { setSelectedCity(s); setQuery(s.name || s.canonical || s); setSuggestions([]) }}>
                  {s.name || s.canonical || s}
                </li>
              ))}
            </ul>
          )}

<label>Delivery date</label>
           <input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />

{result && (
             <div className="delivery-result">
               <p><strong>Deliverable:</strong> {result.can_deliver ? 'Yes ✅' : 'No ❌'}</p>
               {result.rate !== null && result.rate !== undefined && <p><strong>Rate:</strong> LKR {result.rate}</p>}
               {result.perishable_warning && <p className="warn">⚠️ Perishable item — special handling</p>}
             </div>
           )}
        </div>

<div className="modal-footer">
           <button className="btn-secondary" onClick={onClose}>Cancel</button>
           <button className="btn-primary" onClick={handleConfirm} disabled={loading || (!selectedCity && !query) || !date}>
             {loading ? 'Checking…' : 'Check & Continue'}
           </button>
         </div>
      </div>
    </div>
  )
}

export default DeliveryModal
