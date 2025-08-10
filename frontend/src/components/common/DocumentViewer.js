import React, { useState } from 'react';
import { Modal, Button, Spinner, Alert } from 'react-bootstrap';

const DocumentViewer = ({ show, onHide, document, title }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleLoad = () => {
    setLoading(false);
    setError(null);
  };

  const handleError = () => {
    setLoading(false);
    setError('Failed to load document');
  };

  const isPdf = (filename) => {
    return filename?.toLowerCase().endsWith('.pdf');
  };

  const isImage = (filename) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const extension = filename?.toLowerCase().split('.').pop();
    return imageExtensions.includes(extension);
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{title || 'Document Viewer'}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0" style={{ height: '70vh' }}>
        {document ? (
          <div className="position-relative h-100">
            {loading && (
              <div className="position-absolute top-50 start-50 translate-middle">
                <Spinner animation="border" />
                <p className="mt-2">Loading document...</p>
              </div>
            )}
            
            {error && (
              <div className="p-4">
                <Alert variant="danger">
                  {error}
                  <hr />
                  <Button 
                    variant="outline-primary" 
                    href={document.file} 
                    target="_blank"
                  >
                    Open in New Tab
                  </Button>
                </Alert>
              </div>
            )}

            {isPdf(document.original_filename) ? (
              <iframe
                src={`${document.file}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
                width="100%"
                height="100%"
                title={document.document_type_name}
                onLoad={handleLoad}
                onError={handleError}
                style={{ border: 'none' }}
              />
            ) : isImage(document.original_filename) ? (
              <div className="text-center p-3 h-100 d-flex align-items-center justify-content-center">
                <img
                  src={document.file}
                  alt={document.document_type_name}
                  className="img-fluid"
                  style={{ maxHeight: '100%', maxWidth: '100%' }}
                  onLoad={handleLoad}
                  onError={handleError}
                />
              </div>
            ) : (
              <div className="p-4 text-center">
                <Alert variant="info">
                  <h5>Document Preview Not Available</h5>
                  <p>This file type cannot be previewed in the browser.</p>
                  <Button 
                    variant="primary" 
                    href={document.file} 
                    target="_blank"
                  >
                    Download & View: {document.original_filename}
                  </Button>
                </Alert>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4">
            <Alert variant="warning">
              No document selected for viewing.
            </Alert>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <div className="d-flex justify-content-between w-100">
          <div className="small text-muted">
            {document && (
              <>
                File: {document.original_filename} | 
                Size: {(document.file_size / 1024 / 1024).toFixed(2)}MB | 
                Uploaded: {new Date(document.uploaded_at).toLocaleDateString()}
              </>
            )}
          </div>
          <div>
            {document && (
              <Button 
                variant="outline-primary" 
                href={document.file} 
                target="_blank"
                className="me-2"
              >
                Open in New Tab
              </Button>
            )}
            <Button variant="secondary" onClick={onHide}>
              Close
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default DocumentViewer;
