import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, ListGroup,Modal, Badge, ProgressBar, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import applicationService from '../../services/applicationService';
import programService from '../../services/programService';

const DocumentUpload = () => {
  const [application, setApplication] = useState(null);
  const [requiredDocuments, setRequiredDocuments] = useState([]);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
   const [submitting, setSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [uploading, setUploading] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const { applicationId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchApplicationDetails();
  }, [applicationId]);

  const fetchApplicationDetails = async () => {
    try {
      const appData = await applicationService.getApplication(applicationId);
      setApplication(appData);
      setUploadedDocuments(appData.documents || []);

      const docsData = await programService.getProgramDocuments(appData.program.id);
      setRequiredDocuments(docsData);
      
      setError(null);
    } catch (error) {
      setError('Failed to load application details');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (documentTypeId, file) => {
    setSelectedFiles(prev => ({
      ...prev,
      [documentTypeId]: file
    }));
  };
  const handleSubmitApplication = async () => {
    setSubmitting(true);
    try {
      await applicationService.submitApplication(applicationId);
      setShowSubmitModal(false);
      await fetchApplicationDetails(); // Refresh data
    } catch (error) {
      let errorMessage = 'Failed to submit application';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const handleFileUpload = async (documentTypeId) => {
    const file = selectedFiles[documentTypeId];
    if (!file) return;

    const formData = new FormData();
    formData.append('application', applicationId);
    formData.append('document_type', documentTypeId);
    formData.append('file', file);

    setUploading(prev => ({ ...prev, [documentTypeId]: true }));

    try {
      const response = await applicationService.uploadDocument(formData);
      
      // Update uploaded documents list
      setUploadedDocuments(prev => {
        const filtered = prev.filter(doc => doc.document_type !== documentTypeId);
        return [...filtered, response];
      });

      // Clear selected file
      setSelectedFiles(prev => ({
        ...prev,
        [documentTypeId]: null
      }));

      setError(null);
    } catch (error) {
      let errorMessage = 'Upload failed';
      if (error.response?.data) {
        const errorData = error.response.data;
        errorMessage = typeof errorData === 'string' ? errorData : 
          Object.values(errorData).flat().join('; ');
      }
      setError(errorMessage);
    } finally {
      setUploading(prev => ({ ...prev, [documentTypeId]: false }));
    }
  };

  const getDocumentStatus = (documentTypeId) => {
    const uploaded = uploadedDocuments.find(doc => doc.document_type === documentTypeId);
    if (uploaded) {
      return uploaded.verified ? 'verified' : 'uploaded';
    }
    return 'pending';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return <Badge bg="success">Verified</Badge>;
      case 'uploaded':
        return <Badge bg="warning">Under Review</Badge>;
      case 'pending':
        return <Badge bg="danger">Required</Badge>;
      default:
        return <Badge bg="secondary">Unknown</Badge>;
    }
  };

  const calculateProgress = () => {
    const mandatoryDocs = requiredDocuments.filter(doc => doc.is_mandatory);
    const uploadedMandatory = mandatoryDocs.filter(doc => 
      uploadedDocuments.some(uploaded => uploaded.document_type === doc.id)
    );
    return mandatoryDocs.length > 0 ? (uploadedMandatory.length / mandatoryDocs.length) * 100 : 0;
  };

  const canSubmitApplication = () => {
    const mandatoryDocs = requiredDocuments.filter(doc => doc.is_mandatory);
    return mandatoryDocs.every(doc => 
      uploadedDocuments.some(uploaded => uploaded.document_type === doc.id)
    );
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <Spinner animation="border" />
          <p>Loading application details...</p>
        </div>
      </Container>
    );
  }

  if (error && !application) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
        <Button variant="secondary" onClick={() => navigate('/applications')}>
          Back to Applications
        </Button>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <Button variant="outline-secondary" onClick={() => navigate('/applications')}>
            ← Back to Applications
          </Button>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header>
              <h4>Document Upload</h4>
              <p className="mb-0">
                Application: {application?.application_number} - {application?.program?.name}
              </p>
            </Card.Header>
            <Card.Body>
              {application?.status !== 'draft' && (
                <Alert variant="warning" className="mb-4">
                  This application has been submitted. Documents cannot be modified.
                </Alert>
              )}

              {error && (
                <Alert variant="danger" className="mb-4">
                  {error}
                </Alert>
              )}

              <div className="mb-4">
                <h6>Upload Progress</h6>
                <ProgressBar 
                  now={calculateProgress()} 
                  label={`${Math.round(calculateProgress())}%`}
                  variant={calculateProgress() === 100 ? 'success' : 'primary'}
                />
                <small className="text-muted">
                  {requiredDocuments.filter(doc => doc.is_mandatory).length} mandatory documents required
                </small>
              </div>

              <ListGroup>
                {requiredDocuments.map(docType => {
                  const status = getDocumentStatus(docType.id);
                  const uploadedDoc = uploadedDocuments.find(doc => doc.document_type === docType.id);
                  const selectedFile = selectedFiles[docType.id];
                  const isUploading = uploading[docType.id];

                  return (
                    <ListGroup.Item key={docType.id}>
                      <Row className="align-items-center">
                        <Col md={4}>
                          <div>
                            <strong>{docType.document_name}</strong>
                            {docType.is_mandatory && <span className="text-danger"> *</span>}
                            {getStatusBadge(status)}
                          </div>
                          {docType.description && (
                            <small className="text-muted d-block">{docType.description}</small>
                          )}
                          <small className="text-muted">
                            Max: {docType.max_file_size_mb}MB | 
                            Formats: {docType.allowed_formats}
                          </small>
                        </Col>

                        <Col md={4}>
                          {uploadedDoc ? (
                            <div>
                              <div className="text-success">
                                ✓ {uploadedDoc.original_filename}
                              </div>
                              <small className="text-muted">
                                Size: {formatFileSize(uploadedDoc.file_size)} | 
                                Uploaded: {new Date(uploadedDoc.uploaded_at).toLocaleDateString()}
                              </small>
                              {uploadedDoc.verification_notes && (
                                <div className="small text-warning">
                                  Note: {uploadedDoc.verification_notes}
                                </div>
                              )}
                            </div>
                          ) : (
                            <Form.Control
                              type="file"
                              size="sm"
                              accept={docType.allowed_formats.split(',').map(f => `.${f}`).join(',')}
                              onChange={(e) => handleFileSelect(docType.id, e.target.files[0])}
                              disabled={application?.status !== 'draft'}
                            />
                          )}
                        </Col>

                        <Col md={4} className="text-end">
                          {!uploadedDoc && selectedFile && application?.status === 'draft' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleFileUpload(docType.id)}
                              disabled={isUploading}
                            >
                              {isUploading ? (
                                <>
                                  <Spinner animation="border" size="sm" className="me-1" />
                                  Uploading...
                                </>
                              ) : (
                                'Upload'
                              )}
                            </Button>
                          )}
                          
                          {uploadedDoc && application?.status === 'draft' && (
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => {
                                // Logic to replace/delete document
                                console.log('Replace document:', docType.id);
                              }}
                            >
                              Replace
                            </Button>
                          )}
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card>
            <Card.Header>
              <h5>Application Status</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <strong>Status:</strong> 
                <Badge 
                  bg={application?.status === 'draft' ? 'secondary' : 'primary'} 
                  className="ms-2"
                >
                  {application?.status?.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              <div className="mb-3">
                <strong>Completion:</strong> {Math.round(calculateProgress())}%
              </div>

              {application?.status === 'draft' && (
                <div className="mb-3">
                  {canSubmitApplication() ? (
                    <Alert variant="success" className="small">
                      ✓ All mandatory documents uploaded. Ready to submit!
                    </Alert>
                  ) : (
                    <Alert variant="warning" className="small">
                      Please upload all mandatory documents before submitting.
                    </Alert>
                  )}
                </div>
              )}

              <div className="mb-3">
                <small className="text-muted">
                  Created: {new Date(application?.created_at).toLocaleDateString()}
                </small>
                {application?.submitted_at && (
                  <div>
                    <small className="text-muted">
                      Submitted: {new Date(application?.submitted_at).toLocaleDateString()}
                    </small>
                  </div>
                )}
              </div>

              <div className="d-grid gap-2">
                <Button
                  variant="outline-primary"
                  onClick={() => navigate(`/applications/${applicationId}`)}
                >
                  View Application
                </Button>
                
                {application?.status === 'draft' && canSubmitApplication() && (
                  <Modal show={showSubmitModal} onHide={() => setShowSubmitModal(false)}>
                  <Modal.Header closeButton>
                    <Modal.Title>Submit Application</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <Alert variant="warning">
                      <strong>Are you sure you want to submit this application?</strong>
                    </Alert>
                    <p>
                      Once submitted, you will not be able to make changes to your application.
                      Please ensure all information is correct and all required documents are uploaded.
                    </p>
                    <p>
                      <strong>Application Fee:</strong> {formatCurrency(application?.program?.application_fee)}
                    </p>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowSubmitModal(false)}>
                      Cancel
                    </Button>
                    <Button 
                      variant="success" 
                      onClick={handleSubmitApplication}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Submitting...
                        </>
                      ) : (
                        'Confirm Submit'
                      )}
                    </Button>
                  </Modal.Footer>
                </Modal>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DocumentUpload;
