import React from 'react';
import type { FormattedStairDetails } from '../../types/stairTypes';
import { getTreadTypeDisplayName } from '../../utils/stairFormatting';
import './StairConfigDetails.css';

interface StairConfigDetailsProps {
  details: FormattedStairDetails;
  configName?: string;
}

const StairConfigDetails: React.FC<StairConfigDetailsProps> = ({ details, configName }) => {
  const actualTreadCount = details.numRisers - 1;

  return (
    <div className="stair-config-details">
      {configName && (
        <div className="config-name">
          <strong>{configName}</strong>
        </div>
      )}
      
      <div className="stair-spec-line">
        Floor to Floor: {details.floorToFloor}"
      </div>
      
      <div className="stair-spec-line">
        {details.numRisers} Rise
      </div>

      {/* Tread Details */}
      {details.treadGroups.map((group, index) => {
        const treadCount = Math.min(group.count, actualTreadCount);
        const displayName = getTreadTypeDisplayName(group.type);
        const mitreText = (group.type !== 'box' && details.specialOptions.includes('Full Mitre No Brackets')) ? ' - Mitre' : '';
        
        return (
          <div key={index} className="stair-spec-line indented">
            {treadCount} {displayName} @ {group.width}"{mitreText}
          </div>
        );
      })}

      {/* Dimensions */}
      <div className="stair-spec-line indented">
        {details.dimensions.riserHeight}" X {details.dimensions.roughCut}" X {details.dimensions.noseSize}"
      </div>

      {/* Materials */}
      <div className="stair-spec-line indented">
        {details.materials.tread} Treads, {details.materials.riser} Risers
      </div>
      
      <div className="stair-spec-line indented">
        {details.materials.landing} Landing Tread
      </div>

      {/* Stringers */}
      {details.stringers.type === 'individual' ? (
        <>
          {details.stringers.left && (
            <div className="stair-spec-line indented">
              Left Stringer: {details.stringers.left.thickness}" x {details.stringers.left.width}" {details.stringers.left.material}
            </div>
          )}
          {details.stringers.right && (
            <div className="stair-spec-line indented">
              Right Stringer: {details.stringers.right.thickness}" x {details.stringers.right.width}" {details.stringers.right.material}
            </div>
          )}
          {details.stringers.center && (
            <div className="stair-spec-line indented">
              Center Stringer: {details.stringers.center.thickness}" x {details.stringers.center.width}" {details.stringers.center.material}
            </div>
          )}
        </>
      ) : (
        <div className="stair-spec-line indented">
          Stringers: {details.stringers.legacy?.type}
          {details.stringers.legacy?.material && ` ${details.stringers.legacy.material}`}
        </div>
      )}

      {/* Special Options */}
      {details.specialOptions.map((option, index) => (
        <div key={index} className="stair-spec-line indented special-option">
          * {option} *
        </div>
      ))}

      {/* Special Notes */}
      {details.specialNotes && (
        <>
          <div className="stair-spec-line indented">
            {details.specialNotes}
          </div>
          <div className="stair-spec-line indented special-separator">
            ******************************************
          </div>
        </>
      )}
    </div>
  );
};

export default StairConfigDetails;