import React from 'react';
import { Spinner } from 'react-bootstrap';

const Loader = ({ message = 'Loading...' }) => {
  return (
    <div className="text-center py-5">
      <Spinner animation="border" />
      <p className="mt-2 text-muted">{message}</p>
    </div>
  );
};

export default Loader;
