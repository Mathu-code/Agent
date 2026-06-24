import React from 'react'
import './ProductCard.css'

function ProductCard({ product, onAddToCart, onViewDetails }) {
  const price = product.price || product.selling_price || 0
  const originalPrice = product.original_price || price
  const discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0
  const imageUrl = product.image_url || product.image || '/placeholder.png'
  const inStock = product.in_stock !== false

  return (
    <div className="product-card">
      <div className="product-image-wrapper">
        <img 
          src={imageUrl} 
          alt={product.name}
          className="product-image"
          onError={(e) => {
            e.target.src = '/placeholder.png'
          }}
        />
        {discount > 0 && (
          <div className="discount-badge">{discount}% OFF</div>
        )}
        {!inStock && (
          <div className="out-of-stock-overlay">Out of Stock</div>
        )}
      </div>

      <div className="product-details">
        <h3 className="product-name">{product.name}</h3>
        
        {product.description && (
          <p className="product-description">{product.description.substring(0, 80)}...</p>
        )}

        <div className="product-rating">
          {product.rating && (
            <>
              <span className="stars">{'⭐'.repeat(Math.floor(product.rating))}</span>
              <span className="rating-value">({product.rating.toFixed(1)})</span>
            </>
          )}
        </div>

        <div className="product-price">
          <span className="current-price">
            LKR {price.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </span>
          {originalPrice > price && (
            <span className="original-price">
              LKR {originalPrice.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </span>
          )}
        </div>

        {product.seller && (
          <p className="product-seller">By: {product.seller}</p>
        )}

        <div className="product-actions">
          <button 
            className="btn-view-details"
            onClick={() => onViewDetails(product)}
          >
            View Details
          </button>
          <button 
            className={`btn-add-cart ${!inStock ? 'disabled' : ''}`}
            onClick={() => onAddToCart(product)}
            disabled={!inStock}
          >
            🛒 Add
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductCard
