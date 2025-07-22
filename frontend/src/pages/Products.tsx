import React, { useState, useEffect } from 'react';
import productService, { type Product } from '../services/productService';
import materialService, { type Material } from '../services/materialService';
import HandrailForm from '../components/products/HandrailForm';
import MaterialForm from '../components/products/MaterialForm';
import './Products.css';

const Products: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'handrails' | 'materials'>('handrails');
  const [handrailProducts, setHandrailProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Handrail form state
  const [showHandrailForm, setShowHandrailForm] = useState(false);
  const [editingHandrail, setEditingHandrail] = useState<Product | null>(null);
  
  // Material form state
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  // Load data on component mount and tab change
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (activeTab === 'handrails') {
        const products = await productService.getHandrailProducts();
        setHandrailProducts(products);
      } else {
        const materialsData = await materialService.getAllMaterials();
        setMaterials(materialsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHandrail = () => {
    setEditingHandrail(null);
    setShowHandrailForm(true);
  };

  const handleEditHandrail = (product: Product) => {
    setEditingHandrail(product);
    setShowHandrailForm(true);
  };

  const handleDeleteHandrail = async (product: Product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      try {
        await productService.deleteProduct(product.id);
        await loadData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete product');
      }
    }
  };

  const handleCreateMaterial = () => {
    setEditingMaterial(null);
    setShowMaterialForm(true);
  };

  const handleEditMaterial = (material: Material) => {
    setEditingMaterial(material);
    setShowMaterialForm(true);
  };

  const handleDeleteMaterial = async (material: Material) => {
    if (window.confirm(`Are you sure you want to delete "${material.name}"?`)) {
      try {
        await materialService.deleteMaterial(material.id);
        await loadData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete material');
      }
    }
  };

  const handleFormClose = async () => {
    setShowHandrailForm(false);
    setShowMaterialForm(false);
    setEditingHandrail(null);
    setEditingMaterial(null);
    await loadData();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="products-page">
      <div className="page-header">
        <h1 className="page-title">🔧 Products</h1>
        <p className="page-subtitle">Manage handrail products and materials</p>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'handrails' ? 'tab-button--active' : ''}`}
          onClick={() => setActiveTab('handrails')}
        >
          🏗️ Handrail Products
        </button>
        <button
          className={`tab-button ${activeTab === 'materials' ? 'tab-button--active' : ''}`}
          onClick={() => setActiveTab('materials')}
        >
          🪵 Materials
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'handrails' && (
          <div className="handrails-tab">
            <div className="tab-header">
              <h2>Handrail Products</h2>
              <button 
                className="btn btn-primary"
                onClick={handleCreateHandrail}
              >
                + Add Handrail Product
              </button>
            </div>

            {loading ? (
              <div className="loading-spinner">Loading hanrail products...</div>
            ) : (
              <div className="products-grid">
                {handrailProducts.length === 0 ? (
                  <div className="empty-state">
                    <p>No handrail products found.</p>
                    <button 
                      className="btn btn-primary"
                      onClick={handleCreateHandrail}
                    >
                      Create your first handrail product
                    </button>
                  </div>
                ) : (
                  handrailProducts.map((product) => (
                    <div key={product.id} className="product-card">
                      <div className="product-header">
                        <h3 className="product-name">{product.name}</h3>
                        <span className="product-type">Handrail</span>
                      </div>
                      <div className="product-details">
                        <div className="product-detail">
                          <span className="detail-label">Cost per 6":</span>
                          <span className="detail-value">
                            {formatCurrency(product.cost_per_6_inches || 0)}
                          </span>
                        </div>
                        <div className="product-detail">
                          <span className="detail-label">Labor/Install:</span>
                          <span className="detail-value">
                            {formatCurrency(product.labor_install_cost || 0)}
                          </span>
                        </div>
                      </div>
                      <div className="product-actions">
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleEditHandrail(product)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDeleteHandrail(product)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="materials-tab">
            <div className="tab-header">
              <h2>Material Types</h2>
              <button 
                className="btn btn-primary"
                onClick={handleCreateMaterial}
              >
                + Add Material
              </button>
            </div>

            {loading ? (
              <div className="loading-spinner">Loading materials...</div>
            ) : (
              <div className="materials-grid">
                {materials.length === 0 ? (
                  <div className="empty-state">
                    <p>No materials found.</p>
                    <button 
                      className="btn btn-primary"
                      onClick={handleCreateMaterial}
                    >
                      Create your first material
                    </button>
                  </div>
                ) : (
                  materials.map((material) => (
                    <div key={material.id} className="material-card">
                      <div className="material-header">
                        <h3 className="material-name">{material.name}</h3>
                        <span className="material-multiplier">
                          {material.multiplier}x
                        </span>
                      </div>
                      {material.description && (
                        <p className="material-description">{material.description}</p>
                      )}
                      <div className="material-actions">
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleEditMaterial(material)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDeleteMaterial(material)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Forms */}
      {showHandrailForm && (
        <HandrailForm
          product={editingHandrail}
          onClose={handleFormClose}
        />
      )}

      {showMaterialForm && (
        <MaterialForm
          material={editingMaterial}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};

export default Products;