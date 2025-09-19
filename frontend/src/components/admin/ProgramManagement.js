import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert, Spinner, Badge, ListGroup } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import programService from '../../services/programService';
import PageHeader from '../ui/PageHeader';
import Loader from '../ui/Loader';
import EmptyState from '../ui/EmptyState';
import { useToast } from '../ui/ToastProvider';

const ProgramManagement = () => {
  const [programs, setPrograms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [deletingProgram, setDeletingProgram] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  
  // Document requirements state
  const [documentRequirements, setDocumentRequirements] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department_id: '',
    program_type: 'undergraduate',
    duration_years: 4,
    duration_semesters: 8,
    description: '',
    intake_capacity: 50,
    fees_per_semester: 50000,
    application_fee: 1500,
    min_percentage: 60,
    eligibility_criteria: '',
    application_start_date: '',
    application_end_date: '',
    status: 'active'
  });

  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [programsData, departmentsData] = await Promise.all([
        programService.getPrograms(),
        programService.getDepartments()
      ]);
      
      // Safe array handling with validation
      let programs = Array.isArray(programsData) ? programsData : programsData?.results || [];
      let departments = Array.isArray(departmentsData) ? departmentsData : departmentsData?.results || [];
      
      // Filter out invalid programs
      programs = programs.filter(program => program && program.id && program.department);
      
      console.log('Loaded programs:', programs.length);
      console.log('Loaded departments:', departments.length);
      
      setPrograms(Array.isArray(programsData) ? programsData : programsData?.results || []);
      setDepartments(Array.isArray(departmentsData) ? departmentsData : departmentsData?.results || []);
      
      setError(null);
    } catch (error) {
      setError('Failed to fetch data');
      setDepartments([]);
      setPrograms([]);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      department_id: '',
      program_type: 'undergraduate',
      duration_years: 4,
      duration_semesters: 8,
      description: '',
      intake_capacity: 50,
      fees_per_semester: 50000,
      application_fee: 1500,
      min_percentage: 60,
      eligibility_criteria: '',
      application_start_date: '',
      application_end_date: '',
      status: 'active'
    });
    setDocumentRequirements([]);
    setEditingProgram(null);
    setError(null);
    setSuccess(null);
  };

  const handleCreateProgram = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditProgram = async (program) => {

    if (!program) {
      console.error('Program object is undefined');
      setError('Invalid program data. Please refresh the page and try again.');
      return;
    }
  
    if (!program.id) {
      console.error('Program ID is missing:', program);
      setError('Program ID is missing. Cannot edit this program.');
      return;
    }

    try {
      // IMPORTANT: Program list items don't include full department object;
      // fetch full program details before editing
      const fullProgram = await programService.getProgram(program.id);

      setFormData({
        name: fullProgram.name,
        code: fullProgram.code,
        department_id: fullProgram.department?.id || '',
        program_type: fullProgram.program_type,
        duration_years: fullProgram.duration_years,
        duration_semesters: fullProgram.duration_semesters,
        description: fullProgram.description,
        intake_capacity: fullProgram.intake_capacity,
        fees_per_semester: fullProgram.fees_per_semester,
        application_fee: fullProgram.application_fee,
        min_percentage: fullProgram.min_percentage,
        eligibility_criteria: fullProgram.eligibility_criteria,
        application_start_date: fullProgram.application_start_date?.split('T')[0] || '',
        application_end_date: fullProgram.application_end_date?.split('T')[0] || '',
        status: fullProgram.status
      });

      // Fetch existing document requirements
      try {
        const docs = await programService.getProgramDocuments(program.id);
        setDocumentRequirements(docs || []);
      } catch (error) {
        console.error('Error fetching document requirements:', error);
        setDocumentRequirements([]);
      }

      setEditingProgram(fullProgram);
      setError(null);
      setSuccess(null);
      setShowModal(true);
    } catch (e) {
      console.error('Failed to load program details for editing:', e);
      setError('Failed to load program details. Please try again.');
    }
  };

  const handleDeleteProgram = (program) => {
    setDeletingProgram(program);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingProgram) return;

    setSubmitting(true);
    try {
      await programService.deleteProgram(deletingProgram.id);
      setSuccess(`Program "${deletingProgram.name}" deleted successfully!`);
      toast.success(`Deleted program: ${deletingProgram.name}`);
      setShowDeleteModal(false);
      setDeletingProgram(null);
      setTimeout(() => {
        setSuccess(null);
        fetchData();
      }, 2000);
    } catch (error) {
      let errorMessage = 'Failed to delete program';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Document requirements handlers
  const addDocumentRequirement = () => {
    setDocumentRequirements(prev => [...prev, {
      id: Date.now(), // temporary ID for new documents
      document_name: '',
      description: '',
      is_mandatory: true,
      max_file_size_mb: 5,
      allowed_formats: 'pdf,jpg,jpeg,png',
      isNew: true
    }]);
  };

  const updateDocumentRequirement = (index, field, value) => {
    setDocumentRequirements(prev => 
      prev.map((doc, i) => 
        i === index ? { ...doc, [field]: value } : doc
      )
    );
  };

  const removeDocumentRequirement = (index) => {
    setDocumentRequirements(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Program name is required');
      return false;
    }
    if (!formData.code.trim()) {
      setError('Program code is required');
      return false;
    }
    if (!formData.department_id) {
      setError('Department selection is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Program description is required');
      return false;
    }
    if (!formData.eligibility_criteria.trim()) {
      setError('Eligibility criteria is required');
      return false;
    }
    if (!formData.application_start_date) {
      setError('Application start date is required');
      return false;
    }
    if (!formData.application_end_date) {
      setError('Application end date is required');
      return false;
    }
    if (new Date(formData.application_start_date) >= new Date(formData.application_end_date)) {
      setError('Application start date must be before end date');
      return false;
    }

    // Validate document requirements
    for (let i = 0; i < documentRequirements.length; i++) {
      const doc = documentRequirements[i];
      if (!doc.document_name.trim()) {
        setError(`Document requirement ${i + 1}: Document name is required`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        department_id: parseInt(formData.department_id),
        duration_years: parseInt(formData.duration_years),
        duration_semesters: parseInt(formData.duration_semesters),
        intake_capacity: parseInt(formData.intake_capacity),
        fees_per_semester: parseFloat(formData.fees_per_semester),
        application_fee: parseFloat(formData.application_fee),
        min_percentage: parseFloat(formData.min_percentage),
        application_start_date: new Date(formData.application_start_date).toISOString(),
        application_end_date: new Date(formData.application_end_date).toISOString(),
      };

      let program;
      if (editingProgram) {
        program = await programService.updateProgram(editingProgram.id, submitData);
        setSuccess('Program updated successfully!');
        toast.success('Program updated successfully');
      } else {
        program = await programService.createProgram(submitData);
        setSuccess('Program created successfully!');
        toast.success('Program created successfully');
      }

      // Handle document requirements
      const programId = editingProgram ? editingProgram.id : program.id;
      
      for (const docReq of documentRequirements) {
        const docData = {
          program: programId,
          document_name: docReq.document_name,
          description: docReq.description,
          is_mandatory: docReq.is_mandatory,
          max_file_size_mb: parseInt(docReq.max_file_size_mb),
          allowed_formats: docReq.allowed_formats
        };

        if (docReq.isNew) {
          await programService.createDocumentRequirement(docData);
        } else if (docReq.id) {
          await programService.updateDocumentRequirement(docReq.id, docData);
        }
      }

      setTimeout(() => {
        setShowModal(false);
        resetForm();
        fetchData();
      }, 1500);

    } catch (error) {
      console.error('Submit error:', error);
      let errorMessage = 'Failed to save program';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          const fieldErrors = Object.entries(errorData)
            .map(([key, value]) => {
              const fieldName = key.replace('_', ' ').toLowerCase();
              const errorMsg = Array.isArray(value) ? value.join(', ') : value;
              return `${fieldName}: ${errorMsg}`;
            })
            .join('; ');
          errorMessage = fieldErrors;
        } else {
          errorMessage = errorData;
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'active': { bg: 'success', text: 'Active' },
      'inactive': { bg: 'warning', text: 'Inactive' },
      'closed': { bg: 'danger', text: 'Closed' }
    };
    const config = statusConfig[status] || statusConfig['active'];
    return <Badge bg={config.bg}>{config.text}</Badge>;
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <Loader message="Loading programs..." />
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <PageHeader
        title="Program Management"
        subtitle="Create, edit, and manage academic programs"
        actions={<Button variant="primary" onClick={handleCreateProgram}>+ Create New Program</Button>}
      />

      {error && !showModal && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {success && !showModal && (
        <Alert variant="success" className="mb-4">
          {success}
        </Alert>
      )}

      <Card>
        <Card.Body className="p-0">
          {programs.length === 0 ? (
            <EmptyState title="No programs yet" hint="Create your first program to get started." />
          ) : (
          <Table responsive hover className="mb-0">
            <thead className="table-light">
              <tr>
                <th>Program Name</th>
                <th>Code</th>
                <th>Department</th>
                <th>Type</th>
                <th>Duration</th>
                <th>Capacity</th>
                <th>Fees</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {programs.length > 0 ? programs.map(program => (
                <tr key={program.id}>
                  <td>
                    <strong>{program.name}</strong>
                  </td>
                  <td>
                    <code>{program.code}</code>
                  </td>
                  <td>
                    {program.department?.name}
                  </td>
                  <td>
                    <Badge bg="info">
                      {program.program_type?.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </td>
                  <td>
                    {program.duration_years} years
                  </td>
                  <td>
                    {program.available_seats}/{program.intake_capacity}
                  </td>
                  <td>
                    ₹{program.fees_per_semester?.toLocaleString()}/sem
                  </td>
                  <td>
                    {getStatusBadge(program.status)}
                  </td>
                  <td>
                    <div className="d-flex gap-1">
                    <Button
  variant="outline-primary"
  size="sm"
  onClick={() => {
    if (program && program.id) {
      handleEditProgram(program);
    } else {
      console.error('Invalid program data:', program);
      setError('Cannot edit this program. Program data is invalid.');
    }
  }}
>
  Edit
</Button>

                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => navigate(`/programs/${program.id}`)}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteProgram(program)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="9" className="text-center py-4">
                    <div>
                      <p className="text-muted mb-2">No programs found</p>
                      <Button variant="primary" onClick={handleCreateProgram}>
                        Create Your First Program
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
          )}
        </Card.Body>
      </Card>

      {/* Program Form Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingProgram ? 'Edit Program' : 'Create New Program'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert variant="success" className="mb-3">
                {success}
              </Alert>
            )}

            {/* Basic Program Information */}
            <h5 className="mb-3">Basic Information</h5>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Program Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Bachelor of Technology in Computer Science"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Program Code *</Form.Label>
                  <Form.Control
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., BTECH-CS"
                    style={{ textTransform: 'uppercase' }}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Department *</Form.Label>
                  <Form.Select
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Department</option>
                    {Array.isArray(departments) && departments.length > 0 
                      ? departments.map(dept => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name} ({dept.code})
                          </option>
                        ))
                      : <option disabled>No departments available</option>
                    }
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Program Type *</Form.Label>
                  <Form.Select
                    name="program_type"
                    value={formData.program_type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="undergraduate">Undergraduate</option>
                    <option value="postgraduate">Postgraduate</option>
                    <option value="diploma">Diploma</option>
                    <option value="certificate">Certificate</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {/* Program Details */}
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Duration (Years) *</Form.Label>
                  <Form.Control
                    type="number"
                    name="duration_years"
                    value={formData.duration_years}
                    onChange={handleInputChange}
                    min="1"
                    max="10"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Semesters *</Form.Label>
                  <Form.Control
                    type="number"
                    name="duration_semesters"
                    value={formData.duration_semesters}
                    onChange={handleInputChange}
                    min="1"
                    max="20"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Intake Capacity *</Form.Label>
                  <Form.Control
                    type="number"
                    name="intake_capacity"
                    value={formData.intake_capacity}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Fees per Semester (₹) *</Form.Label>
                  <Form.Control
                    type="number"
                    name="fees_per_semester"
                    value={formData.fees_per_semester}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Application Fee (₹) *</Form.Label>
                  <Form.Control
                    type="number"
                    name="application_fee"
                    value={formData.application_fee}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Min. Percentage *</Form.Label>
                  <Form.Control
                    type="number"
                    name="min_percentage"
                    value={formData.min_percentage}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.1"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Program Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                placeholder="Provide a comprehensive description of the program..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Eligibility Criteria *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="eligibility_criteria"
                value={formData.eligibility_criteria}
                onChange={handleInputChange}
                required
                placeholder="Specify the academic qualifications and requirements..."
              />
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Application Start Date *</Form.Label>
                  <Form.Control
                    type="date"
                    name="application_start_date"
                    value={formData.application_start_date}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Application End Date *</Form.Label>
                  <Form.Control
                    type="date"
                    name="application_end_date"
                    value={formData.application_end_date}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Status *</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="closed">Closed</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {/* Document Requirements Section */}
            <hr />
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5>Document Requirements</h5>
              <Button variant="outline-primary" size="sm" onClick={addDocumentRequirement}>
                + Add Document Requirement
              </Button>
            </div>

            {documentRequirements.length > 0 ? (
              <ListGroup className="mb-3">
                {documentRequirements.map((doc, index) => (
                  <ListGroup.Item key={index}>
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-2">
                          <Form.Label>Document Name *</Form.Label>
                          <Form.Control
                            type="text"
                            value={doc.document_name}
                            onChange={(e) => updateDocumentRequirement(index, 'document_name', e.target.value)}
                            placeholder="e.g., 10th Mark Sheet"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-2">
                          <Form.Label>Max Size (MB)</Form.Label>
                          <Form.Control
                            type="number"
                            value={doc.max_file_size_mb}
                            onChange={(e) => updateDocumentRequirement(index, 'max_file_size_mb', e.target.value)}
                            min="1"
                            max="50"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-2">
                          <Form.Label>Allowed Formats</Form.Label>
                          <Form.Control
                            type="text"
                            value={doc.allowed_formats}
                            onChange={(e) => updateDocumentRequirement(index, 'allowed_formats', e.target.value)}
                            placeholder="pdf,jpg,png"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={2} className="d-flex align-items-end">
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => removeDocumentRequirement(index)}
                          className="mb-2"
                        >
                          Remove
                        </Button>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={8}>
                        <Form.Group className="mb-2">
                          <Form.Label>Description</Form.Label>
                          <Form.Control
                            type="text"
                            value={doc.description}
                            onChange={(e) => updateDocumentRequirement(index, 'description', e.target.value)}
                            placeholder="Brief description of the document"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4} className="d-flex align-items-center">
                        <Form.Check
                          type="checkbox"
                          label="Mandatory Document"
                          checked={doc.is_mandatory}
                          onChange={(e) => updateDocumentRequirement(index, 'is_mandatory', e.target.checked)}
                        />
                      </Col>
                    </Row>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            ) : (
              <Alert variant="info">
                No document requirements added. Click "Add Document Requirement" to add required documents for this program.
              </Alert>
            )}

          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  {editingProgram ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingProgram ? 'Update Program' : 'Create Program'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <strong>Are you sure you want to delete this program?</strong>
          </Alert>
          <p>
            Program: <strong>{deletingProgram?.name}</strong><br />
            Code: <strong>{deletingProgram?.code}</strong>
          </p>
          <p className="text-danger">
            <strong>Warning:</strong> This action cannot be undone. The program will be permanently deleted.
            However, if there are existing applications for this program, deletion will be prevented.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={confirmDelete}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              'Delete Program'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ProgramManagement;
