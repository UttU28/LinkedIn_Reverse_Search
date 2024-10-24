import React, { useEffect, useState } from 'react';
import { GetFromCaching } from './Caching';
import {
  Box,
  Text,
  VStack,
  Heading,
  Badge,
  Button,
  Flex,
  Container,
} from '@chakra-ui/react';
import axios from 'axios';

const StartUp = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const email = GetFromCaching('email');

  useEffect(() => {
    const fetchData = async () => {
      if (email) {
        try {
          const response = await axios.post('http://127.0.0.1:8000/startup', { email });
          setData(response.data);
        } catch (err) {
          console.error("Error fetching data:", err);
          setError("Failed to load startup data");
        }
      }
    };

    fetchData();
  }, [email]);

  if (!email) {
    return (
      <Box>
        <Text fontSize="xl" color="red.500">
          No email found in cache.
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Text fontSize="xl" color="red.500">
          {error}
        </Text>
      </Box>
    );
  }

  const handleDownload = async (fileLocation) => {
    try {
        const response = await axios({
            url: `http://127.0.0.1:8000/download/${fileLocation}`,
            method: 'GET',
            responseType: 'blob',
        });

        const contentDisposition = response.headers['content-disposition'];
        const filename = contentDisposition ? contentDisposition.split('filename=')[1] : fileLocation;
        console.log(filename);

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename+'.xlsx'); // Use the filename from the header or the provided location
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error downloading file:", error);
    }
};


  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  return (
    <Container display={'flex'} justifyContent={'end'}>
      <Box p={4} bg="gray.800" borderRadius="md" boxShadow="md">
        <Heading size="md" mb={4} color="white" textAlign="center">
          Search History
        </Heading>
        {data && data.thisUserData ? (
          <VStack spacing={4} align="center">
            {Object.entries(data.thisUserData).map(([key, assignment]) => (
              <Box key={key} p={3} borderWidth={1} borderRadius="md" bg="gray.700" width={300}>
                <Text fontWeight="bold" color="teal.200">{assignment.name}</Text>
                <Text color="gray.300" fontSize={'xs'}>{formatDate(key)}</Text>
                <Flex justify="space-between" align="center" mt={2}>
                  {assignment.status !== 'pending' && (
                    <Button
                      size={'xs'}
                      colorScheme="teal"
                      onClick={() => handleDownload(key)} // Ensure this points to the correct file name
                    >
                      Download File
                    </Button>
                  )}
                  <Badge colorScheme={assignment.status === 'pending' ? 'yellow' : 'green'}>
                    {assignment.status}
                  </Badge>
                </Flex>
              </Box>
            ))}
          </VStack>
        ) : (
          <Text color="white">Loading...</Text>
        )}
      </Box>
    </Container>
  );
};

export default StartUp;
