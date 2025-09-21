import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { verifyEmail, resendOtp } from '../../store/authSlice';
import { Form, Button, Alert, Container, Row, Col, Card } from 'react-bootstrap';
import { toast } from 'react-toastify';

const VerifyEmail = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(60);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { verification } = useSelector((state) => state.auth);
  const email = verification?.email || localStorage.getItem('verificationEmail');
  
  // Save email to localStorage when it's available
  useEffect(() => {
    if (verification.email) {
      localStorage.setItem('verificationEmail', verification.email);
    }
  }, [verification.email]);
  
  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendDisabled && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setResendDisabled(false);
    }
  }, [resendDisabled, countdown]);
  
  // Redirect if already verified
  useEffect(() => {
    if (verification.success) {
      toast.success('Email verified successfully!');
      navigate('/dashboard');
    }
  }, [verification.success, navigate]);
  
  // Handle OTP input change
  const handleOtpChange = (e, index) => {
    const value = e.target.value;
    
    // Only allow numbers and limit to 1 character
    if (value === '' || /^[0-9]$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto-focus to next input
      if (value !== '' && index < 5) {
        document.getElementById(`otp-${index + 1}`)?.focus();
      }
    }
  };
  
  // Handle paste OTP
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text/plain').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const newOtp = pasteData.split('').slice(0, 6);
      setOtp([...newOtp, ...Array(6 - newOtp.length).fill('')]);
    }
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    
    if (email) {
      dispatch(verifyEmail({ email, otp: otpCode }));
    } else {
      toast.error('Email not found. Please try registering again.');
      navigate('/register');
    }
  };
  
  // Handle resend OTP
  const handleResendOtp = () => {
    if (email) {
      dispatch(resendOtp(email));
      setResendDisabled(true);
      setCountdown(60);
      toast.success('A new OTP has been sent to your email');
    } else {
      toast.error('Email not found. Please try registering again.');
      navigate('/register');
    }
  };
  
  // If no email is found, redirect to register
  if (!email) {
    navigate('/register');
    return null;
  }

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="shadow">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h3>Verify Your Email</h3>
                <p className="text-muted">
                  We've sent a 6-digit verification code to <strong>{email}</strong>
                </p>
              </div>
              
              {verification.error && (
                <Alert variant="danger" className="mb-4">
                  {verification.error}
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit}>
                <div className="d-flex justify-content-between mb-4">
                  {otp.map((digit, index) => (
                    <Form.Control
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(e, index)}
                      onPaste={handlePaste}
                      className="text-center mx-1"
                      style={{
                        height: '60px',
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                      }}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
                
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="w-100 mb-3"
                  disabled={verification.loading}
                >
                  {verification.loading ? 'Verifying...' : 'Verify Email'}
                </Button>
                
                <div className="text-center mt-3">
                  <p className="mb-0">
                    Didn't receive the code?{' '}
                    <Button 
                      variant="link" 
                      onClick={handleResendOtp} 
                      disabled={resendDisabled || verification.resendLoading}
                      className="p-0"
                    >
                      {verification.resendLoading 
                        ? 'Sending...' 
                        : resendDisabled 
                          ? `Resend OTP (${countdown}s)` 
                          : 'Resend OTP'}
                    </Button>
                  </p>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default VerifyEmail;
