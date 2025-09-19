import React from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/authSlice';
import { useNavigate } from 'react-router-dom';

const LogoutButton = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
    } catch (e) {
      // Ignore errors; client state is cleared in service finally
    } finally {
      navigate('/login');
    }
  };

  return (
    <button
      className="btn btn-outline-danger me-2"
      onClick={handleLogout}
    >
      Logout
    </button>
  );
};

export default LogoutButton;
