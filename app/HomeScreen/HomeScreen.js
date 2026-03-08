import React, { useState } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  Text,
} from 'react-native';
import ProfileRentCard from './RentSection';
import VisitorSection from './VisitorSection';
import CarouselSection from './SocietyImage';
import ServicesSection from './ServiceSection';
import ImportantContacts from './ContactSection';
import { usePermissions } from '../../Utils/ConetextApi';
import Action from './Action';
import QuickActionsScreen from './QuickActionsScreen';
import BRAND from '../../app/config';
import NoticeTickerScreen from './NoticeTickerScreen';

const theme = BRAND.COLORS;

const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bodyText: {
    color: theme.text,
    fontSize: 16,
  },
};


const HomeScreen = () => {
  const { nightMode } = usePermissions();

  // ✅ Check if context is ready
  if (nightMode === undefined) {
    return (
      <View style={[commonStyles.safeArea, commonStyles.center]}>
        <Text style={commonStyles.bodyText}>Loading...</Text>
      </View>
    );
  }

  const [refreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      setRefreshTrigger(prev => prev + 1);
      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (error) {
      console.log('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={commonStyles.container}>

      <FlatList
        data={[1]}
        renderItem={() => null}
        keyExtractor={() => 'home'}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}   
          />
        }
        ListHeaderComponent={
          <View>
            <ProfileRentCard refreshTrigger={refreshTrigger} />
            <VisitorSection refreshTrigger={refreshTrigger} />
            <CarouselSection refreshTrigger={refreshTrigger} />
            <ServicesSection refreshTrigger={refreshTrigger} />
            <Action />
            <QuickActionsScreen />
            <NoticeTickerScreen/>
            <ImportantContacts refreshTrigger={refreshTrigger} />
          </View>
        }
      />
    </View>
  );
};

export default HomeScreen;