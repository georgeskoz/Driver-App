import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import { spacing } from '../lib/theme';
import { useTranslation } from '../lib/i18n';
import { Feather } from '@expo/vector-icons';
import { useQuery, skip } from 'convex/react';

import { api } from '../convex/_generated/api';
import { useAuth } from '../lib/auth';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { session } = useAuth();
  const [selectedService, setSelectedService] = React.useState<'taxi' | 'courier' | 'food'>('taxi');

  const userId = (session?.userId ?? '') as any;
  const recentPlaces = useQuery(api.users.getRecentPlaces, userId ? { userId, limit: 10 } : skip);

  const getRecentPlaceTitle = (address: string) => {
    const firstPart = address.split(',')[0]?.trim();
    return firstPart || address;
  };

  const getRecentPlaceIcon = (kind: 'pickup' | 'dropoff') => {
    return kind === 'pickup' ? '📍' : '🏁';
  };

  // Dynamic app name based on selected service
  const getAppName = () => {
    switch (selectedService) {
      case 'taxi':
        return 'TransPo';
      case 'courier':
        return 'TransPo Courier';
      case 'food':
        return 'TransPo Food';
    }
  };

  const handleServicePress = (service: 'taxi' | 'courier' | 'food') => {
    setSelectedService(service);
    if (service === 'taxi') {
      navigation.navigate('RequestVehicle' as never, { type: 'ride' } as never);
    } else if (service === 'courier') {
      navigation.navigate('RequestVehicle' as never, { type: 'delivery' } as never);
    } else {
      navigation.navigate('Food' as never);
    }
  };

  const handleRecentPlacePress = () => {
    // Future: pass the selected address into the booking flow.
    navigation.navigate('RequestVehicle' as never, { type: 'ride' } as never);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{t.home.hello}</Text>
            <Text style={styles.appName}>{getAppName()}</Text>
          </View>
          
          {selectedService === 'taxi' ? (
            <TouchableOpacity
              style={styles.receiptsButton}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Receipts' as never, { mode: 'ride' } as never)}
            >
              <Feather name="file-text" size={18} color="#111827" />
              <Text style={styles.receiptsButtonText}>{t.receipts.buttonLabel}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Search Bar */}
        <TouchableOpacity 
          style={styles.searchBar}
          onPress={() => navigation.navigate('RequestVehicle' as never, { type: 'ride' } as never)}
          activeOpacity={0.8}
        >
          <View style={styles.searchIconCircle}>
            <FontAwesome5 name="search" size={20} color="#FFA500" />
          </View>
          <View style={styles.searchTextContainer}>
            <Text style={styles.searchTitle}>{t.home.whereGoing}</Text>
            <Text style={styles.searchSubtitle}>{t.home.currentLocation}</Text>
          </View>
          <FontAwesome5 name="chevron-right" size={20} color="#6B7280" />
        </TouchableOpacity>

        {/* Service Selection */}
        <Text style={styles.sectionTitle}>{t.home.selectService}</Text>
        <View style={styles.servicesRow}>
          <TouchableOpacity
            style={[styles.serviceCard, selectedService === 'taxi' && styles.serviceCardActive]}
            onPress={() => handleServicePress('taxi')}
            activeOpacity={0.8}
          >
            <View style={styles.serviceIconContainer}>
              <FontAwesome5 name="taxi" size={32} color={selectedService === 'taxi' ? '#fff' : '#9CA3AF'} />
            </View>
            <Text style={[styles.serviceLabel, selectedService === 'taxi' && styles.serviceLabelActive]}>
              {t.home.taxi}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.serviceCard, selectedService === 'courier' && styles.serviceCardActive]}
            onPress={() => handleServicePress('courier')}
            activeOpacity={0.8}
          >
            <View style={styles.serviceIconContainer}>
              <FontAwesome5 name="box" size={32} color={selectedService === 'courier' ? '#fff' : '#9CA3AF'} />
            </View>
            <Text style={[styles.serviceLabel, selectedService === 'courier' && styles.serviceLabelActive]}>
              {t.home.courier}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.serviceCard, selectedService === 'food' && styles.serviceCardActive]}
            onPress={() => handleServicePress('food')}
            activeOpacity={0.8}
          >
            <View style={styles.serviceIconContainer}>
              <FontAwesome5 name="utensils" size={32} color={selectedService === 'food' ? '#fff' : '#9CA3AF'} />
            </View>
            <Text style={[styles.serviceLabel, selectedService === 'food' && styles.serviceLabelActive]}>
              {t.home.food}
            </Text>
          </TouchableOpacity>
        </View>

        {/* MTQ 2026 Compliant Badge */}
        <TouchableOpacity
          style={styles.complianceBadge}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('MTQ2026' as never)}
        >
          <View style={styles.complianceIconCircle}>
            <FontAwesome5 name="bolt" size={24} color="#10B981" />
          </View>
          <View style={styles.complianceText}>
            <Text style={styles.complianceTitle}>{t.mtq2026.badgeTitle}</Text>
            <Text style={styles.complianceSubtitle}>{t.mtq2026.badgeSubtitle}</Text>
          </View>
        </TouchableOpacity>

        {/* Recent Places */}
        <Text style={styles.sectionTitle}>{t.home.recentPlaces}</Text>
        <View style={styles.recentPlaces}>
          {recentPlaces && recentPlaces.length > 0 ? (
            recentPlaces.map((place, index) => (
              <TouchableOpacity
                key={`${place.kind}:${place.address}:${index}`}
                style={styles.placeCard}
                onPress={handleRecentPlacePress}
                activeOpacity={0.7}
              >
                <View style={styles.placeIconCircle}>
                  <Text style={styles.placeEmoji}>{getRecentPlaceIcon(place.kind)}</Text>
                </View>
                <View style={styles.placeInfo}>
                  <Text style={styles.placeName}>{getRecentPlaceTitle(place.address)}</Text>
                  <Text style={styles.placeAddress}>{place.address}</Text>
                </View>
                <FontAwesome5 name="chevron-right" size={20} color="#6B7280" />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.recentEmpty}>
              <Text style={styles.recentEmptyTitle}>{t.home.noRecentPlacesTitle}</Text>
              <Text style={styles.recentEmptySubtitle}>{t.home.noRecentPlacesSubtitle}</Text>
            </View>
          )}
        </View>

        {/* Promotions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.home.promotions}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {/* First Ride Promo */}
            <View
              style={[
                styles.promoCard,
                {
                  borderColor: '#F59E0B',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  marginRight: 12,
                },
              ]}
            >
              <Feather name="zap" size={24} color="#F59E0B" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.promoTitle}>{t.home.firstRide}</Text>
                <Text style={styles.promoSubtitle}>20% {t.home.off}</Text>
                <Text style={styles.promoCode}>BIENVENUE</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  searchTextContainer: {
    flex: 1,
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  searchSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: spacing.lg,
  },
  servicesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  serviceCard: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: spacing.lg,
    marginHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  serviceCardActive: {
    backgroundColor: '#FFA500',
    borderColor: '#FFA500',
  },
  serviceIconContainer: {
    marginBottom: spacing.md,
  },
  serviceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  serviceLabelActive: {
    color: '#FFFFFF',
  },
  complianceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  complianceIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B98120',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  complianceText: {
    flex: 1,
  },
  complianceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4,
  },
  complianceSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  promotionsScroll: {
    paddingLeft: spacing.lg,
    marginBottom: spacing.xl,
  },
  promoCard: {
    width: 280,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: spacing.xl,
    marginRight: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  promoSubtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginBottom: 4,
  },
  promoCode: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
    opacity: 0.8,
  },
  recentPlaces: {
    paddingHorizontal: spacing.lg,
  },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  placeIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  placeEmoji: {
    fontSize: 24,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  placeAddress: {
    fontSize: 14,
    color: '#6B7280',
  },
  recentEmpty: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: spacing.lg,
  },
  recentEmptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  recentEmptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  receiptsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  receiptsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
});