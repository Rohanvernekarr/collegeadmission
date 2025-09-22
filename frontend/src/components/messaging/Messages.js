import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import ConversationList from './ConversationList';
import MessageThread from './MessageThread';
import NewConversationModal from './NewConversationModal';
import { fetchConversations, fetchMessagingStats, clearError } from '../../store/messagingSlice';

const Messages = () => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { conversations, stats, loading, error } = useSelector((state) => state.messaging);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Only officers and applicants can access messaging
    if (!['admission_officer', 'applicant'].includes(user.role)) {
      navigate('/dashboard');
      return;
    }

    dispatch(fetchConversations());
    dispatch(fetchMessagingStats());
  }, [dispatch, user, navigate]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
  };

  const handleNewConversation = () => {
    setShowNewConversationModal(true);
  };

  const handleConversationCreated = (newConversation) => {
    setSelectedConversation(newConversation);
    setShowNewConversationModal(false);
  };

  return (
    <Container fluid className="mt-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>Messages</h2>
              <p className="text-muted">
                {user?.role === 'admission_officer' 
                  ? 'Communicate with applicants about their applications'
                  : 'Messages from admission officers'
                }
              </p>
            </div>
            <div className="d-flex align-items-center gap-3">
              <div className="text-center">
                <Badge bg="primary" className="fs-6">
                  {stats.total_conversations}
                </Badge>
                <div className="small text-muted">Total</div>
              </div>
              <div className="text-center">
                <Badge bg="danger" className="fs-6">
                  {stats.unread_messages}
                </Badge>
                <div className="small text-muted">Unread</div>
              </div>
              {user?.role === 'admission_officer' && (
                <Button variant="primary" onClick={handleNewConversation}>
                  New Message
                </Button>
              )}
            </div>
          </div>
        </Col>
      </Row>

      <Row style={{ height: 'calc(100vh - 200px)' }}>
        <Col lg={4} className="mb-3">
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">Conversations</h5>
            </Card.Header>
            <ConversationList
              conversations={conversations}
              selectedConversation={selectedConversation}
              onSelectConversation={handleConversationSelect}
              loading={loading}
              currentUser={user}
            />
          </Card>
        </Col>
        
        <Col lg={8}>
          <Card className="h-100">
            {selectedConversation ? (
              <MessageThread
                conversation={selectedConversation}
                currentUser={user}
              />
            ) : (
              <Card.Body className="d-flex align-items-center justify-content-center">
                <div className="text-center text-muted">
                  <i className="bi bi-chat-dots fs-1 mb-3"></i>
                  <h5>Select a conversation</h5>
                  <p>Choose a conversation from the list to start messaging</p>
                </div>
              </Card.Body>
            )}
          </Card>
        </Col>
      </Row>

      {/* New Conversation Modal */}
      {user?.role === 'admission_officer' && (
        <NewConversationModal
          show={showNewConversationModal}
          onHide={() => setShowNewConversationModal(false)}
          onConversationCreated={handleConversationCreated}
        />
      )}
    </Container>
  );
};

export default Messages;