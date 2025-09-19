import React from 'react';
import { Row, Col } from 'react-bootstrap';

const PageHeader = ({ title, subtitle, actions }) => {
  return (
    <Row className="mb-4 align-items-center">
      <Col>
        <h2 className="mb-1">{title}</h2>
        {subtitle && <p className="text-muted mb-0">{subtitle}</p>}
      </Col>
      {actions && <Col xs="auto">{actions}</Col>}
    </Row>
  );
};

export default PageHeader;
