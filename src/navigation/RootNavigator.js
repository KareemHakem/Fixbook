import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common';

// Auth
import { LoginScreen, RegisterScreen } from '../screens/auth/AuthScreens';

// Shared
import { PostsListScreen, PostDetailScreen, CreatePostScreen } from '../screens/normal/PostScreens';
import { ChatListScreen, ChatDetailScreen }                    from '../screens/normal/ChatScreens';
import { OrdersListScreen }                                    from '../screens/normal/OrdersListScreen';
import { ProfileScreen }                                       from '../screens/normal/ProfileScreen';

// Normal user specific
import { CreateOrderScreen }   from '../screens/normal/CreateOrderScreen';
import { LeaveReviewScreen }   from '../screens/normal/LeaveReviewScreen';

// Admin
import {
  AdminDashboardScreen, AdminUsersScreen,
  AdminPostsScreen, AdminOrdersScreen, AdminReviewsScreen,
} from '../screens/admin/AdminScreens';

import { colors } from '../theme/colors';
import { spacing } from '../theme/index';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// ── Shared screen options ────────────────────────────────────────────────────
const screenOptions = {
  headerStyle:            { backgroundColor: colors.bgCard },
  headerTintColor:        colors.textPrimary,
  headerTitleStyle:       { fontWeight: '700', color: colors.textPrimary },
  headerBackTitleVisible: false,
  contentStyle:           { backgroundColor: colors.bg },
};

const tabBarStyle = {
  backgroundColor: colors.bgCard,
  borderTopColor:  colors.border,
  borderTopWidth:  1,
  paddingBottom:   4,
  height:          58,
};

// ── Auth Stack ───────────────────────────────────────────────────────────────
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ ...screenOptions, headerShown: false }}>
      <Stack.Screen name="Login"    component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// ── Normal User Tab Navigator ─────────────────────────────────────────────────
function NormalTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarStyle,
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        headerStyle:             { backgroundColor: colors.bgCard },
        headerTintColor:         colors.textPrimary,
        headerTitleStyle:        { fontWeight: '700' },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            PostsTab:  focused ? 'grid'         : 'grid-outline',
            OrdersTab: focused ? 'bag'          : 'bag-outline',
            ChatsTab:  focused ? 'chatbubbles'  : 'chatbubbles-outline',
            ProfileTab:focused ? 'person'       : 'person-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse'} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="PostsTab"   component={PostsListScreen}  options={{ title: 'Jobs',    headerTitle: 'Job Board' }} />
      <Tab.Screen name="OrdersTab"  component={OrdersListScreen} options={{ title: 'Orders' }} />
      <Tab.Screen name="ChatsTab"   component={ChatListScreen}   options={{ title: 'Chats' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen}    options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

// ── Skilled User Tab Navigator ────────────────────────────────────────────────
function SkilledTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarStyle,
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        headerStyle:             { backgroundColor: colors.bgCard },
        headerTintColor:         colors.textPrimary,
        headerTitleStyle:        { fontWeight: '700' },
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            BrowseTab:  focused ? 'search'       : 'search-outline',
            OrdersTab2: focused ? 'bag'          : 'bag-outline',
            ChatsTab2:  focused ? 'chatbubbles'  : 'chatbubbles-outline',
            ProfileTab2:focused ? 'person'       : 'person-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse'} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="BrowseTab"   component={PostsListScreen}  options={{ title: 'Browse',  headerTitle: 'Find Jobs' }} />
      <Tab.Screen name="OrdersTab2"  component={OrdersListScreen} options={{ title: 'Orders' }} />
      <Tab.Screen name="ChatsTab2"   component={ChatListScreen}   options={{ title: 'Chats' }} />
      <Tab.Screen name="ProfileTab2" component={ProfileScreen}    options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

// ── Admin Tab Navigator ───────────────────────────────────────────────────────
function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarStyle,
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        headerStyle:             { backgroundColor: colors.bgCard },
        headerTintColor:         colors.textPrimary,
        headerTitleStyle:        { fontWeight: '700' },
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            AdminHome:    focused ? 'grid'    : 'grid-outline',
            AdminProfile: focused ? 'person'  : 'person-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse'} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="AdminHome"    component={AdminStack}   options={{ headerShown: false, title: 'Dashboard' }} />
      <Tab.Screen name="AdminProfile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

// ── Admin Stack (nested in tabs so we can navigate to sub-screens) ────────────
function AdminStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="AdminUsers"     component={AdminUsersScreen}     options={{ title: 'Manage Users' }} />
      <Stack.Screen name="AdminPosts"     component={AdminPostsScreen}     options={{ title: 'Manage Posts' }} />
      <Stack.Screen name="AdminOrders"    component={AdminOrdersScreen}    options={{ title: 'Manage Orders' }} />
      <Stack.Screen name="AdminReviews"   component={AdminReviewsScreen}   options={{ title: 'Manage Reviews' }} />
    </Stack.Navigator>
  );
}

// ── Main App Stack (wraps tabs + modal screens) ───────────────────────────────
function MainStack({ role }) {
  const TabNav = role === 'admin' ? AdminTabs : role === 'skilled' ? SkilledTabs : NormalTabs;

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Tabs" component={TabNav} options={{ headerShown: false }} />

      {/* Shared screens accessible from any tab */}
      <Stack.Screen name="PostDetail"   component={PostDetailScreen}   options={{ title: 'Job Details' }} />
      <Stack.Screen name="CreatePost"   component={CreatePostScreen}   options={({ route }) => ({ title: route.params?.post ? 'Edit Post' : 'Post a Job' })} />
      <Stack.Screen name="ChatDetail"   component={ChatDetailScreen}   options={{ title: 'Chat' }} />
      <Stack.Screen name="CreateOrder"  component={CreateOrderScreen}  options={{ title: 'Confirm Order' }} />
      <Stack.Screen name="LeaveReview"  component={LeaveReviewScreen}  options={{ title: 'Leave a Review' }} />
      <Stack.Screen name="PostsList"    component={PostsListScreen}    options={{ title: 'Job Board' }} />
      <Stack.Screen name="Orders"       component={OrdersListScreen}   options={{ title: 'My Orders' }} />
    </Stack.Navigator>
  );
}

// ── Root Navigator ────────────────────────────────────────────────────────────
export function RootNavigator() {
  const { user, profile, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  return (
    <NavigationContainer>
      {!user ? (
        <AuthStack />
      ) : (
        <MainStack role={profile?.role || 'normal'} />
      )}
    </NavigationContainer>
  );
}
