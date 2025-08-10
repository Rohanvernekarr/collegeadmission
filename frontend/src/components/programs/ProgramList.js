import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, InputGroup, Badge, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import programService from '../../services/programService';

const ProgramList = () => {
  const [programs, setPrograms] = useState([]);
  const [departments, setDepartments] = useState([]); // Ensure initial state is array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    department: '',
    program_type: '',
  });

  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchDepartments();
    fetchPrograms();
  }, []);

  useEffect(() => {
    fetchPrograms();
  }, [filters]);

  const fetchDepartments = async () => {
    try {
      console.log('Fetching departments...');
      const data = await programService.getDepartments();
      console.log('Departments data:', data);
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setDepartments(data);
      } else if (data && Array.isArray(data.results)) {
        setDepartments(data.results);
      } else {
        console.warn('Departments data is not an array:', data);
        setDepartments([]);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]); // Fallback to empty array
    }
  };

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      console.log('Fetching programs with filters:', filters);
      
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.department) params.department = filters.department;
      if (filters.program_type) params.program_type = filters.program_type;

      const data = await programService.getPrograms(params);
      console.log('Programs data:', data);
      
      // Handle both paginated and direct array responses
      if (Array.isArray(data)) {
        setPrograms(data);
      } else if (data && Array.isArray(data.results)) {
        setPrograms(data.results);
      } else {
        console.warn('Programs data is not an array:', data);
        setPrograms([]);
      }
      
      setError(null);
    } catch (error) {
      console.error('Error fetching programs:', error);
      let errorMessage = 'Failed to fetch programs';
      
      if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error: Please check if the backend server is running on http://localhost:8000';
      } else if (error.response) {
        errorMessage = `Server error (${error.response.status}): ${error.response.data?.detail || error.response.statusText}`;
      } else if (error.request) {
        errorMessage = 'No response from server. Please check if the backend is running.';
      }
      
      setError(errorMessage);
      setPrograms([]); // Fallback to empty array
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApplyClick = (program) => {
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

  const getStatusBadge = (program) => {
    if (!program.is_application_open) {
      return <Badge bg="danger">Closed</Badge>;
    }
    if (program.available_seats <= 0) {
      return <Badge bg="warning">Full</Badge>;
    }
    return <Badge bg="success">Open</Badge>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h2>Available Programs</h2>
          <p className="text-muted">Browse and apply for college programs</p>
        </Col>
      </Row>

      {/* Filters */}
      <Row className="mb-4">
        <Col md={4}>
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Search programs..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={3}>
          <Form.Select
            value={filters.department}
            onChange={(e) => handleFilterChange('department', e.target.value)}
          >
            <option value="">All Departments</option>
            {/* Safe department mapping with proper checks */}
            {Array.isArray(departments) && departments.length > 0 
              ? departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))
              : !Array.isArray(departments) && (
                  <option disabled>Loading departments...</option>
                )
            }
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Select
            value={filters.program_type}
            onChange={(e) => handleFilterChange('program_type', e.target.value)}
          >
            <option value="">All Types</option>
            <option value="undergraduate">Undergraduate</option>
            <option value="postgraduate">Postgraduate</option>
            <option value="diploma">Diploma</option>
            <option value="certificate">Certificate</option>
          </Form.Select>
        </Col>
        <Col md={2}>
          <Button variant="outline-secondary" onClick={() => setFilters({ search: '', department: '', program_type: '' })}>
            Clear
          </Button>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
          <hr />
          <small>
            Debug info: Departments is {Array.isArray(departments) ? 'array' : typeof departments} 
            with {Array.isArray(departments) ? departments.length : 'unknown'} items
          </small>
        </Alert>
      )}

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" />
          <p>Loading programs...</p>
        </div>
      ) : (
        <Row>
          {!Array.isArray(programs) || programs.length === 0 ? (
            <Col>
              <Alert variant="info">
                No programs found matching your criteria.
                <br />
                <small>Programs data type: {Array.isArray(programs) ? 'array' : typeof programs}</small>
              </Alert>
            </Col>
          ) : (
            programs.map(program => (
              <Col key={program.id} md={6} lg={4} className="mb-4">
                <Card className="h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <Card.Title className="h5">{program.name}</Card.Title>
                      {getStatusBadge(program)}
                    </div>
                    
                    <Card.Subtitle className="mb-2 text-muted">
                      {program.department_name}
                    </Card.Subtitle>
                    
                    <div className="mb-3">
                      <Badge bg="secondary" className="me-2">
                        {program.program_type?.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Badge bg="info">
                        {program.duration_years} Year{program.duration_years > 1 ? 's' : ''}
                      </Badge>
                    </div>

                    <div className="mb-3">
                      <div><strong>Fees:</strong> {formatCurrency(program.fees_per_semester)}/semester</div>
                      <div><strong>Application Fee:</strong> {formatCurrency(program.application_fee)}</div>
                      <div><strong>Min. Percentage:</strong> {program.min_percentage}%</div>
                      <div><strong>Available Seats:</strong> {program.available_seats}</div>
                    </div>

                    <div className="mb-3">
                      <small className="text-muted">
                        Application Deadline: {new Date(program.application_end_date).toLocaleDateString()}
                      </small>
                    </div>
                  </Card.Body>
                  
                  <Card.Footer>
                    <div className="d-grid gap-2">
                      <Button
                        variant="outline-primary"
                        onClick={() => navigate(`/programs/${program.id}`)}
                      >
                        View Details
                      </Button>
                      {user?.role === 'applicant' && program.is_application_open && program.available_seats > 0 && (
                        <Button
                          variant="primary"
                          onClick={() => handleApplyClick(program)}
                        >
                          Apply Now
                        </Button>
                      )}
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
            ))
          )}
        </Row>
      )}
    </Container>
  );
};

export default ProgramList;
