import React from "react";
import { Container, Row, Col, Card, Button, Badge } from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../../store/authSlice";

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

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

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>Dashboard</h2>
            <Button variant="outline-danger" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </Col>
      </Row>

      <Row>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Profile Information</Card.Title>
              <div className="mb-3">
                <strong>Name:</strong> {user?.first_name} {user?.last_name}
              </div>
              <div className="mb-3">
                <strong>Username:</strong> {user?.username}
              </div>
              <div className="mb-3">
                <strong>Email:</strong> {user?.email}
              </div>
              <div className="mb-3">
                <strong>Role:</strong>{" "}
                <Badge bg={getRoleBadgeColor(user?.role)}>
                  {user?.role?.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
              <div className="mb-3">
                <strong>Phone:</strong> {user?.phone_number || "Not provided"}
              </div>
              <div className="mb-3">
                <strong>Status:</strong>{" "}
                <Badge bg={user?.is_verified ? "success" : "warning"}>
                  {user?.is_verified ? "Verified" : "Pending Verification"}
                </Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Welcome to College Admission Portal</Card.Title>
              <Card.Text>
                Welcome {user?.first_name}! This is your dashboard where you can
                manage your applications, view notifications, and track your
                admission status.
              </Card.Text>
              // Add this to the applicant quick actions section:
              {user?.role === "applicant" && (
                <div className="mt-4">
                  <h5>Quick Actions</h5>
                  <div className="d-grid gap-2 d-md-flex">
                    <Button
                      variant="primary"
                      className="me-md-2"
                      onClick={() => navigate("/programs")}
                    >
                      Browse Programs
                    </Button>
                    <Button
                      variant="success"
                      onClick={() => navigate("/applications")}
                    >
                      My Applications
                    </Button>
                    <Button variant="info">Profile Settings</Button>
                  </div>
                </div>
              )}
              {user?.role === "admission_officer" && (
                <div className="mt-4">
                  <h5>Quick Actions</h5>
                  <div className="d-grid gap-2 d-md-flex">
                    <Button variant="primary" className="me-md-2">
                      Review Applications
                    </Button>
                    <Button variant="warning">Pending Reviews</Button>
                    <Button variant="info">Generate Reports</Button>
                  </div>
                </div>
              )}
              {user?.role === "admin" && (
                <div className="mt-4">
                  <h5>Admin Actions</h5>
                  <div className="d-grid gap-2 d-md-flex">
                    <Button variant="danger" className="me-md-2" href="/admin/users">
                      Manage Users
                    </Button>
                    <Button variant="primary">System Settings</Button>
                    <Button variant="success">Analytics</Button>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <Card.Title>Recent Activity</Card.Title>
              <Card.Text className="text-muted">
                No recent activity to show. Start by exploring the available
                features based on your role.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
