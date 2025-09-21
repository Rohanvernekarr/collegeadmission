import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { createConversation, fetchAvailableApplicants, clearError } from '../../store/messagingSlice';

const NewConversationModal = ({ show, onHide, onConversationCreated, preSelectedApplicant = null }) => {
  const [formData, setFormData] = useState({
    applicant_id: '',
    subject: 'Application Discussion',
    initial_message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const dispatch = useDispatch();
  const { availableApplicants, loading, error } = useSelector((state) => state.messaging);

  useEffect(() => {
    if (show) {
      if (preSelectedApplicant && preSelectedApplicant.id) {
        // If we have a pre-selected applicant, set it and don't fetch the list
        setFormData(prev => ({
          ...prev,
          applicant_id: preSelectedApplicant.id.toString(),
          subject: `Application Discussion - ${preSelectedApplicant.program_name || 'Application'}`
        }));
      } else {
        // Only fetch available applicants if no pre-selection
        dispatch(fetchAvailableApplicants());
      }
    }
  }, [show, preSelectedApplicant, dispatch]);

  useEffect(() => {
    if (!show) {
      // Reset form when modal closes
      setFormData({
        applicant_id: '',
        subject: 'Application Discussion',
        initial_message: ''
      });
      dispatch(clearError());
    }
  }, [show, dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // allow submission when either applicant_id is selected in the form
    // or a preSelectedApplicant was passed in
    const effectiveApplicantId = formData.applicant_id || (preSelectedApplicant && preSelectedApplicant.id && preSelectedApplicant.id.toString());
    if (!effectiveApplicantId || !formData.initial_message.trim()) {
      // DEBUG: why are we not submitting?
      // eslint-disable-next-line no-console
      console.warn('NewConversationModal: submission prevented', { effectiveApplicantId, initial_message: formData.initial_message });
      return;
    }

    setSubmitting(true);
    try {
      const result = await dispatch(createConversation({
        applicant_id: parseInt(effectiveApplicantId),
        subject: formData.subject,
        initial_message: formData.initial_message.trim()
      })).unwrap();

      onConversationCreated(result);
    } catch (error) {
      // Better error details for debugging
      // eslint-disable-next-line no-console
      console.error('Failed to create conversation:', {
        message: error.message,
        response: error.response && (error.response.data || { status: error.response.status })
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Derived booleans for rendering
  const effectiveApplicantId = formData.applicant_id || (preSelectedApplicant && preSelectedApplicant.id && preSelectedApplicant.id.toString());
  const canSubmit = Boolean(effectiveApplicantId && formData.initial_message && formData.initial_message.trim());

  // DEBUG: log values to help diagnose why submit remains disabled
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('NewConversationModal debug:', {
      formData,
      preSelectedApplicant,
      effectiveApplicantId,
      canSubmit,
      submitting
    });
  }, [formData, preSelectedApplicant, effectiveApplicantId, canSubmit, submitting]);

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Start New Conversation</Modal.Title>
      </Modal.Header>
      
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && (
            <Alert variant="danger">
              {error}
            </Alert>
          )}

          <Form.Group className="mb-3">
            <Form.Label>
              {preSelectedApplicant ? 'Messaging' : 'Select Applicant'} *
            </Form.Label>
            {preSelectedApplicant ? (
              <div className="p-3 bg-light rounded border">
                <div className="fw-bold text-primary">
                  {preSelectedApplicant.full_name || preSelectedApplicant.user_name || `${(preSelectedApplicant.first_name || '')} ${(preSelectedApplicant.last_name || '')}`.trim() || preSelectedApplicant.username || 'Unknown User'}
                </div>
                <small className="text-muted">
                  {preSelectedApplicant.user_email || preSelectedApplicant.email || preSelectedApplicant.username || 'No email'}
                </small>
                {preSelectedApplicant.program_name && (
                  <div className="mt-1">
                    <small className="text-muted">Program: {preSelectedApplicant.program_name}</small>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Form.Select
                  name="applicant_id"
                  value={formData.applicant_id}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                >
                  <option value="">Choose an applicant...</option>
                  {availableApplicants.map(applicant => (
                    <option key={applicant.id} value={applicant.id}>
                      {applicant.full_name || `${applicant.first_name} ${applicant.last_name}`} ({applicant.username})
                    </option>
                  ))}
                </Form.Select>
                {loading && (
                  <div className="mt-2">
                    <Spinner animation="border" size="sm" className="me-2" />
                    Loading applicants...
                  </div>
                )}
              </>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Subject</Form.Label>
            <Form.Control
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              placeholder="Conversation subject"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Initial Message *</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              name="initial_message"
              value={formData.initial_message}
              onChange={handleInputChange}
              placeholder="Type your message to start the conversation..."
              required
            />
          </Form.Group>
        </Modal.Body>
        
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          {/** allow submission if preSelectedApplicant exists or applicant_id selected in form */}
          <Button 
            type="submit" 
            variant="primary" 
          
          >
            {submitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Starting Conversation...
              </>
            ) : (
              'Start Conversation'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default NewConversationModal;