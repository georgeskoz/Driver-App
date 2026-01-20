import React, { useMemo, useState } from 'react';
import {
View,
Text,
StyleSheet,
TouchableOpacity,
ScrollView,
TextInput,
Modal,
Pressable,
Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { spacing } from '../lib/theme';
import { useTranslation } from '../lib/i18n';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { useAuthActions } from '../lib/auth';
import * as Updates from 'expo-updates';

export default function BookingScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { session } = useAuthActions();
  const requestTrip = useMutation(api.trips.requestTrip);
  const devEnsureTestDriverOnline = useMutation(api.users.devEnsureTestDriverOnline);
  const validatePromotionCode = useMutation(api.promotions.validatePromotionCode);
  const redeemPromotionForOrder = useMutation(api.promotions.redeemPromotionForOrder);
  
  // Fetch dynamic vehicle pricing from Convex
  const vehiclePricing = useQuery(api.vehiclePricing.getVehiclePricing, { 
    region: 'quebec' // TODO: Get from user's location/profile
  });

  const [pickupAddress, setPickupAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [isScheduleModalVisible, setIsScheduleModalVisible] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<'pickup' | 'dropoff'>('pickup');
  const [selectedDateOffsetDays, setSelectedDateOffsetDays] = useState(0);
  const [selectedTimeMinutes, setSelectedTimeMinutes] = useState<number>(() => {
    const now = new Date();
    const minutes = now.getMinutes();
    const rounded = minutes + (10 - (minutes % 10));
    return (now.getHours() * 60 + (rounded % 60)) % (24 * 60);
  });
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('sedan');

  const [isPromoModalVisible, setIsPromoModalVisible] = useState(false);
  const [promoCodeDraft, setPromoCodeDraft] = useState('');
  const [promoApplyLoading, setPromoApplyLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<null | {
    code: string;
    discountType: 'percent' | 'amount';
    discountValue: number;
    discountAmountForSelectedFare: number;
  }>(null);

  const type = (route.params as { type?: string })?.type || 'ride';

  // Show estimate section when both locations are filled
  const showEstimate = Boolean(pickupAddress.trim() && destinationAddress.trim());

  const schedulePreviewText = useMemo(() => {
    if (!scheduledAt) return null;
    const formatter = new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    return formatter.format(scheduledAt);
  }, [scheduledAt]);

  // Vehicle options with pricing from Convex
  const vehicleOptions = useMemo(() => {
    if (!vehiclePricing) {
      // Return loading state or default options
      return [];
    }

    const applyPromoToFare = (baseFare: number) => {
      if (!appliedPromo) {
        return { finalFare: baseFare, discountAmount: 0 };
      }

      let discountAmount = 0;
      if (appliedPromo.discountType === 'percent') {
        discountAmount = (baseFare * appliedPromo.discountValue) / 100;
      } else {
        discountAmount = appliedPromo.discountValue;
      }

      discountAmount = Math.max(0, Math.min(baseFare, discountAmount));
      const finalFare = Math.max(0, baseFare - discountAmount);

      return {
        finalFare: Math.round(finalFare * 100) / 100,
        discountAmount: Math.round(discountAmount * 100) / 100,
      };
    };

    return vehiclePricing.map((vehicle: any, index: number) => {
      const basePrice = vehicle.basePrice;
      const promoApplied = applyPromoToFare(basePrice);
      const isDiscounted = appliedPromo ? promoApplied.finalFare < basePrice : false;

      return {
        id: vehicle.id,
        name: t.booking?.sedan || vehicle.name,
        icon: vehicle.id === 'sedan' ? '🚗' : '🚐',
        seats: vehicle.seats,
        price: appliedPromo ? promoApplied.finalFare : basePrice,
        originalPrice: isDiscounted ? basePrice : null,
        pickupTime: scheduledAt ? schedulePreviewText : (t.booking?.pickupNow || 'Pickup now'),
        recommended: index === 0,
      };
    });
  }, [vehiclePricing, scheduledAt, schedulePreviewText, t.booking, appliedPromo]);

  // Ensure the selected vehicle always exists.
  // This prevents promo apply / reserve from failing silently when the default ID doesn't match
  // what comes from the pricing table.
  React.useEffect(() => {
    if (!vehiclePricing || vehiclePricing.length === 0) return;

    const exists = vehiclePricing.some((v: any) => v.id === selectedVehicle);
    if (!exists) {
      setSelectedVehicle(vehiclePricing[0].id);
    }
  }, [vehiclePricing, selectedVehicle]);

  const upcomingDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Array(7).fill(null).map((_: null, index: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() + index);
      const label =
        index === 0
          ? t.booking?.today || 'Today'
          : index === 1
          ? t.booking?.tomorrow || 'Tomorrow'
          : new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(d);
      const subLabel = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(d);
      return { index, date: d, label, subLabel };
    });
  }, [t.booking]);

  const timeSlots = useMemo(() => {
    const slots: Array<{ minutes: number; label: string }> = [];
    for (let minutes = 0; minutes < 24 * 60; minutes += 10) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const d = new Date();
      d.setHours(hours, mins, 0, 0);
      const label = new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      }).format(d);
      slots.push({ minutes, label });
    }
    return slots;
  }, []);

  const buildScheduledDate = () => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    base.setDate(base.getDate() + selectedDateOffsetDays);
    const hours = Math.floor(selectedTimeMinutes / 60);
    const minutes = selectedTimeMinutes % 60;
    base.setHours(hours, minutes, 0, 0);
    return base;
  };

  const handleConfirmSchedule = () => {
    const chosen = buildScheduledDate();
    setScheduledAt(chosen);
    setIsScheduleModalVisible(false);
  };

  const handleReserve = async () => {
    if (!session?.userId) {
      Alert.alert(t.booking?.loginRequired || 'Login required', t.booking?.pleaseLogin || 'Please login to book a ride');
      return;
    }

    const selectedVehicleData = vehicleOptions.find((v: any) => v.id === selectedVehicle);
    if (!selectedVehicleData) {
      Alert.alert(
        t.common?.error || 'Error',
        t.booking?.selectVehicleFirst || 'Please select a vehicle first.'
      );
      return;
    }

    // For now, this screen is only wired for ride + courier flows.
    // Food has its own experience and dispatch pipeline.
    if (type === 'food') {
      Alert.alert(t.common?.comingSoon || 'Coming soon', 'Food ordering is handled in the Food tab.');
      return;
    }

    try {
      // Mock coordinates for now (will be replaced with real geocoding later)
      const mockPickupLat = 45.5017;
      const mockPickupLng = -73.5673;
      const mockDropoffLat = 45.5088;
      const mockDropoffLng = -73.5878;

      const baseFare = selectedVehicleData.originalPrice ?? selectedVehicleData.price;

      // DEV UX:
      // If there are zero drivers online, matching will queue forever and it *looks like* dispatch is broken.
      // In non-production update channels, we auto-provision a deterministic test driver and set them online.
      const isProductionChannel = (Updates.channel ?? '').toLowerCase() === 'production';
      if (!isProductionChannel && !scheduledAt) {
        try {
          await devEnsureTestDriverOnline({} as any);
        } catch {
          // Ignore; it's a best-effort helper for local/dev testing.
        }
      }

      const result = await requestTrip({
        userId: session.userId as any,
        mode: type === 'delivery' ? 'delivery' : 'ride',
        pickupAddress,
        pickupLat: mockPickupLat,
        pickupLng: mockPickupLng,
        dropoffAddress: destinationAddress,
        dropoffLat: mockDropoffLat,
        dropoffLng: mockDropoffLng,
        vehicleType: selectedVehicle as any,
        paymentMethod: 'card',
        estimatedFare: baseFare,
        scheduledAt: scheduledAt ? scheduledAt.getTime() : undefined,
      } as any);

      const orderId = result.tripId;

      if (appliedPromo) {
        try {
          await redeemPromotionForOrder({
            orderId,
            userId: session.userId as any,
            code: appliedPromo.code,
            baseFare,
          });
        } catch (e) {
          // Keep the booking flow working even if promo redemption fails.
          Alert.alert(
            t.common?.error || 'Error',
            t.booking?.promoApplyFailed || 'Could not apply promo. Continuing without discount.'
          );
        }
      }

      // Navigate to Finding Driver screen for immediate bookings
      if (!scheduledAt) {
        navigation.navigate('FindingDriver' as never, { orderId } as never);
      } else {
        navigation.navigate(
          'BookingConfirmation' as never,
          {
            pickupAddress,
            dropoffAddress: destinationAddress,
            scheduledTime: schedulePreviewText ?? scheduledAt.toLocaleString(),
            vehicleType: selectedVehicleData.name,
            estimatedFare: selectedVehicleData.price,
          } as never,
        );
      }
    } catch (error) {
      Alert.alert(t.booking?.error || 'Error', t.booking?.bookingFailed || 'Failed to create booking. Please try again.');
    }
  };

  const handleApplyPromo = async () => {
    if (!session?.userId) {
      Alert.alert(t.booking?.loginRequired || 'Login required', t.booking?.pleaseLogin || 'Please login to apply a promo');
      return;
    }

    const selectedVehicleData = vehicleOptions.find((v: any) => v.id === selectedVehicle);
    if (!selectedVehicleData) {
      Alert.alert(
        t.common?.error || 'Error',
        t.booking?.selectVehicleFirst || 'Please select a vehicle first.'
      );
      return;
    }

    const normalizedDraft = promoCodeDraft.trim().toUpperCase();
    if (!normalizedDraft) {
      Alert.alert(t.common?.error || 'Error', t.booking?.promoEnterCode || 'Please enter a promo code.');
      return;
    }

    const baseFare = selectedVehicleData.originalPrice ?? selectedVehicleData.price;

    setPromoApplyLoading(true);
    try {
      const result = await validatePromotionCode({
        userId: session.userId as any,
        code: normalizedDraft,
        baseFare,
      });

      if (!result.valid || !result.code || result.discountAmount === undefined || !result.discountType || result.discountValue === undefined) {
        Alert.alert(
          t.common?.error || 'Error',
          t.booking?.promoInvalid || 'This promo code is not valid.'
        );
        return;
      }

      setAppliedPromo({
        code: result.code,
        discountType: result.discountType,
        discountValue: result.discountValue,
        discountAmountForSelectedFare: result.discountAmount,
      });
      setPromoCodeDraft(result.code);
      setIsPromoModalVisible(false);
    } catch (e) {
      Alert.alert(t.common?.error || 'Error', t.booking?.promoInvalid || 'This promo code is not valid.');
    } finally {
      setPromoApplyLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCodeDraft('');
  };

  const getServiceInfo = () => {
    switch (type) {
      case 'delivery':
        return { name: t.booking?.delivery || 'Delivery', icon: 'box' };
      case 'food':
        return { name: t.booking?.food || 'Food', icon: 'utensils' };
      default:
        return { name: t.booking?.ride || 'Taxi', icon: 'taxi' };
    }
  };

  const serviceInfo = getServiceInfo();

  const savedPlaces = [
    { id: '1', name: 'Maison', address: '1234 Rue Saint-Denis, Montréal', icon: '🏠' },
    { id: '2', name: 'Travail', address: '800 Rue de la Gauchetière, Mo...', icon: '💼' },
  ];

  const recentSearches = [
    { id: '1', name: 'Aéroport Montréal-Trudeau (YUL)', distance: '22.0 km' },
    { id: '2', name: 'Centre Bell, Montréal', distance: '3.0 km' },
    { id: '3', name: 'Vieux-Port de Montréal', distance: '5.0 km' },
    { id: '4', name: 'Mont-Royal, Montréal', distance: '4.0 km' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={true}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <FontAwesome5 name="chevron-left" size={24} color="#000000" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{t.booking?.whereGoing || 'Where are you going?'}</Text>
            <Text style={styles.headerSubtitle}>{serviceInfo.name}</Text>
          </View>

          <TouchableOpacity
            style={styles.laterButton}
            activeOpacity={0.8}
            onPress={() => setIsScheduleModalVisible(true)}
          >
            <Feather name="calendar" size={16} color="#111827" />
            <Text style={styles.laterButtonText}>{t.booking?.later || 'Later'}</Text>
          </TouchableOpacity>
        </View>

        {schedulePreviewText ? (
          <View style={styles.schedulePillRow}>
            <View style={styles.schedulePill}>
              <Feather name="clock" size={14} color="#111827" />
              <Text style={styles.schedulePillText}>
                {(t.booking?.scheduledFor || 'Scheduled for') + ' '}
                {schedulePreviewText}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setScheduledAt(null)}
              style={styles.clearScheduleButton}
              activeOpacity={0.8}
            >
              <Feather name="x" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Location Input Card */}
        <View style={styles.locationCard}>
          <View style={styles.locationInputSection}>
            <View style={styles.locationDot}>
              <View style={[styles.dot, styles.dotPickup]} />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>{t.booking?.pickupLocation || 'Pickup location'}</Text>
              <TextInput
                style={styles.input}
                placeholder={t.booking?.currentLocation || 'Current location'}
                placeholderTextColor="#9CA3AF"
                value={pickupAddress}
                onChangeText={setPickupAddress}
              />
            </View>
            <TouchableOpacity style={styles.gpsButton}>
              <FontAwesome5 name="location-arrow" size={20} color="#10B981" />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.locationInputSection}>
            <View style={styles.locationDot}>
              <View style={[styles.dot, styles.dotDestination]} />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>{t.booking?.destination || 'Destination'}</Text>
              <TextInput
                style={styles.input}
                placeholder={t.booking?.whereYouGoing || 'Where are you going?'}
                placeholderTextColor="#9CA3AF"
                value={destinationAddress}
                onChangeText={setDestinationAddress}
              />
            </View>
          </View>
        </View>

        {!showEstimate && (
          <>
            {/* Saved Places */}
            <Text style={styles.sectionTitle}>{t.booking?.savedPlaces || 'Saved places'}</Text>
            <View style={styles.savedPlacesGrid}>
              {savedPlaces.map((place) => (
                <TouchableOpacity
                  key={place.id}
                  style={styles.savedPlaceCard}
                  onPress={() => setDestinationAddress(place.address)}
                  activeOpacity={0.7}
                >
                  <View style={styles.savedPlaceIcon}>
                    <Text style={styles.emoji}>{place.icon}</Text>
                  </View>
                  <Text style={styles.savedPlaceName}>{place.name}</Text>
                  <Text style={styles.savedPlaceAddress}>{place.address}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Recent Searches */}
            <Text style={styles.sectionTitle}>{t.booking?.recentSearches || 'Recent searches'}</Text>
            <View style={styles.recentSearches}>
              {recentSearches.map((search) => (
                <TouchableOpacity
                  key={search.id}
                  style={styles.searchItem}
                  onPress={() => setDestinationAddress(search.name)}
                  activeOpacity={0.7}
                >
                  <View style={styles.clockIconCircle}>
                    <FontAwesome5 name="history" size={20} color="#6B7280" />
                  </View>
                  <View style={styles.searchInfo}>
                    <Text style={styles.searchName}>{search.name}</Text>
                    <Text style={styles.searchDistance}>{search.distance}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Estimate Section - Shows when both locations are filled */}
        {showEstimate && (
          <View style={styles.estimateSection}>
            {/* Map Placeholder with Route */}
            <View style={styles.mapPlaceholder}>
              <View style={styles.mapRouteOverlay}>
                <View style={styles.mapMarkerPickup}>
                  <View style={styles.mapMarkerDot} />
                </View>
                <View style={styles.mapRouteLine} />
                <View style={styles.mapMarkerDestination}>
                  <View style={styles.mapMarkerDot} />
                </View>
                {/* Mock nearby cars */}
                <View style={[styles.nearbyCar, { top: 60, left: 40 }]}>
                  <Text style={styles.carEmoji}>🚗</Text>
                </View>
                <View style={[styles.nearbyCar, { top: 100, right: 60 }]}>
                  <Text style={styles.carEmoji}>🚗</Text>
                </View>
                <View style={[styles.nearbyCar, { bottom: 80, left: 70 }]}>
                  <Text style={styles.carEmoji}>🚗</Text>
                </View>
              </View>
            </View>

            {/* Reserve a Ride Header */}
            <Text style={styles.reserveTitle}>{t.booking?.reserveRide || 'Reserve a ride'}</Text>

            {/* Promo code row / applied badge */}
            {appliedPromo ? (
              <View style={styles.promoBadge}>
                <Feather name="check-circle" size={18} color="#10B981" />
                <Text style={styles.promoText}>
                  {(t.booking?.promoApplied ?? 'Promo applied') + ': '} 
                  {appliedPromo.code}
                  {appliedPromo.discountAmountForSelectedFare > 0
                    ? ` (-$${appliedPromo.discountAmountForSelectedFare.toFixed(2)})`
                    : ''}
                </Text>

                <Pressable onPress={handleRemovePromo} hitSlop={10} style={{ marginLeft: 'auto' }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>
                    {t.booking?.removePromo || 'Remove'}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.promoRow}
                activeOpacity={0.85}
                onPress={() => setIsPromoModalVisible(true)}
              >
                <View style={styles.promoRowIcon}>
                  <Feather name="tag" size={18} color="#111827" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.promoRowTitle}>{t.booking?.promoCode || 'Promo code'}</Text>
                  <Text style={styles.promoRowSubtitle}>{t.booking?.promoTapToAdd || 'Tap to add a code'}</Text>
                </View>
                <FontAwesome5 name="chevron-right" size={14} color="#9CA3AF" />
              </TouchableOpacity>
            )}

            {/* Vehicle Options */}
            {vehicleOptions.map((vehicle: any) => (
              <TouchableOpacity
                key={vehicle.id}
                style={[
                  styles.vehicleCard,
                  selectedVehicle === vehicle.id && styles.vehicleCardSelected,
                ]}
                onPress={() => setSelectedVehicle(vehicle.id)}
                activeOpacity={0.7}
              >
                <View style={styles.vehicleIconContainer}>
                  <Text style={styles.vehicleIcon}>{vehicle.icon}</Text>
                  <Text style={styles.vehicleSeats}>
                    <FontAwesome5 name="user" size={10} color="#6B7280" /> {vehicle.seats}
                  </Text>
                </View>

                <View style={styles.vehicleInfo}>
                  <Text style={styles.vehicleName}>{vehicle.name}</Text>
                  <Text style={styles.vehiclePickupTime}>{vehicle.pickupTime}</Text>
                  {vehicle.recommended && (
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>{t.booking?.recommended || 'Recommended'}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.vehiclePricing}>
                  <Text style={styles.vehiclePrice}>
                    ${vehicle.price.toFixed(2)}
                  </Text>
                  {vehicle.originalPrice && (
                    <Text style={styles.vehicleOriginalPrice}>
                      ${vehicle.originalPrice.toFixed(2)}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}

            {/* Payment Method Selector */}
            <TouchableOpacity style={styles.paymentCard} activeOpacity={0.8}>
              <View style={styles.paymentIcon}>
                <FontAwesome5 name="credit-card" size={20} color="#111827" />
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentLabel}>{t.booking?.paymentMethod || 'Payment method'}</Text>
                <Text style={styles.paymentValue}>Visa ••••8024</Text>
              </View>
              <FontAwesome5 name="chevron-right" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Reserve Button */}
            <TouchableOpacity
              style={styles.reserveButton}
              activeOpacity={0.85}
              onPress={handleReserve}
            >
              <Text style={styles.reserveButtonText}>
                {t.booking?.reserve || 'Reserve'} {vehicleOptions.find((v: any) => v.id === selectedVehicle)?.name ?? ''}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Schedule (Later) Modal */}
      <Modal
        visible={isScheduleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsScheduleModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsScheduleModalVisible(false)}
        />

        <View style={styles.sheetContainer}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeaderRow}>
            <Text style={styles.sheetTitle}>{t.booking?.chooseTime || 'Choose a time'}</Text>
            <TouchableOpacity
              onPress={() => setIsScheduleModalVisible(false)}
              style={styles.sheetCloseButton}
              hitSlop={10}
            >
              <Feather name="x" size={22} color="#111827" />
            </TouchableOpacity>
          </View>

          <View style={styles.segmentedRow}>
            <TouchableOpacity
              style={[styles.segmentButton, scheduleMode === 'pickup' && styles.segmentButtonActive]}
              onPress={() => setScheduleMode('pickup')}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.segmentButtonText, scheduleMode === 'pickup' && styles.segmentButtonTextActive]}
              >
                {t.booking?.pickupAt || 'Pickup at'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentButton, scheduleMode === 'dropoff' && styles.segmentButtonActive]}
              onPress={() => setScheduleMode('dropoff')}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.segmentButtonText, scheduleMode === 'dropoff' && styles.segmentButtonTextActive]}
              >
                {t.booking?.dropoffBy || 'Dropoff by'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daysRow}
          >
            {upcomingDays.map((day: { index: number; label: string; subLabel: string }) => {
              const isActive = day.index === selectedDateOffsetDays;
              return (
                <TouchableOpacity
                  key={day.index}
                  onPress={() => setSelectedDateOffsetDays(day.index)}
                  style={[styles.dayChip, isActive && styles.dayChipActive]}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.dayChipLabel, isActive && styles.dayChipLabelActive]}>{day.label}</Text>
                  <Text style={[styles.dayChipSubLabel, isActive && styles.dayChipSubLabelActive]}>{day.subLabel}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.timeList}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {timeSlots.map((slot: { minutes: number; label: string }) => {
                const isActive = slot.minutes === selectedTimeMinutes;
                return (
                  <TouchableOpacity
                    key={slot.minutes}
                    style={[styles.timeRow, isActive && styles.timeRowActive]}
                    onPress={() => setSelectedTimeMinutes(slot.minutes)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.timeRowText, isActive && styles.timeRowTextActive]}>{slot.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <Text style={styles.sheetPreviewText}>
            {(scheduleMode === 'pickup'
              ? t.booking?.pickupPreview || 'Pickup'
              : t.booking?.dropoffPreview || 'Dropoff') +
              ': '}
            {new Intl.DateTimeFormat(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            }).format(buildScheduledDate())}
          </Text>

          <TouchableOpacity
            style={styles.sheetPrimaryButton}
            activeOpacity={0.85}
            onPress={handleConfirmSchedule}
          >
            <Text style={styles.sheetPrimaryButtonText}>{t.booking?.next || 'Next'}</Text>
          </TouchableOpacity>

          <Text style={styles.sheetFootnote}>
            {t.booking?.scheduleDisclaimer ||
              'You can cancel for free before a driver is assigned. See terms.'}
          </Text>
        </View>
      </Modal>

      {/* Promo Code Modal */}
      <Modal
        visible={isPromoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPromoModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsPromoModalVisible(false)}
        />

        <View style={styles.promoSheetContainer}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeaderRow}>
            <Text style={styles.sheetTitle}>{t.booking?.promoCode || 'Promo code'}</Text>
            <TouchableOpacity
              onPress={() => setIsPromoModalVisible(false)}
              style={styles.sheetCloseButton}
              hitSlop={10}
            >
              <Feather name="x" size={22} color="#111827" />
            </TouchableOpacity>
          </View>

          <Text style={styles.promoHintText}>{t.booking?.promoHint || 'Enter a code to apply a discount to this trip.'}</Text>

          <View style={styles.promoInputRow}>
            <TextInput
              value={promoCodeDraft}
              onChangeText={setPromoCodeDraft}
              placeholder={t.booking?.promoPlaceholder || 'Enter code'}
              placeholderTextColor="#9CA3AF"
              autoCapitalize="characters"
              style={styles.promoInput}
            />
            <TouchableOpacity
              onPress={handleApplyPromo}
              activeOpacity={0.85}
              style={[styles.promoApplyButton, promoApplyLoading && { opacity: 0.6 }]}
              disabled={promoApplyLoading}
            >
              <Text style={styles.promoApplyButtonText}>
                {promoApplyLoading ? (t.common?.loading || 'Loading...') : (t.booking?.applyPromo || 'Apply')}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.promoExampleText}>
            {t.booking?.promoExample || 'Try: BIENVENUE'}
          </Text>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  laterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
  },
  laterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  locationCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: spacing.lg,
  },
  locationInputSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationDot: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  dotPickup: {
    backgroundColor: '#10B981',
  },
  dotDestination: {
    backgroundColor: '#FFA500',
  },
  inputWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
    fontWeight: '500',
  },
  input: {
    fontSize: 16,
    color: '#000000',
    padding: 0,
  },
  gpsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  savedPlacesGrid: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  savedPlaceCard: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  savedPlaceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emoji: {
    fontSize: 24,
  },
  savedPlaceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  savedPlaceAddress: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  recentSearches: {
    paddingHorizontal: spacing.lg,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  clockIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  searchInfo: {
    flex: 1,
  },
  searchName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  searchDistance: {
    fontSize: 14,
    color: '#6B7280',
  },
  schedulePillRow: {
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  schedulePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  schedulePillText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  clearScheduleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  // Estimate Section Styles
  estimateSection: {
    paddingHorizontal: spacing.lg,
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  mapRouteOverlay: {
    flex: 1,
    padding: spacing.lg,
  },
  mapMarkerPickup: {
    position: 'absolute',
    top: 40,
    left: 30,
    width: 30,
    height: 30,
    backgroundColor: '#10B981',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapMarkerDestination: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    width: 30,
    height: 30,
    backgroundColor: '#FFA500',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapMarkerDot: {
    width: 12,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
  },
  mapRouteLine: {
    position: 'absolute',
    top: 55,
    left: 45,
    bottom: 45,
    right: 55,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderColor: '#111827',
    borderBottomLeftRadius: 20,
  },
  nearbyCar: {
    position: 'absolute',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carEmoji: {
    fontSize: 24,
  },
  reserveTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: spacing.md,
  },
  promoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.lg,
  },
  promoText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10B981',
  },
  promoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  promoRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  promoRowTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  promoRowSubtitle: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  promoSheetContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  promoHintText: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#6B7280',
  },
  promoInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  promoInput: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  promoApplyButton: {
    height: 50,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoApplyButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  promoExampleText: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  vehicleCardSelected: {
    borderColor: '#111827',
    backgroundColor: '#FFFFFF',
  },
  vehicleIconContainer: {
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  vehicleIcon: {
    fontSize: 40,
    marginBottom: 4,
  },
  vehicleSeats: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  vehiclePickupTime: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
  recommendedBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  recommendedText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  vehiclePricing: {
    alignItems: 'flex-end',
  },
  vehiclePrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10B981',
  },
  vehicleOriginalPrice: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paymentIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  paymentValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  reserveButton: {
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  reserveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheetContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    marginBottom: 10,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  sheetCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#111827',
  },
  segmentButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  segmentButtonTextActive: {
    color: '#FFFFFF',
  },
  daysRow: {
    paddingVertical: 6,
    gap: 10,
    paddingRight: spacing.lg,
  },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    minWidth: 92,
  },
  dayChipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  dayChipLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  dayChipLabelActive: {
    color: '#FFFFFF',
  },
  dayChipSubLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
  },
  dayChipSubLabelActive: {
    color: '#D1D5DB',
  },
  timeList: {
    height: 220,
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  timeRow: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  timeRowActive: {
    backgroundColor: 'rgba(17, 24, 39, 0.08)',
  },
  timeRowText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  timeRowTextActive: {
    color: '#111827',
  },
  sheetPreviewText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    fontWeight: '600',
  },
  sheetPrimaryButton: {
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  sheetFootnote: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
    color: '#9CA3AF',
  },
});