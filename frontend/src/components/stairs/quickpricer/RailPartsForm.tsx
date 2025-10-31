import React from 'react';
import type { Product } from '../../../services/productService';
import type { Material } from '../../../services/materialService';
import type { RailPartsFormData } from './types';

interface RailPartsFormProps {
  formData: RailPartsFormData;
  setFormData: React.Dispatch<React.SetStateAction<RailPartsFormData>>;
  railPartsProducts: Product[];
  materials: Material[];
}

const RailPartsForm: React.FC<RailPartsFormProps> = ({
  formData,
  setFormData,
  railPartsProducts,
  materials
}) => {
  const blurOnWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
  };
  return (
    <div className="rail-parts-form-section">
      <h3>Rail Parts Configuration</h3>
      <div className="form-row">
        <div className="form-group">
          <label>Rail Part Product</label>
          <select
            value={formData.productId}
            onChange={(e) => setFormData(prev => ({ ...prev, productId: Number(e.target.value) }))}
          >
            <option value={0}>Select Rail Part...</option>
            {railPartsProducts.map(product => (
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

      <div className="form-group">
        <label>Quantity</label>
        <input
          type="number"
          value={formData.quantity}
          onChange={(e) => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
          min="1"
          onWheel={blurOnWheel}
        />
      </div>

      {/* Labor cost toggle removed for Quick Pricer */}
    </div>
  );
};

export default RailPartsForm;
