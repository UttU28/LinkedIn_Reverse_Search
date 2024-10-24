// components/SuccessPage.js
import React from 'react';
import { Box, Button, Heading, Text, VStack, Container, IconButton, useColorMode } from '@chakra-ui/react';
import { SunIcon, MoonIcon } from '@chakra-ui/icons';
import { useLocation, useNavigate } from 'react-router-dom';

const SuccessPage = () => {
  const { state } = useLocation();  // Get the state (form data) from the router
  const navigate = useNavigate();
  const { colorMode, toggleColorMode } = useColorMode();

  const handleNewUpload = () => {
    navigate('/', { state });  // Redirect to form page with pre-filled state
  };

  return (
    <Container centerContent
      minHeight="90vh"
      display={"flex"}
      alignItems={"center"}
      justifyContent={"center"}
    >
      <IconButton
        aria-label="Toggle theme"
        icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
        onClick={toggleColorMode}
        position="absolute"
        top="10px"
        right="10px"
        size="lg"
      />
      <Box
        p={8}
        maxWidth="500px"
        borderWidth={1}
        borderRadius="lg"
        boxShadow="lg"
        mt={8}
        className={`container ${colorMode}`}
      >
        <VStack spacing={4}>
          <Heading as="h1" size="lg">Submission Successful!</Heading>
          <Text fontSize="lg">
            Thank you, {state?.formData?.name}. We'll shortly send you an email at {state?.formData?.email}.
          </Text>
          <Button
            colorScheme="teal"
            size="md"
            width="full"
            mt={6}
            onClick={handleNewUpload}
          >
            Submit New Excel List
          </Button>
        </VStack>
      </Box>
    </Container>
  );
};

export default SuccessPage;
