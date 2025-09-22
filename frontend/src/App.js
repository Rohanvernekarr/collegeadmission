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
import VerifyEmail from "./components/auth/VerifyEmail";
import AdminLogin from "./components/auth/AdminLogin";
import OfficerLogin from "./components/auth/OfficerLogin";
import Dashboard from "./components/dashboard/Dashboard";
import ProgramList from "./components/programs/ProgramList";
import ProgramDetail from "./components/programs/ProgramDetail";
import ApplicationForm from "./components/applications/ApplicationForm";
import ApplicationList from "./components/applications/ApplicationList";
import ApplicationDetail from "./components/applications/ApplicationDetail";
import ApplicationEdit from "./components/applications/ApplicationEdit";
import DocumentUpload from "./components/applications/DocumentUpload";
import ProgramManagement from "./components/admin/ProgramManagement";
import DepartmentManagement from "./components/admin/DepartmentManagement";
import ApplicationReview from "./components/officer/ApplicationReview";
import Messages from "./components/messaging/Messages";
import ProtectedRoute from "./components/common/ProtectedRoute";
import UserManagement from "./components/admin/UserManagement";
import SimpleFooter from "./components/common/Footer";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import ToastProvider from "./components/ui/ToastProvider";

function App() {
  return (
    <Provider store={store}>
      <Router>
        <ToastProvider>
          <div className="App">
            <NavigationBar />
            <Routes>
            <Route path="/" element={<Navigate to="/programs" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/officer/login" element={<OfficerLogin />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
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
              path="/applications/:applicationId/edit"
              element={
                <ProtectedRoute>
                  <ApplicationEdit />
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
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <Messages />
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
            <SimpleFooter/>
          </div>
        </ToastProvider>
      </Router>
    </Provider>
  );
}

export default App;
