import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import programService from '../../services/programService';
import adminService from '../../services/adminService';

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    head_of_department: ''
  });

  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchDepartments();
  }, [user, navigate]);

  const fetchDepartments = async () => {
    try {
      const data = await programService.getDepartments();
      setDepartments(data);
      setError(null);
    } catch (error) {
      setError('Failed to fetch departments');
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
      description: '',
      head_of_department: ''
    });
    setEditingDepartment(null);
  };

  const handleCreateDepartment = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditDepartment = (department) => {
    setFormData({
      name: department.name,
      code: department.code,
      description: department.description || '',
      head_of_department: department.head_of_department || ''
    });
    setEditingDepartment(department);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
  
    try {
      if (editingDepartment) {
        await adminService.updateDepartment(editingDepartment.id, formData);
      } else {
        await adminService.createDepartment(formData);
      }
  
      setShowModal(false);
      resetForm();
      await fetchDepartments();
    } catch (error) {
      let errorMessage = 'Failed to save department';
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          errorMessage = Object.entries(errorData)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('; ');
        } else {
          errorMessage = errorData;
        }
      }
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <Spinner animation="border" />
          <p>Loading departments...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>Department Management</h2>
              <p className="text-muted">Create and manage academic departments</p>
            </div>
            <Button variant="primary" onClick={handleCreateDepartment}>
              Create New Department
            </Button>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Card>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="table-light">
              <tr>
                <th>Department Name</th>
                <th>Code</th>
                <th>Head of Department</th>
                <th>Programs</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map(department => (
                <tr key={department.id}>
                  <td>
                    <div>
                      <strong>{department.name}</strong>
                      {department.description && (
                        <div className="small text-muted">
                          {department.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <code>{department.code}</code>
                  </td>
                  <td>
                    {department.head_of_department || 'Not assigned'}
                  </td>
                  <td>
                    <span className="badge bg-primary">
                      {department.programs?.length || 0} Programs
                    </span>
                  </td>
                  <td>
                    <div className="small text-muted">
                      {new Date(department.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEditDepartment(department)}
                      >
                        Edit
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Department Form Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingDepartment ? 'Edit Department' : 'Create New Department'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Department Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="e.g., Computer Science and Engineering"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Department Code *</Form.Label>
              <Form.Control
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                required
                placeholder="e.g., CSE"
                style={{ textTransform: 'uppercase' }}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Head of Department</Form.Label>
              <Form.Control
                type="text"
                name="head_of_department"
                value={formData.head_of_department}
                onChange={handleInputChange}
                placeholder="e.g., Dr. John Smith"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of the department..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  {editingDepartment ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingDepartment ? 'Update Department' : 'Create Department'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default DepartmentManagement;
