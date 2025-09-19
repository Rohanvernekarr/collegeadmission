import React from 'react';

const EmptyState = ({ title = 'Nothing here yet', hint }) => {
  return (
    <div className="text-center py-5">
      <div style={{ fontSize: 48, lineHeight: 1 }}>🗂️</div>
      <h5 className="mt-3">{title}</h5>
      {hint && <p className="text-muted mb-0">{hint}</p>}
    </div>
  );
};

export default EmptyState;
