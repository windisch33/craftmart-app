import React from 'react';
import type { Product } from '../../../services/productService';
import type { Material } from '../../../services/materialService';
import type { LinearProductFormData, ProductType } from './types';

interface LinearProductFormProps {
  productType: ProductType;
  formData: LinearProductFormData;
  setFormData: React.Dispatch<React.SetStateAction<LinearProductFormData>>;
  products: Product[];
  materials: Material[];
}

const LinearProductForm: React.FC<LinearProductFormProps> = ({
  productType,
  formData,
  setFormData,
  products,
  materials
}) => {
  const productName = productType === 'handrail' ? 'Handrail' : 'Landing Tread';

  return (
    <div className="linear-product-form-section">
      <h3>{productName} Configuration</h3>
      <div className="form-row">
        <div className="form-group">
          <label>{productName} Product</label>
          <select
            value={formData.productId}
            onChange={(e) => setFormData(prev => ({ ...prev, productId: Number(e.target.value) }))}
          >
            <option value={0}>Select {productName}...</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Material</label>
          <select
            value={formData.materialId}
            onChange={(e) => setFormData(prev => ({ ...prev, materialId: Number(e.target.value) }))}
          >
            <option value={0}>Select Material...</option>
            {materials && materials.length > 0 && materials.map(material => (
              <option key={material.id} value={material.id}>
                {material.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Length (inches)</label>
          <input
            type="number"
            value={formData.length}
            onChange={(e) => setFormData(prev => ({ ...prev, length: Number(e.target.value) }))}
            step="0.25"
            min="1"
          />
        </div>
        <div className="form-group">
          <label>Quantity</label>
          <input
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
            min="1"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formData.includeLabor}
            onChange={(e) => setFormData(prev => ({ ...prev, includeLabor: e.target.checked }))}
          />
          Include Labor Cost
        </label>
      </div>
    </div>
  );
};

export default LinearProductForm;