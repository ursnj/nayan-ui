import { Dimensions } from 'react-native';

export const CONFIG = {
  APP_URL: 'https://www.nayanui.com'
};

export const getColumnCount = () => {
  const deviceWidth = Dimensions.get('window').width;
  if (deviceWidth > 1536) return 7;
  else if (deviceWidth > 1280) return 6;
  else if (deviceWidth > 1024) return 5;
  else if (deviceWidth > 768) return 4;
  else if (deviceWidth > 640) return 3;
  else return 2;
};
