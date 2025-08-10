import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Spinner, ListGroup } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import programService from '../../services/programService';

const ProgramDetail = () => {
  const [program, setProgram] = useState(null);
  const [requiredDocuments, setRequiredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchProgramDetails();
    fetchRequiredDocuments();
  }, [id]);

  const fetchProgramDetails = async () => {
    try {
      const data = await programService.getProgram(id);
      setProgram(data);
      setError(null);
    } catch (error) {
      setError('Failed to fetch program details');
      console.error('Error fetching program:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequiredDocuments = async () => {
    try {
      const data = await programService.getProgramDocuments(id);
      setRequiredDocuments(data);
    } catch (error) {
      console.error('Error fetching required documents:', error);
    }
  };

  const handleApplyClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'applicant') {
      alert('Only applicants can apply for programs');
      return;
    }
    navigate(`/apply/${program.id}`);
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
        <div className="text-center">
          <Spinner animation="border" />
          <p>Loading program details...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
        <Button variant="secondary" onClick={() => navigate('/programs')}>
          Back to Programs
        </Button>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <Button variant="outline-secondary" onClick={() => navigate('/programs')}>
            ← Back to Programs
          </Button>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <Card.Title className="h3">{program.name}</Card.Title>
                  <Card.Subtitle className="h5 text-muted">
                    {program.department.name}
                  </Card.Subtitle>
                </div>
                <div>
                  {program.is_application_open ? (
                    <Badge bg="success" className="fs-6">Application Open</Badge>
                  ) : (
                    <Badge bg="danger" className="fs-6">Application Closed</Badge>
                  )}
                </div>
              </div>

              <Row className="mb-4">
                <Col md={6}>
                  <p><strong>Program Code:</strong> {program.code}</p>
                  <p><strong>Type:</strong> {program.program_type?.replace('_', ' ').toUpperCase()}</p>
                  <p><strong>Duration:</strong> {program.duration_years} years ({program.duration_semesters} semesters)</p>
                </Col>
                <Col md={6}>
                  <p><strong>Intake Capacity:</strong> {program.intake_capacity}</p>
                  <p><strong>Available Seats:</strong> {program.available_seats}</p>
                  <p><strong>Min. Percentage:</strong> {program.min_percentage}%</p>
                </Col>
              </Row>

              <Row className="mb-4">
                <Col md={6}>
                  <p><strong>Fees per Semester:</strong> {formatCurrency(program.fees_per_semester)}</p>
                  <p><strong>Application Fee:</strong> {formatCurrency(program.application_fee)}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Application Start:</strong> {new Date(program.application_start_date).toLocaleDateString()}</p>
                  <p><strong>Application End:</strong> {new Date(program.application_end_date).toLocaleDateString()}</p>
                </Col>
              </Row>

              <div className="mb-4">
                <h5>Description</h5>
                <p>{program.description}</p>
              </div>

              <div className="mb-4">
                <h5>Eligibility Criteria</h5>
                <p>{program.eligibility_criteria}</p>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="mb-4">
            <Card.Header>
              <h5>Required Documents</h5>
            </Card.Header>
            <Card.Body>
              {requiredDocuments.length === 0 ? (
                <p className="text-muted">No specific documents required</p>
              ) : (
                <ListGroup variant="flush">
                  {requiredDocuments.map(doc => (
                    <ListGroup.Item key={doc.id} className="px-0">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <strong>{doc.document_name}</strong>
                          {doc.is_mandatory && (
                            <Badge bg="danger" className="ms-2">Required</Badge>
                          )}
                          {doc.description && (
                            <p className="small text-muted mb-0">{doc.description}</p>
                          )}
                        </div>
                      </div>
                      <small className="text-muted">
                        Max size: {doc.max_file_size_mb}MB | 
                        Formats: {doc.allowed_formats}
                      </small>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <h5>Apply for this Program</h5>
              {!user ? (
                <div>
                  <p className="text-muted">Please log in to apply</p>
                  <Button variant="primary" onClick={() => navigate('/login')}>
                    Login to Apply
                  </Button>
                </div>
              ) : user.role !== 'applicant' ? (
                <Alert variant="warning">
                  Only applicants can apply for programs
                </Alert>
              ) : !program.is_application_open ? (
                <Alert variant="danger">
                  Applications are closed for this program
                </Alert>
              ) : program.available_seats <= 0 ? (
                <Alert variant="warning">
                  No seats available for this program
                </Alert>
              ) : (
                <div>
                  <p className="text-muted">
                    Ready to start your application? Click below to begin.
                  </p>
                  <Button variant="primary" size="lg" onClick={handleApplyClick}>
                    Apply Now
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProgramDetail;
