// // components/History.js

// import React, { useEffect, useRef, useState } from 'react';
// import { GetFromCaching } from './Caching';
// import { useToast } from '@chakra-ui/react';

// const History = () => {
//   const [messages, setMessages] = useState([]);
//   const [lastProcessedTimestamp, setLastProcessedTimestamp] = useState(null);
//   const socketRef = useRef(null);
//   const toast = useToast();

//   useEffect(() => {
//     const email = GetFromCaching('email');
//     if (email) {
//       const connectWebSocket = () => {
//         const wsUrl = `ws://127.0.0.1:8000/history/${encodeURIComponent(email)}`;
//         console.log("Connecting to WebSocket at:", wsUrl);
//         const ws = new WebSocket(wsUrl);

//         ws.onopen = () => {
//           console.log("WebSocket connection opened for:", email);
//         };

//         ws.onmessage = (event) => {
//           const { timestamp, message } = JSON.parse(event.data);

//           if (!lastProcessedTimestamp || timestamp > lastProcessedTimestamp) {
//             setLastProcessedTimestamp(timestamp);
//             setMessages((prevMessages) => [...prevMessages, message]);
//             fetchData();
//           } else {
//             console.log("Duplicate notification ignored for timestamp:", timestamp);
//           }
//         };

//         ws.onclose = (event) => {
//           console.log("WebSocket connection closed:", event);

//           setTimeout(() => {
//             console.log("Reconnecting WebSocket...");
//             connectWebSocket();  
//           }, 5000);  
//         };

//         socketRef.current = ws; 
//       };

//       connectWebSocket();

//       return () => {
//         if (socketRef.current) {
//           socketRef.current.close();
//           socketRef.current = null; 
//         }
//       };
//     }
//   }, [toast, lastProcessedTimestamp]);

//   return (
//     <div className="History">
//       {messages.length > 0 && (
//         <div>
//           <ul style={{ display: 'none' }}>
//             {messages.map((msg, index) => (
//               <li key={index}>{msg}</li>
//             ))}
//           </ul>
//         </div>
//       )}
//     </div>
//   );
// };

// export default History;
