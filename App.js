import React from 'react';
import Main from './Components/MainComponent';
import { Provider } from 'react-redux';
import { ConfigureStore } from './redux/configureStore';
import { YellowBox } from 'react-native';
import { PersistGate } from 'redux-persist/es/integration/react'
//import Loading from './Components/LoadingComponent';

const { persistor, store } = ConfigureStore();

export default function App() {
  YellowBox.ignoreWarnings([
    'Animated: `useNativeDriver` was not specified.',
    'DrawerLayoutAndroid drawerPosition'
  ]);
  return (
        <Provider store={store}>
            <PersistGate 
             // loading={<Loading />}
              persistor={persistor}>    
                  <Main />
            </PersistGate>
        </Provider>
        );
}