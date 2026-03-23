import React from 'react';
import { StyleSheet } from 'react-native';
import { useFCM } from '../hooks/useFCM';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type {
  MainTabParamList,
  HomeStackParamList,
  PriceRegisterStackParamList,
  MyPageStackParamList,
} from './types';
import { colors as dsColors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import HomeScreen from '../screens/home/HomeScreen';
import SearchScreen from '../screens/home/SearchScreen';
import PriceCompareScreen from '../screens/price/PriceCompareScreen';
import PriceDetailScreen from '../screens/price/PriceDetailScreen';
import StoreDetailScreen from '../screens/price/StoreDetailScreen';
import StoreSelectScreen from '../screens/price/StoreSelectScreen';
import StoreRegisterScreen from '../screens/price/StoreRegisterScreen';
import InputMethodScreen from '../screens/price/InputMethodScreen';
import CameraScreen from '../screens/price/CameraScreen';
import OcrResultScreen from '../screens/price/OcrResultScreen';
import ItemDetailScreen from '../screens/price/ItemDetailScreen';
import ConfirmScreen from '../screens/price/ConfirmScreen';
import WishlistScreen from '../screens/wishlist/WishlistScreen';
import MyPageScreen from '../screens/mypage/MyPageScreen';
import MyPriceListScreen from '../screens/mypage/MyPriceListScreen';
import LikedPricesScreen from '../screens/mypage/LikedPricesScreen';
import NoticeListScreen from '../screens/mypage/NoticeListScreen';
import NoticeDetailScreen from '../screens/mypage/NoticeDetailScreen';
import FaqScreen from '../screens/mypage/FaqScreen';
import InquiryScreen from '../screens/mypage/InquiryScreen';
import NotificationSettingsScreen from '../screens/mypage/NotificationSettingsScreen';
import BadgeScreen from '../screens/mypage/BadgeScreen';
import LocationSetupScreen from '../screens/auth/LocationSetupScreen';
import HomeIconSvg from '../components/icons/HomeIcon';
import HeartIconSvg from '../components/icons/HeartIcon';
import UserIconSvg from '../components/icons/UserIcon';
import PlusCircleIconSvg from '../components/icons/PlusCircleIcon';

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const PriceRegisterStack =
  createNativeStackNavigator<PriceRegisterStackParamList>();
const MyPageStack = createNativeStackNavigator<MyPageStackParamList>();

const HomeStackNavigator: React.FC = () => (
  <HomeStack.Navigator>
    <HomeStack.Screen
      name="Home"
      component={HomeScreen}
      options={{ headerShown: false }}
    />
    <HomeStack.Screen
      name="Search"
      component={SearchScreen}
      options={{ headerShown: false }}
    />
    <HomeStack.Screen
      name="PriceCompare"
      component={PriceCompareScreen}
      options={{ headerShown: false }}
    />
    <HomeStack.Screen
      name="PriceDetail"
      component={PriceDetailScreen}
      options={{ headerShown: false }}
    />
    <HomeStack.Screen
      name="StoreDetail"
      component={StoreDetailScreen}
      options={{ title: '매장 상세' }}
    />
  </HomeStack.Navigator>
);

const PriceRegisterStackNavigator: React.FC = () => (
  <PriceRegisterStack.Navigator>
    <PriceRegisterStack.Screen
      name="StoreSelect"
      component={StoreSelectScreen}
      options={{ headerShown: false }}
    />
    <PriceRegisterStack.Screen
      name="StoreRegister"
      component={StoreRegisterScreen}
      options={{ headerShown: false }}
    />
    <PriceRegisterStack.Screen
      name="InputMethod"
      component={InputMethodScreen}
      options={{ title: '입력 방식 선택' }}
    />
    <PriceRegisterStack.Screen
      name="Camera"
      component={CameraScreen}
      options={{ headerShown: false }}
    />
    <PriceRegisterStack.Screen
      name="OcrResult"
      component={OcrResultScreen}
      options={{ title: '가격 인식 결과' }}
    />
    <PriceRegisterStack.Screen
      name="ItemDetail"
      component={ItemDetailScreen}
      options={{ title: '품목 상세' }}
    />
    <PriceRegisterStack.Screen
      name="Confirm"
      component={ConfirmScreen}
      options={{ title: '등록 확인' }}
    />
  </PriceRegisterStack.Navigator>
);

function makeTabIcon(
  Icon: React.FC<{ size?: number; color?: string; filled?: boolean }>,
) {
  return function TabIcon({ focused }: { focused: boolean }) {
    return <Icon size={24} color={focused ? dsColors.tabIconActive : dsColors.tabIconInactive} filled={focused} />;
  };
}

const MyPageStackNavigator: React.FC = () => (
  <MyPageStack.Navigator>
    <MyPageStack.Screen
      name="MyPage"
      component={MyPageScreen}
      options={{ headerShown: false }}
    />
    <MyPageStack.Screen
      name="MyPriceList"
      component={MyPriceListScreen}
      options={{ title: '내가 등록한 가격' }}
    />
    <MyPageStack.Screen
      name="LikedPrices"
      component={LikedPricesScreen}
      options={{ title: '좋아요한 가격' }}
    />
    <MyPageStack.Screen
      name="LocationSetup"
      component={LocationSetupScreen}
      options={{ title: '동네 변경' }}
    />
    <MyPageStack.Screen
      name="NoticeList"
      component={NoticeListScreen}
      options={{ title: '공지사항' }}
    />
    <MyPageStack.Screen
      name="NoticeDetail"
      component={NoticeDetailScreen}
      options={{ title: '공지사항' }}
    />
    <MyPageStack.Screen
      name="Faq"
      component={FaqScreen}
      options={{ title: '도움말 / FAQ' }}
    />
    <MyPageStack.Screen
      name="Inquiry"
      component={InquiryScreen}
      options={{ headerShown: false }}
    />
    <MyPageStack.Screen
      name="NotificationSettings"
      component={NotificationSettingsScreen}
      options={{ title: '알림 설정' }}
    />
    <MyPageStack.Screen
      name="Badge"
      component={BadgeScreen}
      options={{ headerShown: false }}
    />
  </MyPageStack.Navigator>
);

const HomeTabIcon = makeTabIcon(HomeIconSvg);
const HeartTabIcon = makeTabIcon(HeartIconSvg);
const UserTabIcon = makeTabIcon(UserIconSvg);
const PlusCircleTabIcon = makeTabIcon(PlusCircleIconSvg);

const MainTabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  // FCM 토큰 관리 + 알림 수신 (로그인 후 1회)
  useFCM();
  return (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: dsColors.tabIconActive,
      tabBarInactiveTintColor: dsColors.tabIconInactive,
      tabBarStyle: [styles.tabBar, { paddingBottom: insets.bottom + spacing.sm, height: spacing.tabBarContentHeight + insets.bottom }],
      tabBarLabelStyle: styles.tabLabel,
    }}
    safeAreaInsets={{ bottom: 0 }}
  >
    <Tab.Screen
      name="HomeStack"
      component={HomeStackNavigator}
      options={{
        tabBarLabel: '홈',
        tabBarIcon: HomeTabIcon,
      }}
      listeners={({ navigation }) => ({
        tabPress: () => {
          navigation.navigate('HomeStack', { screen: 'Home' });
        },
      })}
    />
    <Tab.Screen
      name="PriceRegisterStack"
      component={PriceRegisterStackNavigator}
      options={{
        tabBarLabel: '등록',
        tabBarIcon: PlusCircleTabIcon,
      }}
      listeners={({ navigation }) => ({
        tabPress: () => {
          navigation.navigate('PriceRegisterStack', { screen: 'StoreSelect' });
        },
      })}
    />
    <Tab.Screen
      name="Wishlist"
      component={WishlistScreen}
      options={{
        tabBarLabel: '찜',
        tabBarIcon: HeartTabIcon,
      }}
    />
    <Tab.Screen
      name="MyPageStack"
      component={MyPageStackNavigator}
      options={{
        tabBarLabel: 'MY',
        tabBarIcon: UserTabIcon,
      }}
      listeners={({ navigation }) => ({
        tabPress: () => {
          navigation.navigate('MyPageStack', { screen: 'MyPage' });
        },
      })}
    />
  </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: dsColors.white,
    borderTopWidth: 1,
    borderTopColor: dsColors.tabBorder,
    paddingTop: spacing.sm,
  },
  tabLabel: {
    ...typography.tabLabel,
  },
});

export default MainTabNavigator;
