import React from 'react';
import Operations from './operations';

const OperationDetails = ({ profileData }) => {
  if (!profileData || !profileData.length) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-600">No profile data available</p>
      </div>
    );
  }

  return <Operations profileData={profileData} />;
};

export default OperationDetails;
