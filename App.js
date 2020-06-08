import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';

import HomeScreen from './src/HomeScreen';

const AppNavigator = createStackNavigator({
  
  Home: {
    screen: HomeScreen,
    navigationOptions: {
      header: null
    }
  }
});

export default createAppContainer(AppNavigator);