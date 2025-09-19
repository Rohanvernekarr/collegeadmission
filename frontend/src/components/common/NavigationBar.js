import React from 'react';
import { Navbar, Nav, NavDropdown, Container, Badge } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useSelector} from 'react-redux';

import LogoutButton from './LogoutButton';

const NavigationBar = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'danger';
      case 'admission_officer':
        return 'warning';
      case 'applicant':
        return 'primary';
      default:
        return 'secondary';
    }
  };

  return (
    <Navbar expand="lg" className="shadow-sm navbar-gradient" sticky="top">
      <Container>
        <LinkContainer to="/">
          <Navbar.Brand>
            <strong>🎓 College Portal</strong>
          </Navbar.Brand>
        </LinkContainer>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <LinkContainer to="/programs">
              <Nav.Link>Programs</Nav.Link>
            </LinkContainer>

            {isAuthenticated && (
              <>
                <LinkContainer to="/dashboard">
                  <Nav.Link>Dashboard</Nav.Link>
                </LinkContainer>

                {user?.role === 'applicant' && (
                  <LinkContainer to="/applications">
                    <Nav.Link>My Applications</Nav.Link>
                  </LinkContainer>
                )}


                {['admin', 'admission_officer'].includes(user?.role) && (
                  <NavDropdown title="Administration" id="admin-dropdown">
                    <LinkContainer to="/admin/applications">
                      <NavDropdown.Item>Review Applications</NavDropdown.Item>
                    </LinkContainer>
                    {user?.role === 'admin' && (
                      <>
                        <LinkContainer to="/admin/users">
                          <NavDropdown.Item>Manage Users</NavDropdown.Item>
                        </LinkContainer>
                        <LinkContainer to="/admin/programs">
                          <NavDropdown.Item>Manage Programs</NavDropdown.Item>
                        </LinkContainer>
                        
                      </>
                    )}
                  </NavDropdown>
                )}
              </>
            )}
          </Nav>

          <Nav>
            {isAuthenticated ? (
              <NavDropdown
                title={
                  <span>
                    {user?.first_name} {user?.last_name}{' '}
                    {user?.is_verified && (
                      <Badge bg="success" className="ms-1">Verified</Badge>
                    )}
                    <Badge bg={getRoleColor(user?.role)} className="ms-1">
                      {user?.role?.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </span>
                }
                id="user-dropdown"
              >
                <LinkContainer to="/profile">
                  <NavDropdown.Item>Profile Settings</NavDropdown.Item>
                </LinkContainer>
                <NavDropdown.Divider />
                <NavDropdown.Item>
                  <LogoutButton />
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <LinkContainer to="/login">
                  <Nav.Link>Login</Nav.Link>
                </LinkContainer>
                <LinkContainer to="/register">
                  <Nav.Link>Register</Nav.Link>
                </LinkContainer>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;
