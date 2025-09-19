import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Table, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import applicationService from '../../services/applicationService';
import PageHeader from '../ui/PageHeader';
import Loader from '../ui/Loader';
import EmptyState from '../ui/EmptyState';

const ApplicationList = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchApplications();
  }, []);

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

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const getUniqueStatuses = () => {
    const statuses = [...new Set(applications.map(app => app.status))];
    return statuses.sort();
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <Loader message="Loading applications..." />
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <PageHeader
        title="My Applications"
        subtitle="Track your college application status"
        actions={user?.role === 'applicant' ? (
          <Button variant="primary" onClick={() => navigate('/programs')}>New Application</Button>
        ) : null}
      />

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Filter */}
      <Row className="mb-4">
        <Col md={4}>
          <Form.Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Applications ({applications.length})</option>
            {getUniqueStatuses().map(status => {
              const count = applications.filter(app => app.status === status).length;
              return (
                <option key={status} value={status}>
                  {status.replace('_', ' ').toUpperCase()} ({count})
                </option>
              );
            })}
          </Form.Select>
        </Col>
      </Row>

      {applications.length === 0 ? (
        <EmptyState title="No applications yet" hint="Start a new application from the Programs page." />
      ) : filteredApplications.length === 0 ? (
        <EmptyState title="No matching applications" hint="Try a different filter." />
      ) : (
        <Card>
          <Card.Body className="p-0">
            <Table responsive hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Application #</th>
                  <th>Program</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Complete</th>
                  <th>Applied Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map(application => (
                  <tr key={application.id}>
                    <td>
                      <strong>{application.application_number}</strong>
                    </td>
                    <td>
                      <div>
                        <strong>{application.program_name}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="text-muted">
                        {application.department_name}
                      </span>
                    </td>
                    <td>
                      {getStatusBadge(application.status)}
                    </td>
                    <td>
                      <Badge bg={application.is_complete ? 'success' : 'warning'}>
                        {application.is_complete ? 'Complete' : 'Incomplete'}
                      </Badge>
                    </td>
                    <td>
                      <div className="small">
                        <div>Created: {new Date(application.created_at).toLocaleDateString()}</div>
                        {application.submitted_at && (
                          <div>Submitted: {new Date(application.submitted_at).toLocaleDateString()}</div>
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
                          View
                        </Button>
                        
                        {application.status === 'draft' && (
                          <>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => navigate(`/applications/${application.id}/edit`)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => navigate(`/applications/${application.id}/documents`)}
                            >
                              Documents
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default ApplicationList;
