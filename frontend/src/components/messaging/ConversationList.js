import React from 'react';
import { ListGroup, Badge, Spinner } from 'react-bootstrap';
import { formatDistanceToNow } from 'date-fns';

const ConversationList = ({ conversations, selectedConversation, onSelectConversation, loading }) => {
  const formatTime = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  const truncateMessage = (content, maxLength = 50) => {
    if (!content) return 'No messages yet';
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
        <Spinner animation="border" />
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="text-center p-4 text-muted">
        <i className="bi bi-inbox fs-1 mb-3"></i>
        <p>No conversations yet</p>
      </div>
    );
  }

  return (
    <ListGroup variant="flush" style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
      {conversations.map((conversation) => {
        const otherUser = conversation.officer?.id !== conversation.applicant?.id 
          ? (conversation.officer || conversation.applicant)
          : conversation.applicant;
        
        return (
          <ListGroup.Item
            key={conversation.id}
            action
            active={selectedConversation?.id === conversation.id}
            onClick={() => onSelectConversation(conversation)}
            className="border-0"
            style={{ cursor: 'pointer' }}
          >
            <div className="d-flex justify-content-between align-items-start">
              <div className="flex-grow-1">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <h6 className="mb-0">
                    {otherUser?.full_name || `${otherUser?.first_name} ${otherUser?.last_name}` || otherUser?.username}
                  </h6>
                  <small className="text-muted">
                    {conversation.last_message && formatTime(conversation.last_message.sent_at)}
                  </small>
                </div>
                
                <div className="d-flex justify-content-between align-items-center">
                  <p className="mb-0 text-muted small">
                    {conversation.last_message 
                      ? truncateMessage(conversation.last_message.content)
                      : 'No messages yet'
                    }
                  </p>
                  
                  {conversation.unread_count > 0 && (
                    <Badge bg="danger" pill>
                      {conversation.unread_count}
                    </Badge>
                  )}
                </div>
                
                <div className="mt-1">
                  <small className="text-muted">
                    <i className="bi bi-person me-1"></i>
                    {otherUser?.role === 'admission_officer' ? 'Officer' : 'Applicant'}
                  </small>
                  {conversation.subject && conversation.subject !== 'Application Discussion' && (
                    <small className="text-muted ms-2">
                      <i className="bi bi-tag me-1"></i>
                      {conversation.subject}
                    </small>
                  )}
                </div>
              </div>
            </div>
          </ListGroup.Item>
        );
      })}
    </ListGroup>
  );
};

export default ConversationList;