import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert, Spinner, Badge, Tabs, Tab } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all');
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    role: 'applicant',
    password: '',
    password_confirm: '',
    is_active: true
  });

  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [usersData, statsData] = await Promise.all([
        adminService.getUsers(),
        adminService.getUserStatistics()
      ]);
      
      setUsers(usersData.results || usersData);
      setStatistics(statsData);
      setError(null);
    } catch (error) {
      setError('Failed to fetch data');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      phone_number: '',
      role: 'applicant',
      password: '',
      password_confirm: '',
      is_active: true
    });
    setEditingUser(null);
  };

  const handleCreateUser = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setFormData({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone_number: user.phone_number || '',
      role: user.role,
      password: '',
      password_confirm: '',
      is_active: user.is_active
    });
    setEditingUser(user);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password && formData.password !== formData.password_confirm) {
      setError("Passwords don't match");
      return;
    }

    setSubmitting(true);

    try {
      const submitData = { ...formData };
      if (editingUser && !submitData.password) {
        delete submitData.password;
        delete submitData.password_confirm;
      }

      if (editingUser) {
        await adminService.updateUser(editingUser.id, submitData);
      } else {
        await adminService.createUser(submitData);
      }

      setShowModal(false);
      resetForm();
      await fetchData();
    } catch (error) {
      let errorMessage = 'Failed to save user';
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

  const handleToggleUserStatus = async (userId) => {
    try {
      await adminService.toggleUserStatus(userId);
      await fetchData();
    } catch (error) {
      setError('Failed to update user status');
    }
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      'admin': { bg: 'danger', text: 'Admin' },
      'admission_officer': { bg: 'warning', text: 'Officer' },
      'applicant': { bg: 'primary', text: 'Applicant' }
    };
    const config = roleConfig[role] || roleConfig['applicant'];
    return <Badge bg={config.bg}>{config.text}</Badge>;
  };

  const getFilteredUsers = () => {
    if (filter === 'all') return users;
    return users.filter(user => user.role === filter);
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <Spinner animation="border" />
          <p>Loading users...</p>
        </div>
      </Container>
    );
  }

  const filteredUsers = getFilteredUsers();

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>User Management</h2>
              <p className="text-muted">Manage system users and permissions</p>
            </div>
            <Button variant="primary" onClick={handleCreateUser}>
              Create New User
            </Button>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-primary">{statistics.total_users}</h3>
              <p className="mb-0">Total Users</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-success">{statistics.active_users}</h3>
              <p className="mb-0">Active Users</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-info">{statistics.applicants}</h3>
              <p className="mb-0">Applicants</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-warning">{statistics.officers + statistics.admins}</h3>
              <p className="mb-0">Staff</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Users Table */}
      <Tabs
        activeKey={filter}
        onSelect={(k) => setFilter(k)}
        className="mb-4"
      >
        <Tab eventKey="all" title={`All Users (${users.length})`}>
          <UserTable 
            users={filteredUsers}
            onEdit={handleEditUser}
            onToggleStatus={handleToggleUserStatus}
            getRoleBadge={getRoleBadge}
          />
        </Tab>
        <Tab eventKey="admin" title={`Admins (${statistics.admins})`}>
          <UserTable 
            users={filteredUsers}
            onEdit={handleEditUser}
            onToggleStatus={handleToggleUserStatus}
            getRoleBadge={getRoleBadge}
          />
        </Tab>
        <Tab eventKey="admission_officer" title={`Officers (${statistics.officers})`}>
          <UserTable 
            users={filteredUsers}
            onEdit={handleEditUser}
            onToggleStatus={handleToggleUserStatus}
            getRoleBadge={getRoleBadge}
          />
        </Tab>
        <Tab eventKey="applicant" title={`Applicants (${statistics.applicants})`}>
          <UserTable 
            users={filteredUsers}
            onEdit={handleEditUser}
            onToggleStatus={handleToggleUserStatus}
            getRoleBadge={getRoleBadge}
          />
        </Tab>
      </Tabs>

      {/* User Form Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingUser ? 'Edit User' : 'Create New User'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Last Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Username *</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Role *</Form.Label>
                  <Form.Select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="applicant">Applicant</option>
                    <option value="admission_officer">Admission Officer</option>
                    <option value="admin">Admin</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Password {!editingUser && '*'}</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!editingUser}
                    placeholder={editingUser ? 'Leave blank to keep current password' : ''}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Confirm Password {!editingUser && '*'}</Form.Label>
                  <Form.Control
                    type="password"
                    name="password_confirm"
                    value={formData.password_confirm}
                    onChange={handleInputChange}
                    required={!editingUser}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                label="Active User"
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
                  {editingUser ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingUser ? 'Update User' : 'Create User'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

// User Table Component
const UserTable = ({ users, onEdit, onToggleStatus, getRoleBadge }) => (
  <Card>
    <Card.Body className="p-0">
      <Table responsive hover className="mb-0">
        <thead className="table-light">
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>
                <div>
                  <strong>{user.first_name} {user.last_name}</strong>
                  <div className="small text-muted">@{user.username}</div>
                </div>
              </td>
              <td>{user.email}</td>
              <td>{user.phone_number || 'N/A'}</td>
              <td>{getRoleBadge(user.role)}</td>
              <td>
                <Badge bg={user.is_active ? 'success' : 'danger'}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
              <td>
                <div className="small text-muted">
                  {new Date(user.created_at).toLocaleDateString()}
                </div>
              </td>
              <td>
                <div className="d-flex gap-1">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => onEdit(user)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant={user.is_active ? 'outline-danger' : 'outline-success'}
                    size="sm"
                    onClick={() => onToggleStatus(user.id)}
                  >
                    {user.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card.Body>
  </Card>
);

export default UserManagement;
