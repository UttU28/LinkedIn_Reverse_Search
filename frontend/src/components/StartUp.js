// StartUp.js
import React, { useEffect, useState } from 'react';
import {
  Box,
  Text,
  VStack,
  Heading,
  Badge,
  Button,
  Flex,
  Container,
  useColorMode, // Import useColorMode
} from '@chakra-ui/react';
import axios from 'axios';
import { GetFromCaching } from './Caching';
import Notifications from './Notifications'; // Import Notifications

const formatDate = (timestamp) => {
  const date = new Date(parseInt(timestamp) * 1000); // Convert string to number
  return date.toLocaleString();
};

// Define handlePostRequest outside of the component
export const handlePostRequest = async (cachedEmail, setData) => {
  try {
    const response = await axios.post('http://127.0.0.1:8000/startup', {
      email: cachedEmail,
    });

    setData(response.data); // Update state with new data
  } catch (error) {
    console.error('Error:', error);
  }
};

const EmailPostComponent = () => {
  const { colorMode } = useColorMode(); // Get current color mode
  const [data, setData] = useState(null);
  const [email, setEmail] = useState('');

  // Get the user email from caching
  useEffect(() => {
    const cachedEmail = GetFromCaching('email');
    if (cachedEmail) {
      setEmail(cachedEmail);
      handlePostRequest(cachedEmail, setData); // Automatically call on load
    }
  }, []);

  const handleDownload = async (fileLocation) => {
    try {
      const response = await axios({
        url: `http://127.0.0.1:8000/download/${fileLocation}`,
        method: 'GET',
        responseType: 'blob',
      });

      const contentDisposition = response.headers['content-disposition'];
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : fileLocation;

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  return (
    <Container display={'flex'} justifyContent={'end'}>
      <Box 
        p={4} 
        bg={colorMode === 'dark' ? 'gray.800' : 'white'} // Responsive background color
        borderRadius="md" 
        boxShadow="md"
      >
        <Heading size="md" mb={4} color={colorMode === 'dark' ? 'white' : 'black'} textAlign="center">
          Search History
        </Heading>

        {email === '' ? (
          <Text color={colorMode === 'dark' ? 'white' : 'black'} mt={4} textAlign="center">
            Add your Email, make one request to access this part.
          </Text>
        ) : data === null ? (
          <Text color={colorMode === 'dark' ? 'white' : 'black'} mt={4}>Loading...</Text>
        ) : (
          <VStack spacing={4} align="center" className="historyBox" mt={4}>
            {data.thisUserData &&
              Object.entries(data.thisUserData)
                .sort(([keyA], [keyB]) => parseInt(keyB) - parseInt(keyA)) // Sort by key (timestamp as number, latest first)
                .map(([key, assignment]) => (
                  <Box key={key} p={3} borderWidth={1} borderRadius="md" bg={colorMode === 'dark' ? 'gray.700' : 'gray.200'} width={300}>
                    <Text fontWeight="bold" color="teal.200">{assignment.firstName}</Text>
                    <Text color="gray.300" fontSize="xs">{formatDate(key)}</Text> {/* Format using key */}
                    <Flex justify="space-between" align="center" mt={2}>
                      {assignment.status === 'finished' && (
                        <Button
                          size="xs"
                          colorScheme="teal"
                          onClick={() => handleDownload(key)}
                        >
                          Download File
                        </Button>
                      )}
                      <Badge colorScheme={
                        assignment.status === 'pending' ? 'blue' :
                          assignment.status === 'waiting' ? 'yellow' :
                          assignment.status === 'finished' ? 'green' :
                          'red'
                      }>
                        {assignment.status}
                      </Badge>
                    </Flex>
                  </Box>
                ))}
          </VStack>
        )}
      </Box>

      {/* Pass setData to Notifications */}
      <Notifications setData={setData} />
    </Container>
  );
};

export default EmailPostComponent;
