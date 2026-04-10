import React, { useState } from 'react';

// Injecting CSS for hover effects and animations
const cssStyles = `
  body {
    background-color: #f8fafc;
    margin: 0;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }
  .search-input {
    transition: all 0.2s ease;
  }
  .search-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
  }
  .product-card {
    transition: all 0.3s ease;
    background: white;
  }
  .product-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 24px rgba(0,0,0,0.08);
  }
  .buy-btn {
    transition: background-color 0.2s ease;
  }
  .buy-btn:hover {
    background-color: #2563eb;
    color: white;
  }
  .spin {
    animation: spin 1s linear infinite;
  }
  @keyframes spin { 
    100% { transform: rotate(360deg); } 
  }
`;

export default function App() {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setProducts([]); 
    setHasSearched(true);

    try {
      const response = await fetch('https://ai-recommdetion-system.vercel.app/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      if (!response.ok) throw new Error("Failed to fetch live recommendations.");

      const finalProducts = await response.json();
      setProducts(finalProducts);
    } catch (err) {
      console.error(err);
      setError("Failed to connect to the AI server. Is your backend running?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{cssStyles}</style>
      
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px', minHeight: '100vh' }}>
        
        {/* --- Header Section --- */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '2.5rem' }}>✨</span>
            <h1 style={{ fontSize: '3rem', margin: 0, color: '#0f172a', fontWeight: '800', letterSpacing: '-1px' }}>
              Product Recommendation System
            </h1>
          </div>
          <p style={{ color: '#64748b', fontSize: '1.2rem', maxWidth: '500px', margin: '0 auto 30px auto' }}>
            Tell the AI exactly what you need, and it will scour the live web to find the perfect matches.
          </p>
          
          {/* --- Search Bar --- */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', maxWidth: '700px', margin: '0 auto' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input 
                className="search-input"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="e.g., Best noise cancelling headphones under $300 for commuting"
                style={{ 
                  width: '100%', 
                  padding: '16px 20px', 
                  fontSize: '1.1rem', 
                  borderRadius: '12px', 
                  border: '1px solid #cbd5e1',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              style={{ 
                padding: '0 30px', 
                fontSize: '1.1rem', 
                fontWeight: '600',
                backgroundColor: isLoading ? '#94a3b8' : '#3b82f6', 
                color: 'white', 
                border: 'none', 
                borderRadius: '12px',
                cursor: isLoading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s'
              }}
            >
              {isLoading ? (
                <>
                  <svg className="spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                  </svg>
                  Searching...
                </>
              ) : 'Find It'}
            </button>
          </form>
        </div>

        {/* --- Error State --- */}
        {error && (
          <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '16px', borderRadius: '8px', textAlign: 'center', marginBottom: '30px', border: '1px solid #fecaca' }}>
            {error}
          </div>
        )}

        {/* --- Loading State --- */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: '500' }}>Analyzing millions of live products...</div>
            <p style={{ marginTop: '8px' }}>Gemini is filtering the best options for you.</p>
          </div>
        )}

        {/* --- Empty Results State --- */}
        {!isLoading && hasSearched && products.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '15px' }}>🕵️</span>
            <div style={{ fontSize: '1.2rem', fontWeight: '500' }}>No perfect matches found.</div>
            <p style={{ marginTop: '8px' }}>Try adjusting your search terms or being less restrictive with the price.</p>
          </div>
        )}

        {/* --- Results Grid --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }}>
          
          {products.map((p, index) => (
            <div key={p.product_id || p.position || index} className="product-card" style={{ 
              border: '1px solid #e2e8f0', 
              borderRadius: '16px', 
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflow: 'hidden'
            }}>
              
              {/* Image Container */}
              <div style={{ padding: '30px', backgroundColor: '#fff', borderBottom: '1px solid #f1f5f9', position: 'relative' }}>
                <span style={{ position: 'absolute', top: '12px', left: '12px', backgroundColor: '#fef3c7', color: '#92400e', fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px' }}>
                  AI TOP PICK
                </span>
                <img 
                  src={p.thumbnail} 
                  alt={p.title} 
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=Image+Unavailable'; }}
                  style={{ width: '100%', height: '180px', objectFit: 'contain' }} 
                />
              </div>
              
              {/* Content Container */}
              <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ flexGrow: 1 }}>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 0', fontWeight: '600' }}>
                    {p.source}
                  </p>
                  <h3 style={{ fontSize: '1.1rem', margin: '0 0 12px 0', color: '#0f172a', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {p.title}
                  </h3>
                  <p style={{ color: '#059669', fontSize: '1.5rem', fontWeight: '800', margin: '0 0 20px 0' }}>
                    {p.price}
                  </p>
                </div>

                {/* Call to Action */}
                <a 
                  href={p.link} 
                  className="buy-btn"
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    display: 'block',
                    padding: '14px',
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    textAlign: 'center',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    border: '1px solid #bfdbfe'
                  }}
                >
                  View Details &rarr;
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
