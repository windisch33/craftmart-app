import React, { useState, useEffect } from 'react';
import productService, { type Product } from '../services/productService';
import materialService, { type Material } from '../services/materialService';
import HandrailForm from '../components/products/HandrailForm';
import LandingTreadForm from '../components/products/LandingTreadForm';
import RailPartsForm from '../components/products/RailPartsForm';
import MaterialForm from '../components/products/MaterialForm';
import { SelectableList } from '../components/common/SelectableList';
import '../styles/common.css';
import './Products.css';

const Products: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'handrails' | 'landing_treads' | 'rail_parts' | 'materials'>('handrails');
  const [handrailProducts, setHandrailProducts] = useState<Product[]>([]);
  const [landingTreadProducts, setLandingTreadProducts] = useState<Product[]>([]);
  const [railPartsProducts, setRailPartsProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Handrail form state
  const [showHandrailForm, setShowHandrailForm] = useState(false);
  const [editingHandrail, setEditingHandrail] = useState<Product | null>(null);
  
  // Landing tread form state
  const [showLandingTreadForm, setShowLandingTreadForm] = useState(false);
  const [editingLandingTread, setEditingLandingTread] = useState<Product | null>(null);
  
  // Rail parts form state
  const [showRailPartsForm, setShowRailPartsForm] = useState(false);
  const [editingRailParts, setEditingRailParts] = useState<Product | null>(null);
  
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
      } else if (activeTab === 'landing_treads') {
        const products = await productService.getLandingTreadProducts();
        setLandingTreadProducts(products);
      } else if (activeTab === 'rail_parts') {
        const products = await productService.getRailPartsProducts();
        setRailPartsProducts(products);
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
  const handleCreateLandingTread = () => {
    setEditingLandingTread(null);
    setShowLandingTreadForm(true);
  };

  const handleEditLandingTread = (product: Product) => {
    setEditingLandingTread(product);
    setShowLandingTreadForm(true);
  };

  const handleDeleteLandingTreads = async (products: Product[]) => {
    try {
      await Promise.all(
        products.map(product => productService.deleteProduct(product.id))
      );
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete products');
    }
  };

  const handleCreateRailParts = () => {
    setEditingRailParts(null);
    setShowRailPartsForm(true);
  };

  const handleEditRailParts = (product: Product) => {
    setEditingRailParts(product);
    setShowRailPartsForm(true);
  };

  const handleDeleteRailParts = async (products: Product[]) => {
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
    setShowLandingTreadForm(false);
    setShowRailPartsForm(false);
    setShowMaterialForm(false);
    setEditingHandrail(null);
    setEditingLandingTread(null);
    setEditingRailParts(null);
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

  const landingTreadColumns = [
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

  const railPartsColumns = [
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
          🏗️ Handrail
        </button>
        <button
          className={`tab-button ${activeTab === 'landing_treads' ? 'tab-button--active' : ''}`}
          onClick={() => setActiveTab('landing_treads')}
        >
          🪜 Landing Treads
        </button>
        <button
          className={`tab-button ${activeTab === 'rail_parts' ? 'tab-button--active' : ''}`}
          onClick={() => setActiveTab('rail_parts')}
        >
          🔩 Rail Parts
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

        {activeTab === 'landing_treads' && (
          <div className="landing-treads-tab">
            <div className="tab-header">
              <h2>Landing Tread Products</h2>
              <button 
                className="btn btn-primary"
                onClick={handleCreateLandingTread}
              >
                + Add Landing Tread
              </button>
            </div>

            {loading ? (
              <div className="loading-spinner">Loading landing tread products...</div>
            ) : (
              <SelectableList
                items={landingTreadProducts}
                columns={landingTreadColumns}
                getItemId={(product) => product.id}
                onEdit={handleEditLandingTread}
                onDelete={handleDeleteLandingTreads}
                emptyMessage="No landing tread products found. Create your first landing tread to get started."
              />
            )}
          </div>
        )}

        {activeTab === 'rail_parts' && (
          <div className="rail-parts-tab">
            <div className="tab-header">
              <h2>Rail Parts Products</h2>
              <button 
                className="btn btn-primary"
                onClick={handleCreateRailParts}
              >
                + Add Rail Parts
              </button>
            </div>

            {loading ? (
              <div className="loading-spinner">Loading rail parts products...</div>
            ) : (
              <SelectableList
                items={railPartsProducts}
                columns={railPartsColumns}
                getItemId={(product) => product.id}
                onEdit={handleEditRailParts}
                onDelete={handleDeleteRailParts}
                emptyMessage="No rail parts products found. Create your first rail parts to get started."
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

      {showLandingTreadForm && (
        <LandingTreadForm
          product={editingLandingTread}
          onClose={handleFormClose}
        />
      )}

      {showRailPartsForm && (
        <RailPartsForm
          product={editingRailParts}
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