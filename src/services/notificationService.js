import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';

import { navigationRef } from '../navigation/RootNavigator';

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data;

    // If user is already on the same chat screen, don't show the banner
    if (navigationRef.isReady()) {
      const currentRoute = navigationRef.getCurrentRoute();
      if (
        currentRoute?.name === 'ChatDetail' &&
        currentRoute?.params?.chatId === data?.chatId
      ) {
        return {
          shouldShowAlert: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
        };
      }
    }

    // Otherwise show the notification normally
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});

// Get the device push token and return it
export async function registerForPushNotificationsAsync() {
  // Push only works on real devices not simulators
  if (!Device.isDevice) {
    console.log('Push notifications only work on a real device');
    return null;
  }

  // Ask the user for permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Permission not granted for push notifications');
    return null;
  }

  // Get the Expo push token
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

  return token;
}

// Save the token to the profiles table in Supabase
export async function savePushToken(userId, token) {
  const { error } = await supabase
    .from('profiles')
    .update({ expo_push_token: token })
    .eq('id', userId);

  if (error) {
    console.log('Error saving push token:', error.message);
  }
}

// Clear the token when user logs out
export async function clearPushToken(userId) {
  const { error } = await supabase
    .from('profiles')
    .update({ expo_push_token: null })
    .eq('id', userId);

  if (error) {
    console.log('Error clearing push token:', error.message);
  }
}