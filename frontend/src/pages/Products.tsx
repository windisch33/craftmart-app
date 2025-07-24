import React, { useState, useEffect } from 'react';
import productService, { type Product } from '../services/productService';
import materialService, { type Material } from '../services/materialService';
import HandrailForm from '../components/products/HandrailForm';
import MaterialForm from '../components/products/MaterialForm';
import { SelectableList } from '../components/common/SelectableList';
import '../styles/common.css';
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

  const handleDeleteHandrails = async (products: Product[]) => {
    try {
      await Promise.all(
        products.map(product => productService.deleteProduct(product.id))
      );
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete products');
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

  const handleDeleteMaterials = async (materials: Material[]) => {
    try {
      await Promise.all(
        materials.map(material => materialService.deleteMaterial(material.id))
      );
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete materials');
    }
  };

  const handleFormClose = async () => {
    setShowHandrailForm(false);
    setShowMaterialForm(false);
    setEditingHandrail(null);
    setEditingMaterial(null);
    await loadData();
  };


  const handrailColumns = [
    {
      key: 'name',
      label: 'Product Name',
      width: '100%',
      render: (product: Product) => (
        <div style={{ fontWeight: 600, fontSize: '16px' }}>
          {product.name}
        </div>
      )
    }
  ];

  const materialColumns = [
    {
      key: 'name',
      label: 'Material Name',
      width: '100%',
      render: (material: Material) => (
        <div style={{ fontWeight: 600, fontSize: '16px' }}>
          {material.name}
        </div>
      )
    }
  ];

  return (
    <div className="container">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="gradient-title">🔧 Products</h1>
          <p className="page-subtitle">Manage products and materials</p>
        </div>
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
              <div className="loading-spinner">Loading handrail products...</div>
            ) : (
              <SelectableList
                items={handrailProducts}
                columns={handrailColumns}
                getItemId={(product) => product.id}
                onEdit={handleEditHandrail}
                onDelete={handleDeleteHandrails}
                emptyMessage="No handrail products found. Create your first handrail product to get started."
              />
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
              <SelectableList
                items={materials}
                columns={materialColumns}
                getItemId={(material) => material.id}
                onEdit={handleEditMaterial}
                onDelete={handleDeleteMaterials}
                emptyMessage="No materials found. Create your first material to get started."
              />
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