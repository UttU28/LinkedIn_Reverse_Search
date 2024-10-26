// components/Notifications.js

import React, { useEffect, useRef, useState } from 'react';
import { GetFromCaching } from './Caching';
import { useToast } from '@chakra-ui/react';
import { handlePostRequest } from './StartUp'; // Import the function

const Notifications = ({ setData }) => { // Accept setData as a prop
  const [messages, setMessages] = useState([]);
  const [lastProcessedTimestamp, setLastProcessedTimestamp] = useState(null);
  const socketRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    const email = GetFromCaching('email');
    if (email) {
      const connectWebSocket = () => {
        const wsUrl = `ws://127.0.0.1:8000/ws/${encodeURIComponent(email)}`;
        console.log("Connecting to WebSocket at:", wsUrl);
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log("WebSocket connection opened for:", email);
        };

        ws.onmessage = async (event) => {
          const { timestamp, message } = JSON.parse(event.data);

          if (!lastProcessedTimestamp || timestamp > lastProcessedTimestamp) {
            setLastProcessedTimestamp(timestamp);
            setMessages((prevMessages) => [...prevMessages, message]);

            if (message.status === 'notif') {
              toast({
                title: 'New Notification',
                position: 'top-right',
                description: message['message']['description'] || 'No description available',
                status: 'info',
                duration: 5000,
                isClosable: true,
              });
              await handlePostRequest(email, setData); // Ensure setData is passed correctly
            } else {
              await handlePostRequest(email, setData); // Ensure setData is passed correctly
            }
          } else {
            console.log("Duplicate notification ignored for timestamp:", timestamp);
          }
        };

        ws.onclose = (event) => {
          console.log("WebSocket connection closed:", event);
          setTimeout(() => {
            console.log("Reconnecting WebSocket...");
            connectWebSocket();
          }, 5000);
        };

        socketRef.current = ws;
      };

      connectWebSocket();

      return () => {
        if (socketRef.current) {
          socketRef.current.close();
          socketRef.current = null;
        }
      };
    }
  }, [toast, lastProcessedTimestamp]);

  return (
    <div className="notifications">
      {messages.length > 0 && (
        <div>
          <ul style={{ display: 'none' }}>
            {messages.map((msg, index) => (
              <li key={index}>{msg.description || 'No message available'}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Notifications;
