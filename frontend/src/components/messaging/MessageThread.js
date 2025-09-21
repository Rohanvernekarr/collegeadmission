import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { format, isToday, isYesterday } from 'date-fns';
import { fetchConversation, sendMessage, clearError } from '../../store/messagingSlice';

const MessageThread = ({ conversation, currentUser }) => {
  const [newMessage, setNewMessage] = useState('');
  const [isPolling, setIsPolling] = useState(true);
  const messagesEndRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const lastMessageCountRef = useRef(0);
  const dispatch = useDispatch();
  
  const { currentConversation, sendingMessage, error } = useSelector((state) => state.messaging);

  // Fetch conversation data
  const fetchConversationData = useCallback(() => {
    if (conversation?.id) {
      dispatch(fetchConversation(conversation.id));
    }
  }, [conversation?.id, dispatch]);

  useEffect(() => {
    fetchConversationData();
  }, [fetchConversationData]);

  // Set up polling for new messages
  useEffect(() => {
    if (conversation?.id && isPolling) {
      // Poll every 3 seconds for new messages
      pollingIntervalRef.current = setInterval(() => {
        fetchConversationData();
      }, 3000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [conversation?.id, isPolling, fetchConversationData]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    const currentMessageCount = currentConversation?.messages?.length || 0;
    if (currentMessageCount > lastMessageCountRef.current) {
      scrollToBottom();
      lastMessageCountRef.current = currentMessageCount;
    }
  }, [currentConversation?.messages]);

  // Pause polling when user is typing
  useEffect(() => {
    if (newMessage.trim()) {
      setIsPolling(false);
    } else {
      setIsPolling(true);
    }
  }, [newMessage]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentConversation?.id) return;

    const messageData = { content: newMessage.trim() };
    
    try {
      await dispatch(sendMessage({ 
        conversationId: currentConversation.id, 
        messageData 
      })).unwrap();
      setNewMessage('');
      // Immediately fetch updated conversation after sending
      setTimeout(() => fetchConversationData(), 500);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM dd, HH:mm');
    }
  };

  const getOtherUser = () => {
    if (!currentConversation) return null;
    return currentUser?.id === currentConversation.officer?.id 
      ? currentConversation.applicant 
      : currentConversation.officer;
  };

  if (!currentConversation) {
    return (
      <div className="d-flex justify-content-center align-items-center h-100">
        <Spinner animation="border" />
      </div>
    );
  }

  const otherUser = getOtherUser();

  return (
    <>
      <Card.Header className="bg-light">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0">
              {otherUser?.full_name || `${otherUser?.first_name} ${otherUser?.last_name}` || otherUser?.username}
            </h5>
            <small className="text-muted">
              {otherUser?.role === 'admission_officer' ? 'Admission Officer' : 'Applicant'}
              {currentConversation.subject && currentConversation.subject !== 'Application Discussion' && 
                ` • ${currentConversation.subject}`
              }
            </small>
          </div>
          <div className="text-muted small d-flex align-items-center">
            <div className="me-3">
              {currentConversation.messages?.length || 0} messages
            </div>
            <div>
              {isPolling ? (
                <>
                  <i className="bi bi-circle-fill text-success me-1" style={{ fontSize: '8px' }}></i>
                  <span>Live</span>
                </>
              ) : (
                <>
                  <i className="bi bi-pause-circle text-warning me-1"></i>
                  <span>Typing...</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Card.Header>

      <Card.Body 
        className="p-0" 
        style={{ 
          height: 'calc(100vh - 400px)', 
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {error && (
          <Alert variant="danger" className="m-3 mb-0">
            {error}
          </Alert>
        )}

        <div className="flex-grow-1 p-3">
          {!currentConversation.messages || currentConversation.messages.length === 0 ? (
            <div className="text-center text-muted">
              <i className="bi bi-chat-dots fs-1 mb-3"></i>
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="d-flex flex-column-reverse">
              {currentConversation.messages
                .filter(message => message && message.sender) // Filter out invalid messages
                .map((message) => {
                  const isOwnMessage = message.sender.id === currentUser?.id;
                  return (
                    <div
                      key={message.id}
                      className={`mb-3 d-flex ${isOwnMessage ? 'justify-content-end' : 'justify-content-start'}`}
                    >
                      <div
                        className={`px-3 py-2 rounded-3 ${
                          isOwnMessage
                            ? 'bg-primary text-white'
                            : 'bg-light text-dark'
                        }`}
                        style={{ maxWidth: '70%' }}
                      >
                        <div className="message-content">
                          {message.content}
                        </div>
                        <div
                          className={`small mt-1 ${
                            isOwnMessage ? 'text-white-50' : 'text-muted'
                          }`}
                        >
                          {formatMessageTime(message.sent_at)}
                          {isOwnMessage && (
                            <span className="ms-1">
                              <i className={`bi ${message.is_read ? 'bi-check2-all' : 'bi-check2'}`}></i>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-top p-3">
          <Form onSubmit={handleSendMessage}>
            <div className="d-flex gap-2">
              <Form.Control
                type="text"
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={sendingMessage}
                style={{ resize: 'none' }}
              />
              <Button
                type="submit"
                variant="primary"
                disabled={!newMessage.trim() || sendingMessage}
              >
                {sendingMessage ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <i className="bi bi-send"></i>
                )}
              </Button>
            </div>
          </Form>
        </div>
      </Card.Body>
    </>
  );
};

export default MessageThread;