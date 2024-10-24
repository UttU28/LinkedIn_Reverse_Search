// components/GridContainer.js
import React from 'react';
import { Box } from '@chakra-ui/react';

const GridContainer = ({ children }) => {
  return (
    <Box
      display="flex"
      height="90vh"
      overflow="hidden"
    >
      <Box
        flex="3"
        overflowY="auto"
        p={4}
      >
        {children[0]} {/* Form Component */}
      </Box>
      <Box
        flex="1"
        overflowY="auto"
        p={4}
      >
        {children[1]} {/* StartUp Component */}
      </Box>
    </Box>
  );
};

export default GridContainer;
