
import React from 'react';
import { Box, Flex } from '@chakra-ui/react';

const GridContainer = ({ children }) => {
  return (
    <Flex
      height="90vh"
      overflow="hidden"
    >
      <Box
        flex="3"
        display="flex"
        alignItems="center" 
        justifyContent="center" 
        p={4}
        overflow="hidden" 
      >
        {children[0]} {/* Form Component */}
      </Box>
      <Box
        flex="2"
        overflowY="auto"
        overflowX="hidden" 
        p={4}
        display="flex"
        flexDirection="column" 
      >
        {children[1]} {/* StartUp Component */}
      </Box>
    </Flex>
  );
};

export default GridContainer;
