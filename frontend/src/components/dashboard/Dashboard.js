import React, { useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Card, Button, Badge, Spinner, ListGroup } from "react-bootstrap";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import applicationService from "../../services/applicationService";

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [apps, setApps] = useState([]);
  const navigate = useNavigate();

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin":
        return "danger";
      case "admission_officer":
        return "warning";
      case "applicant":
        return "primary";
      default:
        return "secondary";
    }
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const data = await applicationService.getApplications();
        // API may return array or paginated {results}
        setApps(data.results || data || []);
      } catch (e) {
        setApps([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const stats = useMemo(() => {
    const s = {
      total: apps.length,
      draft: 0,
      submitted: 0,
      under_review: 0,
      shortlisted: 0,
      admitted: 0,
      rejected: 0,
      waitlisted: 0,
      completionRate: 0,
    };
    if (!apps.length) return s;
    let completeCount = 0;
    apps.forEach((a) => {
      s[a.status] = (s[a.status] || 0) + 1;
      if (a.is_complete) completeCount += 1;
    });
    s.completionRate = Math.round((completeCount / apps.length) * 100);
    return s;
  }, [apps]);

  const KpiCard = ({ title, value, variant = "primary", subtitle }) => (
    <Card className={`border-0 shadow-sm h-100`}> 
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <div className="text-muted small">{title}</div>
            <div className="display-6 fw-semibold">{value}</div>
            {subtitle && <div className="text-muted small mt-1">{subtitle}</div>}
          </div>
          <Badge bg={variant} className="rounded-pill">{variant.toUpperCase()}</Badge>
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <Container className="mt-4">
      {/* Hero Header */}
      <Card className="border-0 shadow-sm mb-4" style={{
        background: "linear-gradient(135deg,rgb(165, 168, 173) 0%,rgb(183, 181, 184) 100%)",
        color: "#fff"
      }}>
        <Card.Body>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
            <div>
              <h2 className="mb-1">Welcome, {user?.first_name || user?.username} 👋</h2>
              <div className="small">
                You are signed in as <Badge bg={getRoleBadgeColor(user?.role)}>{user?.role?.replace("_"," ").toUpperCase()}</Badge>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* KPI Row */}
      <Row className="g-3 mb-4">
        <Col md={3} xs={6}><KpiCard title="Total Applications" value={stats.total} variant="primary" /></Col>
        <Col md={3} xs={6}><KpiCard title="Submitted" value={stats.submitted} variant="info" /></Col>
        <Col md={3} xs={6}><KpiCard title="Under Review" value={stats.under_review} variant="warning" /></Col>
        <Col md={3} xs={6}><KpiCard title="Admitted" value={stats.admitted} variant="success" /></Col>
      </Row>

      <Row className="g-4">
        {/* Left Column */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Card.Title className="mb-0">Your Profile</Card.Title>
              </div>
              <Row>
                <Col md={6}>
                  <div className="mb-2"><strong>Name:</strong> {user?.first_name} {user?.last_name}</div>
                  <div className="mb-2"><strong>Username:</strong> {user?.username}</div>
                  <div className="mb-2"><strong>Email:</strong> {user?.email}</div>
                </Col>
                <Col md={6}>
                  <div className="mb-2"><strong>Phone:</strong> {user?.phone_number || "Not provided"}</div>
                  {user?.role === "applicant" && (
                    <div className="mb-2"><strong>Status:</strong> {" "}
                      <Badge bg={user?.is_verified ? "success" : "warning"}>
                        {user?.is_verified ? "Verified" : "Pending Verification"}
                      </Badge>
                    </div>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Card.Title className="mb-0">Recent Applications</Card.Title>
                <Button size="sm" variant="outline-primary" onClick={() => navigate("/applications")}>View All</Button>
              </div>
              {loading ? (
                <div className="text-center py-4"><Spinner animation="border" /></div>
              ) : (
                <ListGroup variant="flush">
                  {(apps.slice(0,5)).map((a) => (
                    <ListGroup.Item key={a.id} className="px-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-semibold">{a.program_name || a.program?.name} <span className="text-muted small">#{a.application_number}</span></div>
                          <div className="small text-muted">Status: {a.status?.replace("_"," ")}</div>
                        </div>
                        <Badge bg={a.is_complete ? "success" : "secondary"}>{a.is_complete ? "Complete" : "Incomplete"}</Badge>
                      </div>
                    </ListGroup.Item>
                  ))}
                  {apps.length === 0 && (
                    <div className="text-muted">No applications yet.</div>
                  )}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Card.Title>Quick Actions</Card.Title>
              {user?.role === "applicant" && (
                <div className="d-grid gap-2">
                  <Button variant="primary" onClick={() => navigate("/programs")}>Browse Programs</Button>
                  <Button variant="success" onClick={() => navigate("/applications")}>My Applications</Button>
                  <Button variant="outline-secondary" onClick={() => navigate("/dashboard")}>
                    Profile Settings
                  </Button>
                </div>
              )}
              {user?.role === "admission_officer" && (
                <div className="d-grid gap-2">
                  <Button variant="primary" onClick={() => navigate("/admin/applications")}>Review Applications</Button>
                  <Button variant="warning" onClick={() => navigate("/admin/applications")}>Pending Reviews</Button>
                </div>
              )}
              {user?.role === "admin" && (
                <div className="d-grid gap-2">
                  <Button variant="danger" onClick={() => navigate("/admin/users")}>Manage Users</Button>
                  <Button variant="primary" onClick={() => navigate("/admin/programs")}>Manage Programs</Button>
                  <Button variant="success" onClick={() => navigate("/admin/departments")}>Manage Departments</Button>
                </div>
              )}
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Card.Title>Overview</Card.Title>
              <ListGroup variant="flush">
                <ListGroup.Item className="px-0 d-flex justify-content-between"><span>Completion Rate</span><strong>{stats.completionRate}%</strong></ListGroup.Item>
                <ListGroup.Item className="px-0 d-flex justify-content-between"><span>Shortlisted</span><strong>{stats.shortlisted}</strong></ListGroup.Item>
                <ListGroup.Item className="px-0 d-flex justify-content-between"><span>Rejected</span><strong>{stats.rejected}</strong></ListGroup.Item>
                <ListGroup.Item className="px-0 d-flex justify-content-between"><span>Waitlisted</span><strong>{stats.waitlisted}</strong></ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
