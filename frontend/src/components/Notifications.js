// components/Notifications.js
import React, { useEffect, useRef, useState } from 'react';
import { GetFromCaching } from './Caching';
import { useToast } from '@chakra-ui/react'; 

const Notifications = () => {
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null); // Use useRef to persist WebSocket instance
  const toast = useToast();

  useEffect(() => {
    const email = GetFromCaching('email'); 
    if (email && !socketRef.current) {
      const wsUrl = `ws://127.0.0.1:8000/ws/${encodeURIComponent(email)}`;
      console.log("Connecting to WebSocket at:", wsUrl);
      const ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        const newMessage = event.data;
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        
        // Show toast notification
        toast({
          title: 'New Notification',
          description: newMessage,
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      };

      ws.onopen = () => {
        console.log("WebSocket connection opened for:", email);
      };
      
      ws.onclose = (event) => {
        console.log("WebSocket connection closed:", event);
      };
      
      socketRef.current = ws; // Store WebSocket reference
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null; // Cleanup socket on unmount
      }
    };
  }, [toast]);

  return (
    <div className="notifications">
      {messages.length > 0 && (
        <div>
          <ul style={{display: 'none' }}> 
            {messages.map((msg, index) => (
              <li key={index}>{msg}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Notifications;
