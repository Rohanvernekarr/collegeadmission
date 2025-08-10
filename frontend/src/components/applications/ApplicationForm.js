import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, ProgressBar } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import programService from '../../services/programService';
import applicationService from '../../services/applicationService';

const ApplicationForm = () => {
  const [program, setProgram] = useState(null);
  const [formData, setFormData] = useState({
    date_of_birth: '',
    gender: '',
    nationality: 'Indian',
    permanent_address: '',
    current_address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    tenth_percentage: '',
    tenth_board: '',
    tenth_year: '',
    twelfth_percentage: '',
    twelfth_board: '',
    twelfth_year: '',
    graduation_percentage: '',
    graduation_university: '',
    graduation_year: '',
    graduation_degree: '',
    extracurricular_activities: '',
    work_experience: '',
    statement_of_purpose: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

  const { programId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!user || user.role !== 'applicant') {
      navigate('/login');
      return;
    }
    fetchProgramDetails();
  }, [programId, user, navigate]);

  const fetchProgramDetails = async () => {
    try {
      const data = await programService.getProgram(programId);
      setProgram(data);
      setError(null);
    } catch (error) {
      setError('Failed to fetch program details');
      console.error('Error fetching program:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const applicationData = {
        ...formData,
        program_id: parseInt(programId)
      };

      const response = await applicationService.createApplication(applicationData);
      navigate(`/applications/${response.id}`);
    } catch (error) {
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          const errorMessages = Object.entries(errorData)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('; ');
          setError(errorMessages);
        } else {
          setError(errorData);
        }
      } else {
        setError('Failed to create application');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const getStepTitle = (step) => {
    switch (step) {
      case 1: return 'Personal Information';
      case 2: return 'Contact Information';
      case 3: return 'Academic Information';
      case 4: return 'Additional Information';
      default: return '';
    }
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <Spinner animation="border" />
          <p>Loading application form...</p>
        </div>
      </Container>
    );
  }

  if (error && !program) {
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
          <Button variant="outline-secondary" onClick={() => navigate(`/programs/${programId}`)}>
            ← Back to Program
          </Button>
        </Col>
      </Row>

      <Row>
        <Col lg={8} className="mx-auto">
          <Card>
            <Card.Header>
              <h3>Application Form</h3>
              <p className="mb-0 text-muted">
                Applying for: <strong>{program?.name}</strong>
              </p>
            </Card.Header>
            <Card.Body>
              {/* Progress Bar */}
              <div className="mb-4">
                <ProgressBar now={(currentStep / 4) * 100} />
                <p className="mt-2 mb-0 text-center">
                  Step {currentStep} of 4: {getStepTitle(currentStep)}
                </p>
              </div>

              {error && (
                <Alert variant="danger" className="mb-4">
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                {/* Step 1: Personal Information */}
                {currentStep === 1 && (
                  <div>
                    <h5 className="mb-3">Personal Information</h5>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Date of Birth *</Form.Label>
                          <Form.Control
                            type="date"
                            name="date_of_birth"
                            value={formData.date_of_birth}
                            onChange={handleChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Gender *</Form.Label>
                          <Form.Select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            required
                          >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                    <Form.Group className="mb-3">
                      <Form.Label>Nationality *</Form.Label>
                      <Form.Control
                        type="text"
                        name="nationality"
                        value={formData.nationality}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </div>
                )}

                {/* Step 2: Contact Information */}
                {currentStep === 2 && (
                  <div>
                    <h5 className="mb-3">Contact Information</h5>
                    <Form.Group className="mb-3">
                      <Form.Label>Permanent Address *</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="permanent_address"
                        value={formData.permanent_address}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Current Address</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="current_address"
                        value={formData.current_address}
                        onChange={handleChange}
                        placeholder="Leave blank if same as permanent address"
                      />
                    </Form.Group>
                    <h6 className="mt-4 mb-3">Emergency Contact</h6>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Contact Name *</Form.Label>
                          <Form.Control
                            type="text"
                            name="emergency_contact_name"
                            value={formData.emergency_contact_name}
                            onChange={handleChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Contact Phone *</Form.Label>
                          <Form.Control
                            type="tel"
                            name="emergency_contact_phone"
                            value={formData.emergency_contact_phone}
                            onChange={handleChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Form.Group className="mb-3">
                      <Form.Label>Relationship *</Form.Label>
                      <Form.Control
                        type="text"
                        name="emergency_contact_relation"
                        value={formData.emergency_contact_relation}
                        onChange={handleChange}
                        placeholder="e.g., Father, Mother, Guardian"
                        required
                      />
                    </Form.Group>
                  </div>
                )}

                {/* Step 3: Academic Information */}
                {currentStep === 3 && (
                  <div>
                    <h5 className="mb-3">Academic Information</h5>
                    
                    <h6 className="mb-3">10th Standard</h6>
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Percentage *</Form.Label>
                          <Form.Control
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            name="tenth_percentage"
                            value={formData.tenth_percentage}
                            onChange={handleChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Board *</Form.Label>
                          <Form.Control
                            type="text"
                            name="tenth_board"
                            value={formData.tenth_board}
                            onChange={handleChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Year *</Form.Label>
                          <Form.Control
                            type="number"
                            min="1990"
                            max={new Date().getFullYear()}
                            name="tenth_year"
                            value={formData.tenth_year}
                            onChange={handleChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <h6 className="mb-3">12th Standard (if applicable)</h6>
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Percentage</Form.Label>
                          <Form.Control
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            name="twelfth_percentage"
                            value={formData.twelfth_percentage}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Board</Form.Label>
                          <Form.Control
                            type="text"
                            name="twelfth_board"
                            value={formData.twelfth_board}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Year</Form.Label>
                          <Form.Control
                            type="number"
                            min="1990"
                            max={new Date().getFullYear()}
                            name="twelfth_year"
                            value={formData.twelfth_year}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <h6 className="mb-3">Graduation (if applicable)</h6>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Degree</Form.Label>
                          <Form.Control
                            type="text"
                            name="graduation_degree"
                            value={formData.graduation_degree}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>University</Form.Label>
                          <Form.Control
                            type="text"
                            name="graduation_university"
                            value={formData.graduation_university}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Percentage</Form.Label>
                          <Form.Control
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            name="graduation_percentage"
                            value={formData.graduation_percentage}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Year</Form.Label>
                          <Form.Control
                            type="number"
                            min="1990"
                            max={new Date().getFullYear()}
                            name="graduation_year"
                            value={formData.graduation_year}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                )}

                {/* Step 4: Additional Information */}
                {currentStep === 4 && (
                  <div>
                    <h5 className="mb-3">Additional Information</h5>
                    <Form.Group className="mb-3">
                      <Form.Label>Extracurricular Activities</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        name="extracurricular_activities"
                        value={formData.extracurricular_activities}
                        onChange={handleChange}
                        placeholder="Describe your extracurricular activities, achievements, etc."
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Work Experience</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        name="work_experience"
                        value={formData.work_experience}
                        onChange={handleChange}
                        placeholder="Describe any relevant work experience"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Statement of Purpose</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={5}
                        name="statement_of_purpose"
                        value={formData.statement_of_purpose}
                        onChange={handleChange}
                        placeholder="Why do you want to pursue this program? What are your goals?"
                      />
                    </Form.Group>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="d-flex justify-content-between mt-4">
                  <Button
                    variant="outline-secondary"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                  >
                    Previous
                  </Button>

                  {currentStep < 4 ? (
                    <Button variant="primary" onClick={nextStep}>
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      variant="success"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Creating Application...
                        </>
                      ) : (
                        'Create Application'
                      )}
                    </Button>
                  )}
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ApplicationForm;
