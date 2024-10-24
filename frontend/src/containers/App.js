// containers/App.js
import React from 'react';
import AppRoutes from '../routing/Routes';
import Time from '../components/Time';
import Notifications from '../components/Notifications';
import StartUp from '../components/StartUp';
import GridContainer from '../components/GridContainer';
import { useColorMode, IconButton } from '@chakra-ui/react';
import { SunIcon, MoonIcon } from '@chakra-ui/icons';

function App() {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <>
      <IconButton
        aria-label="Toggle theme"
        icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
        onClick={toggleColorMode}
        position="absolute"
        top="10px"
        right="10px"
        size="lg"
      />
      <GridContainer>
        <AppRoutes />
        <StartUp />
      </GridContainer>
      <Notifications />
      <Time />
    </>
  );
}

export default App;
