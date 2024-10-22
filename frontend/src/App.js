// App.js
import './App.css'
import React, { useState } from 'react'
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
} from '@chakra-ui/react'
import { SunIcon, MoonIcon } from '@chakra-ui/icons' // Icons for toggle

function App() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        file: null,
    })

    const toast = useToast() // To show feedback messages
    const { colorMode, toggleColorMode } = useColorMode() // Hook to toggle between dark/light mode

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }))
    }

    const handleFileChange = (e) => {
        setFormData((prevData) => ({
            ...prevData,
            file: e.target.files[0],
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const formDataObj = new FormData()
        formDataObj.append('file', formData.file)
        formDataObj.append('name', formData.name)
        formDataObj.append('email', formData.email)

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formDataObj,
            })
            const data = await response.json()
            toast({
                title: 'Success!',
                description: data.message,
                status: 'success',
                duration: 5000,
                isClosable: true,
            })
        } catch (error) {
            toast({
                title: 'Error!',
                description: 'Failed to upload the file',
                status: 'error',
                duration: 5000,
                isClosable: true,
            })
        }
    }

    return (
        <Container centerContent>
            <IconButton
                aria-label="Toggle theme"
                icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                onClick={toggleColorMode}
                position="absolute"
                top="10px"
                right="10px"
                size="lg"
            />
            <Box className={`container ${colorMode}`}>
                <VStack spacing={4}>
                    <Heading as="h1" size="lg">
                        Upload Your Data
                    </Heading>
                    <form onSubmit={handleSubmit}>
                        <FormControl isRequired>
                            <FormLabel>Name</FormLabel>
                            <Input
                                className={`input ${colorMode}`} // Apply input class based on color mode
                                type="text"
                                name="name"
                                placeholder="Your Name"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </FormControl>

                        <FormControl isRequired mt={4}>
                            <FormLabel>Email</FormLabel>
                            <Input
                                className={`input ${colorMode}`}
                                type="email"
                                name="email"
                                placeholder="Your Email"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </FormControl>

                        <FormControl isRequired mt={4}>
                            <FormLabel>Upload File</FormLabel>
                            <Input
                                type="file"
                                accept=".xlsx"
                                onChange={handleFileChange}
                                pt={1}
                                className={`input ${colorMode}`}
                            />
                        </FormControl>

                        <Button
                            className="button"
                            type="submit"
                            colorScheme="teal"
                            size="md"
                        >
                            Upload
                        </Button>
                    </form>
                </VStack>
            </Box>
        </Container>
    )
}

export default App
