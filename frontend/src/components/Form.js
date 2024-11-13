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
  RadioGroup,
  Radio,
  Stack,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { AddToCaching, GetFromCaching } from './Caching';

function Form() {
  const [formData, setFormData] = useState({
    email: '',
    file: null,
    url: '',
    fileType: 'linkedin', // Add default fileType state
  });

  const toast = useToast();
  const { colorMode } = useColorMode();
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = GetFromCaching('email');

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

  const handleFileTypeChange = (value) => {
    setFormData((prevData) => ({
      ...prevData,
      fileType: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formDataObj = new FormData();

    AddToCaching("email", formData.email);

    if (formData.file) {
      // If file is provided, submit to /upload
      formDataObj.append('file', formData.file);
      formDataObj.append('email', formData.email);
      formDataObj.append('fileType', formData.fileType); // Append file type for backend to process

      fetch('/upload', {
        method: 'POST',
        body: formDataObj,
      }).catch((error) => {
        toast({
          title: 'Error!',
          description: 'Failed to upload the file',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      });
    } else if (formData.url) {
      // If URL is provided, submit to /scrapeLinkedIn
      formDataObj.append('email', formData.email);
      formDataObj.append('url', formData.url);

      fetch('/scrapeLinkedIn', {
        method: 'POST',
        body: formDataObj,
      }).catch((error) => {
        toast({
          title: 'Error!',
          description: 'Failed to start LinkedIn scraping',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      });
    } else {
      toast({
        title: 'Error!',
        description: 'Please provide either a file or a URL',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Notify the user and navigate to the success page
    toast({
      title: 'Success!',
      description: 'Data processing started successfully!',
      status: 'success',
      duration: 5000,
      isClosable: true,
    });

    navigate('/success', { state: { formData } });
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

            <FormControl mt={4}>
              <FormLabel>Upload File</FormLabel>
              <Input type="file" accept=".xlsx" onChange={handleFileChange} pt={1} />
            </FormControl>

            <FormControl mt={4}>
              <FormLabel>File Type</FormLabel>
              <RadioGroup onChange={handleFileTypeChange} value={formData.fileType}>
                <Stack direction="row">
                  <Radio value="linkedin">LinkedIn</Radio>
                  <Radio value="company">Company</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>

            <FormControl mt={4}>
              <FormLabel>LinkedIn Profile URL</FormLabel>
              <Input
                type="url"
                name="url"
                placeholder="LinkedIn Profile URL"
                value={formData.url}
                onChange={handleChange}
              />
            </FormControl>

            <Button type="submit" colorScheme="teal" size="md" width="full" mt={6}>
              Submit
            </Button>
          </form>
        </VStack>
      </Box>
    </Container>
  );
}

export default Form;
