import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, ListGroup, Modal, Form, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import applicationService from '../../services/applicationService';
import PageHeader from '../ui/PageHeader';
import Loader from '../ui/Loader';

const ApplicationDetail = () => {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({ status: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  const { applicationId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchApplicationDetails();
  }, [applicationId]);

  const fetchApplicationDetails = async () => {
    try {
      const data = await applicationService.getApplication(applicationId);
      setApplication(data);
      setError(null);
    } catch (error) {
      setError('Failed to load application details');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
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

  const handleStatusUpdate = async () => {
    setSubmitting(true);
    try {
      await applicationService.updateStatus(applicationId, statusUpdate);
      setShowStatusModal(false);
      setStatusUpdate({ status: '', reason: '' });
      await fetchApplicationDetails(); // Refresh data
    } catch (error) {
      setError('Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'draft': { bg: 'secondary', text: 'Draft' },
      'submitted': { bg: 'primary', text: 'Submitted' },
      'under_review': { bg: 'warning', text: 'Under Review' },
      'shortlisted': { bg: 'info', text: 'Shortlisted' },
      'admitted': { bg: 'success', text: 'Admitted' },
      'rejected': { bg: 'danger', text: 'Rejected' },
      'waitlisted': { bg: 'secondary', text: 'Waitlisted' },
      'withdrawn': { bg: 'dark', text: 'Withdrawn' },
    };

    const config = statusConfig[status] || statusConfig['draft'];
    return <Badge bg={config.bg}>{config.text}</Badge>;
  };

  const canEditApplication = () => {
    return user?.role === 'applicant' && application?.status === 'draft';
  };

  const canSubmitApplication = () => {
    return user?.role === 'applicant' && application?.status === 'draft' && application?.is_complete;
  };

  const canUpdateStatus = () => {
    return user?.role && ['admin', 'admission_officer'].includes(user.role);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <Loader message="Loading application..." />
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
      <PageHeader
        title={`Application #${application?.application_number}`}
        subtitle={application?.program?.name}
        actions={<Button variant="outline-secondary" onClick={() => navigate('/applications')}>← Back to Applications</Button>}
      />

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Row>
        <Col lg={8}>
          {/* Application Header */}
          <Card className="mb-4">
            <Card.Body>
              <Row>
                <Col>
                  <h3>{application?.program?.name}</h3>
                  <p className="text-muted mb-1">{application?.program?.department_name}</p>
                  <p className="text-muted">Application #{application?.application_number}</p>
                </Col>
                <Col xs="auto">
                  {getStatusBadge(application?.status)}
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Personal Information */}
          <Card className="mb-4">
            <Card.Header>
              <h5>Personal Information</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <p><strong>Name:</strong> {application?.user_name}</p>
                  <p><strong>Date of Birth:</strong> {application?.date_of_birth}</p>
                  <p><strong>Gender:</strong> {application?.gender?.toUpperCase()}</p>
                  <p><strong>Nationality:</strong> {application?.nationality}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Emergency Contact:</strong> {application?.emergency_contact_name}</p>
                  <p><strong>Contact Phone:</strong> {application?.emergency_contact_phone}</p>
                  <p><strong>Relationship:</strong> {application?.emergency_contact_relation}</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Academic Information */}
          <Card className="mb-4">
            <Card.Header>
              <h5>Academic Information</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4}>
                  <h6>10th Standard</h6>
                  <p><strong>Percentage:</strong> {application?.tenth_percentage}%</p>
                  <p><strong>Board:</strong> {application?.tenth_board}</p>
                  <p><strong>Year:</strong> {application?.tenth_year}</p>
                </Col>
                
                {application?.twelfth_percentage && (
                  <Col md={4}>
                    <h6>12th Standard</h6>
                    <p><strong>Percentage:</strong> {application?.twelfth_percentage}%</p>
                    <p><strong>Board:</strong> {application?.twelfth_board}</p>
                    <p><strong>Year:</strong> {application?.twelfth_year}</p>
                  </Col>
                )}
                
                {application?.graduation_percentage && (
                  <Col md={4}>
                    <h6>Graduation</h6>
                    <p><strong>Degree:</strong> {application?.graduation_degree}</p>
                    <p><strong>University:</strong> {application?.graduation_university}</p>
                    <p><strong>Percentage:</strong> {application?.graduation_percentage}%</p>
                    <p><strong>Year:</strong> {application?.graduation_year}</p>
                  </Col>
                )}
              </Row>

              {application?.extracurricular_activities && (
                <div className="mt-3">
                  <h6>Extracurricular Activities</h6>
                  <p>{application.extracurricular_activities}</p>
                </div>
              )}

              {application?.work_experience && (
                <div className="mt-3">
                  <h6>Work Experience</h6>
                  <p>{application.work_experience}</p>
                </div>
              )}

              {application?.statement_of_purpose && (
                <div className="mt-3">
                  <h6>Statement of Purpose</h6>
                  <p>{application.statement_of_purpose}</p>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Documents */}
          <Card className="mb-4">
            <Card.Header>
              <h5>Documents</h5>
            </Card.Header>
            <Card.Body>
              {application?.documents?.length > 0 ? (
                <ListGroup variant="flush">
                  {application.documents.map(doc => (
                    <ListGroup.Item key={doc.id} className="px-0">
                      <Row className="align-items-center">
                        <Col>
                          <strong>{doc.document_type_name}</strong>
                          {doc.is_mandatory && <Badge bg="danger" className="ms-2">Required</Badge>}
                          <div className="small text-muted">
                            {doc.original_filename} | 
                            Size: {(doc.file_size / 1024 / 1024).toFixed(2)}MB |
                            Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                          </div>
                        </Col>
                        <Col xs="auto">
                          <Badge bg={doc.verified ? 'success' : 'warning'}>
                            {doc.verified ? 'Verified' : 'Under Review'}
                          </Badge>
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <p className="text-muted">No documents uploaded</p>
              )}
            </Card.Body>
          </Card>

          {/* Status History */}
          {application?.status_history?.length > 0 && (
            <Card className="mb-4">
              <Card.Header>
                <h5>Status History</h5>
              </Card.Header>
              <Card.Body>
                <div className="timeline">
                  {application.status_history.map((history, index) => (
                    <div key={index} className="timeline-item">
                      <div className={`timeline-badge bg-${
                        history.new_status === 'admitted' ? 'success' : history.new_status === 'rejected' ? 'danger' : 'primary'
                      }`}></div>
                      <div className="timeline-content">
                        <div className="fw-semibold">
                          {history.previous_status.replace('_', ' ').toUpperCase()} → {history.new_status.replace('_', ' ').toUpperCase()}
                        </div>
                        <div className="small text-muted">
                          By: {history.changed_by_name} • {new Date(history.changed_at).toLocaleString()}
                        </div>
                        {history.change_reason && (
                          <div className="small mt-1">{history.change_reason}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* Sidebar */}
        <Col lg={4}>
          <Card className="mb-4">
            <Card.Header>
              <h5>Application Status</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <strong>Current Status:</strong><br />
                {getStatusBadge(application?.status)}
              </div>

              <div className="mb-3">
                <strong>Application Complete:</strong><br />
                <Badge bg={application?.is_complete ? 'success' : 'warning'}>
                  {application?.is_complete ? 'Complete' : 'Incomplete'}
                </Badge>
              </div>

              <div className="mb-3">
                <small className="text-muted">
                  Created: {new Date(application?.created_at).toLocaleString()}
                </small>
                {application?.submitted_at && (
                  <div>
                    <small className="text-muted">
                      Submitted: {new Date(application?.submitted_at).toLocaleString()}
                    </small>
                  </div>
                )}
              </div>

              {application?.review_notes && (
                <div className="mb-3">
                  <strong>Review Notes:</strong>
                  <p className="small">{application.review_notes}</p>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Actions */}
          <Card>
            <Card.Header>
              <h5>Actions</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                {canEditApplication() && (
                  <>
                    <Button
                      variant="outline-primary"
                      onClick={() => navigate(`/applications/${applicationId}/edit`)}
                    >
                      Edit Application
                    </Button>
                    <Button
                      variant="outline-secondary"
                      onClick={() => navigate(`/applications/${applicationId}/documents`)}
                    >
                      Manage Documents
                    </Button>
                  </>
                )}

                {canSubmitApplication() && (
                  <Button
                    variant="success"
                    onClick={() => setShowSubmitModal(true)}
                  >
                    Submit Application
                  </Button>
                )}

                {canUpdateStatus() && (
                  <Button
                    variant="warning"
                    onClick={() => setShowStatusModal(true)}
                  >
                    Update Status
                  </Button>
                )}

                <Button
                  variant="outline-info"
                  onClick={() => navigate(`/programs/${application?.program?.id}`)}
                >
                  View Program
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Submit Confirmation Modal */}
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

      {/* Status Update Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Application Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>New Status</Form.Label>
            <Form.Select
              value={statusUpdate.status}
              onChange={(e) => setStatusUpdate(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="">Select Status</option>
              <option value="under_review">Under Review</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="admitted">Admitted</option>
              <option value="rejected">Rejected</option>
              <option value="waitlisted">Waitlisted</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Reason/Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={statusUpdate.reason}
              onChange={(e) => setStatusUpdate(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Enter reason for status change..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleStatusUpdate}
            disabled={!statusUpdate.status || submitting}
          >
            {submitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Updating...
              </>
            ) : (
              'Update Status'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ApplicationDetail;
