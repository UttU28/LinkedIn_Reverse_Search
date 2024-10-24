// components/Time.js
import React, { useEffect, useState } from 'react';
import { Box, Text } from '@chakra-ui/react';

const Time = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Box>
      <Text fontSize="xl" color="teal.500">
        Current Time: {currentTime.toLocaleTimeString()}
      </Text>
    </Box>
  );
};

export default Time;
