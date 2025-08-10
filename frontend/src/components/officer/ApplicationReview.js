import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Modal, Form, Alert, Spinner, Tabs, Tab } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import applicationService from '../../services/applicationService';

const ApplicationReview = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState({ status: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !['admin', 'admission_officer'].includes(user.role)) {
      navigate('/dashboard');
      return;
    }
    fetchApplications();
  }, [user, navigate]);

  const fetchApplications = async () => {
    try {
      const data = await applicationService.getApplications();
      setApplications(data.results || data);
      setError(null);
    } catch (error) {
      setError('Failed to fetch applications');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    setSubmitting(true);
    try {
      await applicationService.updateStatus(selectedApplication.id, statusUpdate);
      setShowStatusModal(false);
      setSelectedApplication(null);
      setStatusUpdate({ status: '', reason: '' });
      await fetchApplications();
    } catch (error) {
      setError('Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDocumentVerification = async (documentId, verified, notes = '') => {
    try {
      // This would need a new API endpoint for document verification
      console.log('Document verification:', { documentId, verified, notes });
      // await applicationService.verifyDocument(documentId, { verified, notes });
      await fetchApplications();
    } catch (error) {
      setError('Failed to verify document');
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

  const getPriorityBadge = (application) => {
    const daysSinceSubmission = application.submitted_at 
      ? Math.floor((new Date() - new Date(application.submitted_at)) / (1000 * 60 * 60 * 24))
      : 0;
    
    if (daysSinceSubmission > 7) {
      return <Badge bg="danger">Urgent</Badge>;
    } else if (daysSinceSubmission > 3) {
      return <Badge bg="warning">Priority</Badge>;
    }
    return <Badge bg="success">Normal</Badge>;
  };

  const getFilteredApplications = (filter) => {
    switch (filter) {
      case 'pending':
        return applications.filter(app => ['submitted', 'under_review'].includes(app.status));
      case 'reviewed':
        return applications.filter(app => ['shortlisted', 'admitted', 'rejected', 'waitlisted'].includes(app.status));
      case 'all':
      default:
        return applications.filter(app => app.status !== 'draft');
    }
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <Spinner animation="border" />
          <p>Loading applications...</p>
        </div>
      </Container>
    );
  }

  const pendingApplications = getFilteredApplications('pending');
  const reviewedApplications = getFilteredApplications('reviewed');
  const allApplications = getFilteredApplications('all');

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h2>Application Review</h2>
          <p className="text-muted">Review and manage student applications</p>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="pending" title={`Pending Review (${pendingApplications.length})`}>
          <Card>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Application #</th>
                    <th>Student Name</th>
                    <th>Program</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Submitted</th>
                    <th>Academic Score</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingApplications.map(application => (
                    <tr key={application.id}>
                      <td>
                        <strong>{application.application_number}</strong>
                      </td>
                      <td>
                        <div>
                          <strong>{application.user_name}</strong>
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong>{application.program_name}</strong>
                          <div className="small text-muted">
                            {application.department_name}
                          </div>
                        </div>
                      </td>
                      <td>
                        {getStatusBadge(application.status)}
                      </td>
                      <td>
                        {getPriorityBadge(application)}
                      </td>
                      <td>
                        <div className="small">
                          {application.submitted_at ? new Date(application.submitted_at).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td>
                        <div className="small">
                          <div>10th: {application.tenth_percentage}%</div>
                          {application.twelfth_percentage && (
                            <div>12th: {application.twelfth_percentage}%</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => navigate(`/applications/${application.id}`)}
                          >
                            Review
                          </Button>
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => {
                              setSelectedApplication(application);
                              setShowStatusModal(true);
                            }}
                          >
                            Update Status
                          </Button>
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => {
                              setSelectedApplication(application);
                              setShowDocumentModal(true);
                            }}
                          >
                            Documents
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="reviewed" title={`Reviewed (${reviewedApplications.length})`}>
          <Card>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Application #</th>
                    <th>Student Name</th>
                    <th>Program</th>
                    <th>Status</th>
                    <th>Reviewed By</th>
                    <th>Decision Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewedApplications.map(application => (
                    <tr key={application.id}>
                      <td>
                        <strong>{application.application_number}</strong>
                      </td>
                      <td>
                        <strong>{application.user_name}</strong>
                      </td>
                      <td>
                        <div>
                          <strong>{application.program_name}</strong>
                          <div className="small text-muted">
                            {application.department_name}
                          </div>
                        </div>
                      </td>
                      <td>
                        {getStatusBadge(application.status)}
                      </td>
                      <td>
                        <div className="small">
                          {application.reviewed_by_name || 'System'}
                        </div>
                      </td>
                      <td>
                        <div className="small">
                          {application.updated_at ? new Date(application.updated_at).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => navigate(`/applications/${application.id}`)}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={() => {
                              setSelectedApplication(application);
                              setShowStatusModal(true);
                            }}
                          >
                            Revise
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="statistics" title="Statistics">
          <Row>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h3 className="text-primary">{allApplications.length}</h3>
                  <p className="mb-0">Total Applications</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h3 className="text-warning">{pendingApplications.length}</h3>
                  <p className="mb-0">Pending Review</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h3 className="text-success">
                    {applications.filter(app => app.status === 'admitted').length}
                  </h3>
                  <p className="mb-0">Admitted</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h3 className="text-danger">
                    {applications.filter(app => app.status === 'rejected').length}
                  </h3>
                  <p className="mb-0">Rejected</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>

      {/* Status Update Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Application Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedApplication && (
            <div className="mb-3">
              <strong>Application:</strong> {selectedApplication.application_number}<br />
              <strong>Student:</strong> {selectedApplication.user_name}<br />
              <strong>Program:</strong> {selectedApplication.program_name}
            </div>
          )}
          
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
            <Form.Label>Reason/Comments</Form.Label>
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

      {/* Document Review Modal */}
      <Modal show={showDocumentModal} onHide={() => setShowDocumentModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Document Review</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedApplication && (
            <div>
              <div className="mb-3">
                <strong>Application:</strong> {selectedApplication.application_number}<br />
                <strong>Student:</strong> {selectedApplication.user_name}
              </div>
              
              {selectedApplication.documents?.length > 0 ? (
                <Table responsive className="mb-0">
                  <thead>
                    <tr>
                      <th>Document</th>
                      <th>File</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedApplication.documents.map(doc => (
                      <tr key={doc.id}>
                        <td>
                          <strong>{doc.document_type_name}</strong>
                          {doc.is_mandatory && (
                            <Badge bg="danger" className="ms-2">Required</Badge>
                          )}
                        </td>
                        <td>
                          <div>
                            <a 
                              href={doc.file} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-decoration-none"
                            >
                              📄 {doc.original_filename}
                            </a>
                            <div className="small text-muted">
                              Size: {(doc.file_size / 1024 / 1024).toFixed(2)}MB
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge bg={doc.verified ? 'success' : 'warning'}>
                            {doc.verified ? 'Verified' : 'Pending'}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleDocumentVerification(doc.id, true)}
                              disabled={doc.verified}
                            >
                              ✓ Verify
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDocumentVerification(doc.id, false, 'Document rejected')}
                            >
                              ✗ Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <Alert variant="info">
                  No documents uploaded for this application.
                </Alert>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDocumentModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ApplicationReview;
