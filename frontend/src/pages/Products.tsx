import React, { useState, useEffect } from 'react';
import productService, { type Product } from '../services/productService';
import materialService, { type Material } from '../services/materialService';
import stairProductService, { 
  type StairMaterial, 
  type StairBoardType, 
  type StairSpecialPart 
} from '../services/stairProductService';
import HandrailForm from '../components/products/HandrailForm';
import LandingTreadForm from '../components/products/LandingTreadForm';
import RailPartsForm from '../components/products/RailPartsForm';
import MaterialForm from '../components/products/MaterialForm';
import StairMaterialForm from '../components/stairs/StairMaterialForm';
import BoardTypeForm from '../components/stairs/BoardTypeForm';

import StairSpecialPartsForm from '../components/stairs/StairSpecialPartsForm';
import QuickPricer from '../components/stairs/QuickPricer';
import { SelectableList } from '../components/common/SelectableList';
import { ConstructionIcon, WrenchIcon, HammerIcon, TreeIcon, RulerIcon, AlertTriangleIcon, DollarIcon } from '../components/common/icons';
import '../styles/common.css';
import './Products.css';

type TabType = 'quick_pricer' | 'handrails' | 'landing_treads' | 'rail_parts' | 'materials' | 'stair_materials' | 'board_types' | 'special_parts';

