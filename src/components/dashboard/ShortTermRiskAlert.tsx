import React from 'react';
import type { Language, FarmerPriorityId, DistrictId } from '../../types';
import { WeatherAdvisory } from '../WeatherAdvisory';

export interface ShortTermRiskAlertProps {
  language?: Language;
  districtId?: DistrictId | string;
  upazilaName?: string;
  lat?: number;
  lng?: number;
  soilMoisture?: number;
  priority?: FarmerPriorityId;
  messageEn?: string;
  messageBn?: string;
  source?: string;
  onDismiss?: () => void;
  className?: string;
}

/**
 * 2. Short-Term Risk Alert Banner / Weather Advisory
 * Upgraded with NASA GPM observations + Open-Meteo 7-day forecast + AgriOrbit deterministic rules.
 */
export const ShortTermRiskAlert: React.FC<ShortTermRiskAlertProps> = ({
  language = 'en',
  districtId = 'rangpur',
  upazilaName = 'Mithapukur',
  lat = 25.58,
  lng = 89.27,
  soilMoisture = 0.22,
  priority = 'save_water',
  onDismiss,
  className = '',
}) => {
  return (
    <WeatherAdvisory
      language={language}
      districtId={districtId}
      upazilaName={upazilaName}
      lat={lat}
      lng={lng}
      soilMoisture={soilMoisture}
      priority={priority}
      onDismiss={onDismiss}
      className={className}
    />
  );
};
