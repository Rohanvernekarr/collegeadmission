import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import applicationService from '../../services/applicationService';

const ApplicationEdit = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [application, setApplication] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'applicant') {
      navigate('/login');
      return;
    }
    loadApplication();
  }, [applicationId, user, navigate]);

  const loadApplication = async () => {
    try {
      const data = await applicationService.getApplication(applicationId);
      setApplication(data);
      // Prefill form data with existing values; use empty string for nullable fields for inputs
      setFormData({
        date_of_birth: data.date_of_birth || '',
        gender: data.gender || '',
        nationality: data.nationality || 'Indian',
        permanent_address: data.permanent_address || '',
        current_address: data.current_address || '',
        emergency_contact_name: data.emergency_contact_name || '',
        emergency_contact_phone: data.emergency_contact_phone || '',
        emergency_contact_relation: data.emergency_contact_relation || '',
        tenth_percentage: data.tenth_percentage ?? '',
        tenth_board: data.tenth_board || '',
        tenth_year: data.tenth_year ?? '',
        twelfth_percentage: data.twelfth_percentage ?? '',
        twelfth_board: data.twelfth_board || '',
        twelfth_year: data.twelfth_year ?? '',
        graduation_percentage: data.graduation_percentage ?? '',
        graduation_university: data.graduation_university || '',
        graduation_year: data.graduation_year ?? '',
        graduation_degree: data.graduation_degree || '',
        extracurricular_activities: data.extracurricular_activities || '',
        work_experience: data.work_experience || '',
        statement_of_purpose: data.statement_of_purpose || '',
      });
      setError(null);
    } catch (e) {
      setError('Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (application?.status !== 'draft') return;
    setSaving(true);
    try {
      // Coerce number-like strings where appropriate; backend tolerates blanks for optional
      const payload = { ...formData };
      const response = await applicationService.updateApplication(applicationId, payload);
      setError(null);
      navigate(`/applications/${applicationId}`);
    } catch (error) {
      if (error.response?.data) {
        const errorData = error.response.data;
        const errorMessages = typeof errorData === 'object'
          ? Object.entries(errorData).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('; ')
          : String(errorData);
        setError(errorMessages);
      } else {
        setError('Failed to save application');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <Spinner animation="border" />
          <p>Loading application...</p>
        </div>
      </Container>
    );
  }

  if (!application) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">Application not found.</Alert>
      </Container>
    );
  }

  const readOnly = application.status !== 'draft';

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <Button variant="outline-secondary" onClick={() => navigate(`/applications/${applicationId}`)}>
            ← Back to Application
          </Button>
        </Col>
      </Row>

      <Row>
        <Col lg={8} className="mx-auto">
          <Card>
            <Card.Header>
              <h3>Edit Application</h3>
              <p className="mb-0 text-muted">
                Application #: <strong>{application.application_number}</strong> — Status: <strong>{application.status}</strong>
              </p>
              {readOnly && (
                <Alert variant="warning" className="mt-2 mb-0">
                  This application is not in draft and cannot be edited.
                </Alert>
              )}
            </Card.Header>
            <Card.Body>
              {error && (
                <Alert variant="danger" className="mb-4">{error}</Alert>
              )}

              <Form onSubmit={handleSave}>
                <h5 className="mb-3">Personal Information</h5>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Date of Birth *</Form.Label>
                      <Form.Control type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} required disabled={readOnly} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Gender *</Form.Label>
                      <Form.Select name="gender" value={formData.gender} onChange={handleChange} required disabled={readOnly}>
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
                  <Form.Control type="text" name="nationality" value={formData.nationality} onChange={handleChange} required disabled={readOnly} />
                </Form.Group>

                <h5 className="mt-4 mb-3">Contact Information</h5>
                <Form.Group className="mb-3">
                  <Form.Label>Permanent Address *</Form.Label>
                  <Form.Control as="textarea" rows={3} name="permanent_address" value={formData.permanent_address} onChange={handleChange} required disabled={readOnly} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Current Address</Form.Label>
                  <Form.Control as="textarea" rows={3} name="current_address" value={formData.current_address} onChange={handleChange} placeholder="Leave blank if same as permanent" disabled={readOnly} />
                </Form.Group>

                <h6 className="mt-4 mb-3">Emergency Contact</h6>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Contact Name *</Form.Label>
                      <Form.Control type="text" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} required disabled={readOnly} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Contact Phone *</Form.Label>
                      <Form.Control type="tel" name="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={handleChange} required disabled={readOnly} />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>Relationship *</Form.Label>
                  <Form.Control type="text" name="emergency_contact_relation" value={formData.emergency_contact_relation} onChange={handleChange} required disabled={readOnly} />
                </Form.Group>

                <h5 className="mt-4 mb-3">Academic Information</h5>
                <h6>10th Standard</h6>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Percentage *</Form.Label>
                      <Form.Control type="number" step="0.01" min="0" max="100" name="tenth_percentage" value={formData.tenth_percentage} onChange={handleChange} required disabled={readOnly} />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Board *</Form.Label>
                      <Form.Control type="text" name="tenth_board" value={formData.tenth_board} onChange={handleChange} required disabled={readOnly} />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Year *</Form.Label>
                      <Form.Control type="number" min="1990" max={new Date().getFullYear()} name="tenth_year" value={formData.tenth_year} onChange={handleChange} required disabled={readOnly} />
                    </Form.Group>
                  </Col>
                </Row>

                <h6 className="mt-3">12th Standard (if applicable)</h6>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Percentage</Form.Label>
                      <Form.Control type="number" step="0.01" min="0" max="100" name="twelfth_percentage" value={formData.twelfth_percentage} onChange={handleChange} disabled={readOnly} />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Board</Form.Label>
                      <Form.Control type="text" name="twelfth_board" value={formData.twelfth_board} onChange={handleChange} disabled={readOnly} />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Year</Form.Label>
                      <Form.Control type="number" min="1990" max={new Date().getFullYear()} name="twelfth_year" value={formData.twelfth_year} onChange={handleChange} disabled={readOnly} />
                    </Form.Group>
                  </Col>
                </Row>

                <h6 className="mt-3">Graduation (if applicable)</h6>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Degree</Form.Label>
                      <Form.Control type="text" name="graduation_degree" value={formData.graduation_degree} onChange={handleChange} disabled={readOnly} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>University</Form.Label>
                      <Form.Control type="text" name="graduation_university" value={formData.graduation_university} onChange={handleChange} disabled={readOnly} />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Percentage</Form.Label>
                      <Form.Control type="number" step="0.01" min="0" max="100" name="graduation_percentage" value={formData.graduation_percentage} onChange={handleChange} disabled={readOnly} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Year</Form.Label>
                      <Form.Control type="number" min="1990" max={new Date().getFullYear()} name="graduation_year" value={formData.graduation_year} onChange={handleChange} disabled={readOnly} />
                    </Form.Group>
                  </Col>
                </Row>

                <h5 className="mt-4 mb-3">Additional Information</h5>
                <Form.Group className="mb-3">
                  <Form.Label>Extracurricular Activities</Form.Label>
                  <Form.Control as="textarea" rows={4} name="extracurricular_activities" value={formData.extracurricular_activities} onChange={handleChange} disabled={readOnly} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Work Experience</Form.Label>
                  <Form.Control as="textarea" rows={4} name="work_experience" value={formData.work_experience} onChange={handleChange} disabled={readOnly} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Statement of Purpose</Form.Label>
                  <Form.Control as="textarea" rows={5} name="statement_of_purpose" value={formData.statement_of_purpose} onChange={handleChange} disabled={readOnly} />
                </Form.Group>

                <div className="d-flex justify-content-between mt-4">
                  <Button variant="outline-secondary" onClick={() => navigate(`/applications/${applicationId}`)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="success" disabled={saving || readOnly}>
                    {saving ? (<><Spinner animation="border" size="sm" className="me-2" /> Saving...</>) : 'Save Changes'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ApplicationEdit;