const Products: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('quick_pricer');
  
  // Existing product states
  const [handrailProducts, setHandrailProducts] = useState<Product[]>([]);
  const [landingTreadProducts, setLandingTreadProducts] = useState<Product[]>([]);
  const [railPartsProducts, setRailPartsProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  
  // New stair component states
  const [stairMaterials, setStairMaterials] = useState<StairMaterial[]>([]);
  const [boardTypes, setBoardTypes] = useState<StairBoardType[]>([]);

  const [specialParts, setSpecialParts] = useState<StairSpecialPart[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Existing product form states
  const [showHandrailForm, setShowHandrailForm] = useState(false);
  const [editingHandrail, setEditingHandrail] = useState<Product | null>(null);
  const [showLandingTreadForm, setShowLandingTreadForm] = useState(false);
  const [editingLandingTread, setEditingLandingTread] = useState<Product | null>(null);
  const [showRailPartsForm, setShowRailPartsForm] = useState(false);
  const [editingRailParts, setEditingRailParts] = useState<Product | null>(null);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  
  // New stair component form states
  const [showStairMaterialForm, setShowStairMaterialForm] = useState(false);
  const [editingStairMaterial, setEditingStairMaterial] = useState<StairMaterial | null>(null);
  const [showBoardTypeForm, setShowBoardTypeForm] = useState(false);
  const [editingBoardType, setEditingBoardType] = useState<StairBoardType | null>(null);

  const [showSpecialPartsForm, setShowSpecialPartsForm] = useState(false);
  const [editingSpecialParts, setEditingSpecialParts] = useState<StairSpecialPart | null>(null);

  // Load data on component mount and tab change
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      switch (activeTab) {
        case 'quick_pricer':
          // No data loading needed for quick pricer
          break;
        case 'handrails':
          const handrailData = await productService.getHandrailProducts();
          setHandrailProducts(handrailData);
          break;
        case 'landing_treads':
          const landingTreadData = await productService.getLandingTreadProducts();
          setLandingTreadProducts(landingTreadData);
          break;
        case 'rail_parts':
          const railPartsData = await productService.getRailPartsProducts();
          setRailPartsProducts(railPartsData);
          break;
        case 'materials':
          const materialsData = await materialService.getAllMaterials();
          setMaterials(materialsData);
          break;
        case 'stair_materials':
          const stairMaterialsData = await stairProductService.getStairMaterials();
          setStairMaterials(stairMaterialsData);
          break;
        case 'board_types':
          const boardTypesData = await stairProductService.getBoardTypes();
          setBoardTypes(boardTypesData);
          break;

        case 'special_parts':
          console.log('Loading special parts data...');
          const specialPartsData = await stairProductService.getSpecialParts();
          console.log('Special parts data:', specialPartsData);
          setSpecialParts(specialPartsData || []);
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('Error loading data for tab:', activeTab, err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      
      // Initialize empty arrays to prevent blank screens
      switch (activeTab) {

        case 'special_parts':
          setSpecialParts([]);
          break;
      }
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

  // Stair Materials Handlers
  const handleCreateStairMaterial = () => {
    setEditingStairMaterial(null);
    setShowStairMaterialForm(true);
  };

  const handleEditStairMaterial = (material: StairMaterial) => {
    setEditingStairMaterial(material);
    setShowStairMaterialForm(true);
  };

  const handleDeleteStairMaterials = async (materials: StairMaterial[]) => {
    try {
      await Promise.all(
        materials.map(material => stairProductService.deleteStairMaterial(material.id))
      );
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete stair materials');
    }
  };

  // Board Types Handlers
  const handleCreateBoardType = () => {
    setEditingBoardType(null);
    setShowBoardTypeForm(true);
  };

  const handleEditBoardType = (boardType: StairBoardType) => {
    setEditingBoardType(boardType);
    setShowBoardTypeForm(true);
  };

  const handleDeleteBoardTypes = async (boardTypes: StairBoardType[]) => {
    try {
      await Promise.all(
        boardTypes.map(boardType => stairProductService.deleteBoardType(boardType.id))
      );
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete board types');
    }
  };


  // Special Parts Handlers
  const handleCreateSpecialParts = () => {
    setEditingSpecialParts(null);
    setShowSpecialPartsForm(true);
  };

  const handleEditSpecialParts = (specialPart: StairSpecialPart) => {
    setEditingSpecialParts(specialPart);
    setShowSpecialPartsForm(true);
  };

  const handleDeleteSpecialParts = async (specialParts: StairSpecialPart[]) => {
    try {
      await Promise.all(
        specialParts.map(specialPart => stairProductService.deleteSpecialPart(specialPart.id))
      );
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete special parts');
    }
  };

  const handleFormClose = async () => {
    // Close all existing product forms
    setShowHandrailForm(false);
    setShowLandingTreadForm(false);
    setShowRailPartsForm(false);
    setShowMaterialForm(false);
    setEditingHandrail(null);
    setEditingLandingTread(null);
    setEditingRailParts(null);
    setEditingMaterial(null);
    
    // Close all stair component forms
    setShowStairMaterialForm(false);
    setShowBoardTypeForm(false);

    setShowSpecialPartsForm(false);
    setEditingStairMaterial(null);
    setEditingBoardType(null);

    setEditingSpecialParts(null);
    
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

  // Stair component columns
  const stairMaterialColumns = [
    {
      key: 'matrl_nam',
      label: 'Stair Material Details',
      width: '100%',
      render: (material: StairMaterial) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '16px' }}>
            {material.matrl_nam}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            Stair Price Multiplier: <span style={{ fontWeight: 600 }}>{material.multiplier}x</span>
            {material.multiplier === 1 && ' (Base Price - Red Oak)'}
          </div>
          {material.description && (
            <div style={{ fontSize: '13px', color: '#9ca3af' }}>
              {material.description}
            </div>
          )}
        </div>
      )
    }
  ];

  const boardTypeColumns = [
    {
      key: 'brdtyp_des',
      label: 'Board Type with Simplified Pricing',
      width: '100%',
      render: (boardType: any) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '16px' }}>
            {boardType.brdtyp_des}
          </div>
          {boardType.base_price ? (
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              Base: ${Number(boardType.base_price).toFixed(2)} 
              {Number(boardType.length_increment_price) > 0 && ` • +$${boardType.length_increment_price}/6" over ${boardType.base_length}"`}
              {Number(boardType.width_increment_price) > 0 && ` • +$${boardType.width_increment_price}/inch over ${boardType.base_width}"`}
              {Number(boardType.mitre_price) > 0 && ` • Mitre: $${boardType.mitre_price}`}
            </div>
          ) : (
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              No pricing configured
            </div>
          )}
          {boardType.purpose && (
            <div style={{ fontSize: '13px', color: '#9ca3af' }}>
              {boardType.purpose}
            </div>
          )}
        </div>
      )
    }
  ];



  const specialPartsColumns = [
    {
      key: 'stpar_desc',
      label: 'Special Part Details',
      width: '100%',
      render: (specialPart: StairSpecialPart) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '16px' }}>
            {specialPart.stpar_desc || 'Special Part'}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            {specialPart.matrl_nam || 'Material'} • Cost: ${Number(specialPart.unit_cost || 0).toFixed(2)}
            {Number(specialPart.labor_cost || 0) > 0 && ` • Labor: $${Number(specialPart.labor_cost || 0).toFixed(2)}`}
          </div>
          {specialPart.position && (
            <div style={{ fontSize: '13px', color: '#9ca3af' }}>
              Position: {specialPart.position}
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="container">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="gradient-title">Products</h1>
          <p className="page-subtitle">Manage products and materials</p>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon"><AlertTriangleIcon /></span>
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        {/* Quick Pricer Tab */}
        <button
          className={`tab-button ${activeTab === 'quick_pricer' ? 'tab-button--active' : ''}`}
          onClick={() => setActiveTab('quick_pricer')}
        >
          Quick Pricer
        </button>
        
        {/* Existing Product Tabs */}
        <button
          className={`tab-button ${activeTab === 'handrails' ? 'tab-button--active' : ''}`}
          onClick={() => setActiveTab('handrails')}
        >
          Handrail
        </button>
        <button
          className={`tab-button ${activeTab === 'landing_treads' ? 'tab-button--active' : ''}`}
          onClick={() => setActiveTab('landing_treads')}
        >
          Landing Treads
        </button>
        <button
          className={`tab-button ${activeTab === 'rail_parts' ? 'tab-button--active' : ''}`}
          onClick={() => setActiveTab('rail_parts')}
        >
          Rail Parts
        </button>
        <button
          className={`tab-button ${activeTab === 'materials' ? 'tab-button--active' : ''}`}
          onClick={() => setActiveTab('materials')}
        >
          Materials
        </button>
        
        {/* New Stair Component Tabs */}
        <button
          className={`tab-button ${activeTab === 'stair_materials' ? 'tab-button--active' : ''}`}
          onClick={() => setActiveTab('stair_materials')}
        >
          Stair Materials
        </button>
        <button
          className={`tab-button ${activeTab === 'board_types' ? 'tab-button--active' : ''}`}
          onClick={() => setActiveTab('board_types')}
        >
          Stair Pricing
        </button>

        <button
          className={`tab-button ${activeTab === 'special_parts' ? 'tab-button--active' : ''}`}
          onClick={() => setActiveTab('special_parts')}
        >
          Special Parts
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'quick_pricer' && (
          <div className="quick-pricer-tab">
            <QuickPricer />
          </div>
        )}

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

        {/* New Stair Component Tabs */}
        {activeTab === 'stair_materials' && (
          <div className="stair-materials-tab">
            <div className="tab-header">
              <h2>Stair Material Pricing</h2>
              <button 
                className="btn btn-primary"
                onClick={handleCreateStairMaterial}
              >
                + Add Stair Material
              </button>
            </div>
            <p style={{ margin: '0 0 16px 0', color: '#6b7280', fontSize: '14px' }}>
              Stair materials with pricing multipliers relative to Red Oak (base = 1.0)
            </p>

            {loading ? (
              <div className="loading-spinner">Loading stair materials...</div>
            ) : (
              <SelectableList
                items={stairMaterials}
                columns={stairMaterialColumns}
                getItemId={(material) => material.id}
                onEdit={handleEditStairMaterial}
                onDelete={handleDeleteStairMaterials}
                emptyMessage="No stair materials configured."
              />
            )}
          </div>
        )}

        {activeTab === 'board_types' && (
          <div className="board-types-tab">
            <div className="tab-header">
              <h2>Stair Pricing Configuration</h2>
              <button 
                className="btn btn-primary"
                onClick={handleCreateBoardType}
              >
                + Add Board Type
              </button>
            </div>
            <p style={{ margin: '0 0 16px 0', color: '#6b7280', fontSize: '14px' }}>
              Base prices with increment formulas for each stair board type
            </p>

            {loading ? (
              <div className="loading-spinner">Loading pricing configuration...</div>
            ) : (
              <SelectableList
                items={boardTypes}
                columns={boardTypeColumns}
                getItemId={(boardType) => boardType.id}
                onEdit={handleEditBoardType}
                onDelete={handleDeleteBoardTypes}
                emptyMessage="No pricing configuration found."
              />
            )}
          </div>
        )}



        {activeTab === 'special_parts' && (
          <div className="special-parts-tab">
            <div className="tab-header">
              <h2>Special Parts</h2>
              <button 
                className="btn btn-primary"
                onClick={handleCreateSpecialParts}
              >
                + Add Special Part
              </button>
            </div>

            {loading ? (
              <div className="loading-spinner">Loading special parts...</div>
            ) : (
              <SelectableList
                items={specialParts}
                columns={specialPartsColumns}
                getItemId={(specialPart) => specialPart.id}
                onEdit={handleEditSpecialParts}
                onDelete={handleDeleteSpecialParts}
                emptyMessage="No special parts found. Create your first special part to get started."
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

      {/* New Stair Component Forms */}
      {showStairMaterialForm && (
        <StairMaterialForm
          material={editingStairMaterial}
          onClose={handleFormClose}
        />
      )}

      {showBoardTypeForm && (
        <BoardTypeForm
          boardType={editingBoardType}
          onClose={handleFormClose}
        />
      )}



      {showSpecialPartsForm && (
        <StairSpecialPartsForm
          specialPart={editingSpecialParts}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};

export default Products;
