import React from 'react';
import StairConfigurator from '../../stairs/StairConfigurator';
import type { StairConfiguration } from '../../../services/stairService';

interface StairConfiguratorModalProps {
  showStairConfigurator: boolean;
  jobId?: number;
  sectionId?: number;
  sectionTempId?: number;
  isDraftMode?: boolean;
  editingStairItem: any | null;
  onStairSave: (stairConfig: StairConfiguration) => void;
  onStairCancel: () => void;
}

const StairConfiguratorModal: React.FC<StairConfiguratorModalProps> = ({
  showStairConfigurator,
  jobId,
  sectionId,
  sectionTempId,
  isDraftMode = false,
  editingStairItem,
  onStairSave,
  onStairCancel
}) => {
  if (!showStairConfigurator) {
    return null;
  }

  return (
    <StairConfigurator
      jobId={isDraftMode ? undefined : jobId}
      sectionId={isDraftMode ? undefined : (sectionId && sectionId > 0 ? sectionId : undefined)}
      sectionTempId={isDraftMode ? sectionId : sectionTempId}
      onSave={onStairSave}
      onCancel={onStairCancel}
      initialConfig={(editingStairItem as any)?.stair_configuration || undefined}
    />
  );
};

export default StairConfiguratorModal;