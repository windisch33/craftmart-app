-- Create New Calculation Function
CREATE OR REPLACE FUNCTION calculate_stair_price_simple(
    p_board_type_id INTEGER,
    p_material_id INTEGER,
    p_length DECIMAL,
    p_width DECIMAL,
    p_quantity INTEGER DEFAULT 1,
    p_full_mitre BOOLEAN DEFAULT false
) RETURNS TABLE(
    base_price DECIMAL,
    length_charge DECIMAL,
    width_charge DECIMAL,
    material_multiplier DECIMAL,
    mitre_charge DECIMAL,
    unit_price DECIMAL,
    total_price DECIMAL
) AS $$
DECLARE
    v_pricing RECORD;
    v_material RECORD;
    v_base DECIMAL := 0;
    v_length_extra DECIMAL := 0;
    v_width_extra DECIMAL := 0;
    v_mitre DECIMAL := 0;
    v_multiplier DECIMAL := 1.0;
    v_unit DECIMAL := 0;
    v_total DECIMAL := 0;
BEGIN
    -- Get pricing rule
    SELECT * INTO v_pricing
    FROM stair_pricing_simple
    WHERE board_type_id = p_board_type_id
      AND is_active = true
    LIMIT 1;
    
    -- Get material multiplier
    SELECT * INTO v_material
    FROM material_multipliers
    WHERE material_id = p_material_id
      AND is_active = true
    LIMIT 1;
    
    IF v_pricing.id IS NOT NULL THEN
        v_base := v_pricing.base_price;
        v_multiplier := COALESCE(v_material.multiplier, 1.0);
        
        -- Calculate length increment charge
        IF p_length > v_pricing.base_length AND v_pricing.length_increment_price > 0 THEN
            v_length_extra := CEIL((p_length - v_pricing.base_length) / v_pricing.length_increment_size::DECIMAL) 
                            * v_pricing.length_increment_price;
        END IF;
        
        -- Calculate width increment charge
        IF p_width > v_pricing.base_width AND v_pricing.width_increment_price > 0 THEN
            v_width_extra := (p_width - v_pricing.base_width) * v_pricing.width_increment_price;
        END IF;
        
        -- Apply mitre charge if applicable
        IF p_full_mitre AND v_pricing.mitre_price > 0 THEN
            v_mitre := v_pricing.mitre_price;
        END IF;
        
        -- Calculate unit price with material multiplier
        v_unit := (v_base + v_length_extra + v_width_extra) * v_multiplier + v_mitre;
        v_total := v_unit * p_quantity;
    END IF;
    
    RETURN QUERY SELECT 
        v_base,
        v_length_extra,
        v_width_extra,
        v_multiplier,
        v_mitre,
        v_unit,
        v_total;
END;
$$ LANGUAGE plpgsql;