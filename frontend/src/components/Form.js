// components/Form.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Heading,
  Container,
  VStack,
  useToast,
  useColorMode,
  IconButton,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { AddToCaching, GetFromCaching, } from './Caching';

function Form() {
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    file: null,
  });

  const toast = useToast();
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();

  useEffect(() => {
    const savedName = GetFromCaching('firstName');
    const savedEmail = GetFromCaching('email');

    if (savedName) {
      setFormData((prevData) => ({ ...prevData, firstName: savedName }));
    }
    if (savedEmail) {
      setFormData((prevData) => ({ ...prevData, email: savedEmail }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      file: e.target.files[0],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataObj = new FormData();
    AddToCaching("firstName", formData.firstName);
    AddToCaching("email", formData.email);

    formDataObj.append('file', formData.file);
    formDataObj.append('firstName', formData.file.name);
    formDataObj.append('email', formData.email);

    try {
      const response = await fetch('/upload', {
        method: 'POST',
        body: formDataObj,
      });
      const data = await response.json();
      toast({
        title: 'Success!',
        description: data.message,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Save form data in state and navigate to success page
      navigate('/success', { state: { formData } });
    } catch (error) {
      toast({
        title: 'Error!',
        description: 'Failed to upload the file',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Container centerContent
    minHeight="80vh"
    display={"flex"}
    alignItems={"center"}
    justifyContent={"center"}
    >
      <Box className={`container ${colorMode}`}>
        <VStack spacing={4}>
          <Heading as="h1" size="lg">
            LinkedIn Reverse Search
          </Heading>
          <form onSubmit={handleSubmit}>
            <FormControl isRequired>
              <FormLabel>File Name</FormLabel>
              <Input
                type="text"
                name="firstName"
                placeholder="Your Name"
                value={formData.firstName}
                onChange={handleChange}
              />
            </FormControl>

            <FormControl isRequired mt={4}>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                name="email"
                placeholder="Your Email"
                value={formData.email}
                onChange={handleChange}
              />
            </FormControl>

            <FormControl isRequired mt={4}>
              <FormLabel>Upload File</FormLabel>
              <Input type="file" accept=".xlsx" onChange={handleFileChange} pt={1} />
            </FormControl>

            <Button type="submit" colorScheme="teal" size="md" width="full" mt={6}>
              Upload
            </Button>
          </form>
        </VStack>
      </Box>
    </Container>
  );
}

export default Form;
