import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { StairConfiguration } from '../services/stairService';

interface DraftStairConfiguration extends Omit<StairConfiguration, 'id' | 'jobId'> {
  tempId: string; // Temporary ID for tracking during creation
  sectionTempId: number; // Links to section during job creation
}

interface StairConfigurationContextType {
  draftConfigurations: DraftStairConfiguration[];
  addDraftConfiguration: (config: DraftStairConfiguration) => void;
  removeDraftConfiguration: (tempId: string) => void;
  clearDraftConfigurations: () => void;
  getDraftConfigurationsForSection: (sectionTempId: number) => DraftStairConfiguration[];
}

const StairConfigurationContext = createContext<StairConfigurationContextType | undefined>(undefined);

interface StairConfigurationProviderProps {
  children: ReactNode;
}

export const StairConfigurationProvider: React.FC<StairConfigurationProviderProps> = ({ children }) => {
  const [draftConfigurations, setDraftConfigurations] = useState<DraftStairConfiguration[]>([]);

  const addDraftConfiguration = (config: DraftStairConfiguration) => {
    setDraftConfigurations(prev => [...prev, config]);
  };

  const removeDraftConfiguration = (tempId: string) => {
    setDraftConfigurations(prev => prev.filter(config => config.tempId !== tempId));
  };

  const clearDraftConfigurations = () => {
    setDraftConfigurations([]);
  };

  const getDraftConfigurationsForSection = (sectionTempId: number) => {
    return draftConfigurations.filter(config => config.sectionTempId === sectionTempId);
  };

  const value = {
    draftConfigurations,
    addDraftConfiguration,
    removeDraftConfiguration,
    clearDraftConfigurations,
    getDraftConfigurationsForSection
  };

  return (
    <StairConfigurationContext.Provider value={value}>
      {children}
    </StairConfigurationContext.Provider>
  );
};

export const useStairConfiguration = () => {
  const context = useContext(StairConfigurationContext);
  if (context === undefined) {
    throw new Error('useStairConfiguration must be used within a StairConfigurationProvider');
  }
  return context;
};

export type { DraftStairConfiguration };
