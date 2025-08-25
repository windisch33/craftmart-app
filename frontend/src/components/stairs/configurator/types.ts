import type { StairConfiguration } from '../../../services/stairService';

export interface StairConfiguratorProps {
  jobId?: number;
  sectionId?: number;
  sectionTempId?: number; // For draft mode during job creation
  onSave: (configuration: StairConfiguration) => void;
  onCancel: () => void;
  initialConfig?: Partial<StairConfiguration>;
}

export interface FormData {
  configName: string;
  floorToFloor: number;
  numRisers: number;
  treadMaterialId: number;
  riserMaterialId: number;
  treadSize: string; // Legacy field for backward compatibility
  roughCutWidth: number; // New field for flexible tread sizing
  noseSize: number;
  stringerType: string;
  stringerMaterialId: number;
  numStringers: number;
  centerHorses: number;
  fullMitre: boolean;
  bracketType: string;
  specialNotes: string;
}

export interface FormErrors {
  [key: string]: string;
}

export interface StringerConfig {
  width: number;
  thickness: number;
  materialId: number;
}

export interface IndividualStringers {
  left: StringerConfig;
  right: StringerConfig;
  center: StringerConfig | null;
}