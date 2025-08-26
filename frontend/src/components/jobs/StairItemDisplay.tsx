import React, { useState, useEffect } from 'react';
import type { QuoteItem } from '../../services/jobService';
import type { StairConfigurationDetails } from '../../types/stairTypes';
import { formatStairConfigurationDetails } from '../../utils/stairFormatting';
import stairConfigService from '../../services/stairConfigService';
import StairConfigDetails from './StairConfigDetails';

interface StairItemDisplayProps {
  item: QuoteItem;
}

const StairItemDisplay: React.FC<StairItemDisplayProps> = ({ item }) => {
  const [stairConfig, setStairConfig] = useState<StairConfigurationDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStairConfiguration = async () => {
      // Determine config ID from stair_config_id or part_number
      let configId: number | null = null;
      
      if (item.stair_config_id) {
        configId = item.stair_config_id;
      } else if (item.part_number && item.part_number.startsWith('STAIR-')) {
        // Extract config ID from part number (e.g., "STAIR-123")
        const match = item.part_number.match(/STAIR-(\d+)/);
        if (match) {
          configId = parseInt(match[1]);
        }
      }

      if (!configId) {
        setError('No stair configuration ID found');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const config = await stairConfigService.getStairConfiguration(configId);
        setStairConfig(config);
      } catch (err) {
        console.error('Error loading stair configuration:', err);
        setError(err instanceof Error ? err.message : 'Failed to load stair configuration');
      } finally {
        setLoading(false);
      }
    };

    // Check if this is a stair configuration item
    const isStairItem = item.stair_config_id || 
                       (item.part_number && item.part_number.startsWith('STAIR-'));

    if (isStairItem) {
      loadStairConfiguration();
    }
  }, [item.stair_config_id, item.part_number]);

  // Check if this is a stair configuration item
  const isStairItem = item.stair_config_id || 
                     (item.part_number && item.part_number.startsWith('STAIR-'));

  if (!isStairItem) {
    // Not a stair item, render normally
    return (
      <div className="col-description">
        {item.part_number && (
          <div className="part-number">{item.part_number}</div>
        )}
        <div className="description">{item.description}</div>
      </div>
    );
  }

  return (
    <div className="col-description">
      {item.part_number && (
        <div className="part-number">{item.part_number}</div>
      )}
      <div className="description">{item.description}</div>
      
      {/* Stair Configuration Details */}
      {loading && (
        <div className="stair-loading">
          <small>Loading stair configuration...</small>
        </div>
      )}
      
      {error && (
        <div className="stair-error">
          <small>Error: {error}</small>
        </div>
      )}
      
      {stairConfig && !loading && !error && (
        <StairConfigDetails 
          details={formatStairConfigurationDetails(stairConfig)}
          configName={stairConfig.config_name}
        />
      )}
    </div>
  );
};

export default StairItemDisplay;