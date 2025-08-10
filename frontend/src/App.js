import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/store";
import NavigationBar from "./components/common/NavigationBar";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import Dashboard from "./components/dashboard/Dashboard";
import ProgramList from "./components/programs/ProgramList";
import ProgramDetail from "./components/programs/ProgramDetail";
import ApplicationForm from "./components/applications/ApplicationForm";
import ApplicationList from "./components/applications/ApplicationList";
import ApplicationDetail from "./components/applications/ApplicationDetail";
import DocumentUpload from "./components/applications/DocumentUpload";
import ProgramManagement from "./components/admin/ProgramManagement";
import DepartmentManagement from "./components/admin/DepartmentManagement";
import ApplicationReview from "./components/officer/ApplicationReview";
import ProtectedRoute from "./components/common/ProtectedRoute";
import UserManagement from "./components/admin/UserManagement";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="App">
          <NavigationBar />
          <Routes>
            <Route path="/" element={<Navigate to="/programs" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/programs" element={<ProgramList />} />
            <Route path="/programs/:id" element={<ProgramDetail />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/apply/:programId"
              element={
                <ProtectedRoute>
                  <ApplicationForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/applications"
              element={
                <ProtectedRoute>
                  <ApplicationList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/applications/:applicationId"
              element={
                <ProtectedRoute>
                  <ApplicationDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/applications/:applicationId/documents"
              element={
                <ProtectedRoute>
                  <DocumentUpload />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/programs"
              element={
                <ProtectedRoute>
                  <ProgramManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/departments"
              element={
                <ProtectedRoute>
                  <DepartmentManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/applications"
              element={
                <ProtectedRoute>
                  <ApplicationReview />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </Provider>
  );
}

export default App;
