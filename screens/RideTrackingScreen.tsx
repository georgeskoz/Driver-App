import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  SafeAreaView,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome5, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from '../lib/i18n';
import { colors, radius, shadows, spacing, typography } from '../lib/theme';
import { useMutation, useQuery, skip } from 'convex/react';
import { api } from '../convex/_generated/api';
import { notifyUserLocal } from '../lib/userNotifications';
import * as Updates from 'expo-updates';

type RideTrackingParams = {
  orderId: string;
};

export default function RideTrackingScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();

  const params = (route.params || {}) as Partial<RideTrackingParams>;
  const orderId = (params.orderId as any) || null;

  const rideDetails = useQuery(
    api.users.getRideTrackingDetails,
    orderId ? { orderId } : skip
  );
  const updateOrderStatus = useMutation(api.users.updateOrderStatus);

  const order = rideDetails?.order;
  const driver = rideDetails?.driver;

  const isLoadingRideDetails = !!orderId && rideDetails === undefined;
  const hasDriverAssigned = !!order && order.status === 'matched' && !!driver;

  const driverName = driver?.fullName || 'Driver';
  const driverRating = driver?.rating ?? null;
  const driverTrips = driver?.totalTrips ?? null;
  const vehicleMake = `${driver?.vehicleMake ?? ''} ${driver?.vehicleModel ?? ''}`.trim() || 'Vehicle';
  const vehiclePlate = driver?.licensePlate || '—';
  const vehicleColor = driver?.vehicleColor || '';
  const permitNumber = driver?.permitNumber || '—';
  const estimatedFare = order?.estimatedFare ?? 0;

  const [etaMinutes, setEtaMinutes] = useState(4);

  const hasHandledArrivedRef = React.useRef(false);

  const contentMaxWidth = useMemo(() => {
    // Comfortable reading width on tablets/iPads.
    return Math.min(560, Math.max(360, width - spacing.xxl * 2));
  }, [width]);

  const driverInitials = useMemo(() => {
    const parts = driverName.trim().split(' ').filter(Boolean);
    const initials = parts.slice(0, 2).map((n) => n[0]).join('');
    return initials.toUpperCase() || 'DR';
  }, [driverName]);

  useEffect(() => {
    // If this screen is opened without an orderId, fall back safely.
    if (!orderId) {
      navigation.goBack();
    }
  }, [navigation, orderId]);

  useEffect(() => {
    // If the order is cancelled while we're here, exit.
    if (order?.status === 'cancelled') {
      navigation.goBack();
    }
  }, [navigation, order?.status]);

  useEffect(() => {
    // Transition: driver arrived at pickup.
    // We notify the user and move them into the "navigation" step.
    if (!orderId || !order) return;
    if (order.status !== 'driver_arrived') return;
    if (hasHandledArrivedRef.current) return;

    hasHandledArrivedRef.current = true;

    void notifyUserLocal({
      title: t.ride?.driverArrivedNotificationTitle || 'Driver arrived',
      body: t.ride?.driverArrivedNotificationBody || 'Your driver has arrived at the pickup location.',
    });

    navigation.replace('RideNavigation' as never, { orderId } as never);
  }, [navigation, order, orderId, t.ride]);

  useEffect(() => {
    // Transition: trip completed (payment done).
    if (!orderId || !order) return;
    if (order.status !== 'completed') return;
    navigation.replace('TripCompleted' as never, { orderId } as never);
  }, [navigation, order, orderId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setEtaMinutes((prev) => Math.max(1, prev - 1));
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleCall = () => {
    if (!driver?.phone) return;
    Linking.openURL(`tel:${driver.phone}`);
  };

  const handleMessage = () => {
    if (!driver?.phone) return;
    Linking.openURL(`sms:${driver.phone}`);
  };

  const handleShare = () => {
    // Placeholder until we add a real share flow (deep link / trip link).
  };

  const handleCancel = async () => {
    try {
      if (orderId) {
        await updateOrderStatus({ orderId, status: 'cancelled' as any });
      }
    } finally {
      navigation.goBack();
    }
  };

  const isProductionChannel = (Updates.channel ?? '').toLowerCase() === 'production';
  const showDevControls = !isProductionChannel;

  const handleDevMarkArrived = async () => {
    try {
      if (!orderId) return;
      await updateOrderStatus({ orderId, status: 'driver_arrived' as any });
    } catch {
      // ignore
    }
  };

  // Polished "waiting" state: don't show driver/vehicle placeholders until we truly have a driver.
  if (!orderId) {
    return null;
  }

  if (isLoadingRideDetails || !order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.background}>
          <View style={[styles.centered, { width: contentMaxWidth, justifyContent: 'center' }]}>
            <View style={styles.waitCard}>
              <View style={styles.waitIconCircle}>
                <ActivityIndicator size="small" color={colors.secondary} />
              </View>
              <Text style={styles.waitTitle}>{t.common?.loading || 'Loading...'}</Text>
              <Text style={styles.waitSubtitle}>
                {t.booking?.keepWaiting || "Keep this screen open; we'll update you automatically."}
              </Text>
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              style={styles.waitCancelButton}
              onPress={handleCancel}
              activeOpacity={0.9}
            >
              <Text style={styles.waitCancelText}>{t.common?.cancel || 'Cancel'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasDriverAssigned) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.background}>
          <View style={[styles.centered, { width: contentMaxWidth, justifyContent: 'center' }]}>
            <View style={styles.waitCard}>
              <View style={styles.waitIconCircle}>
                <MaterialCommunityIcons name="account-search" size={18} color={colors.onSecondary} />
              </View>
              <Text style={styles.waitTitle}>
                {t.ride?.assigningDriverTitle || 'Assigning your driver'}
              </Text>
              <Text style={styles.waitSubtitle}>
                {t.ride?.assigningDriverSubtitle ||
                  "Hang tight — we'll notify you as soon as a driver accepts."}
              </Text>

              <View style={styles.waitTripPreview}>
                <View style={styles.waitTripRow}>
                  <View style={styles.mapDotPickup} />
                  <Text numberOfLines={1} style={styles.waitTripText}>
                    {order.pickupAddress || (t.booking?.pickupLocation ?? 'Pickup location')}
                  </Text>
                </View>
                <View style={[styles.waitTripRow, { marginTop: spacing.sm }]}>
                  <View style={styles.mapDotDropoff} />
                  <Text numberOfLines={1} style={styles.waitTripText}>
                    {order.dropoffAddress || (t.booking?.destination ?? 'Destination')}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              style={styles.waitCancelButton}
              onPress={handleCancel}
              activeOpacity={0.9}
            >
              <Text style={styles.waitCancelText}>{t.common?.cancel || 'Cancel'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.background}>
        <View style={[styles.centered, { width: contentMaxWidth }]}>
          {/* Status / ETA */}
          <View style={styles.statusCard}>
            <View style={styles.statusIcon}>
              <MaterialCommunityIcons name="steering" size={18} color={colors.onSecondary} />
            </View>
            <View style={styles.statusTextCol}>
              <Text style={styles.statusTitle}>
                {t.ride?.driverArriving || 'Driver is arriving'}
              </Text>
              <Text style={styles.statusSubtitle}>
                {etaMinutes} {t.ride?.minutes || 'min'}
              </Text>
            </View>
            <View style={styles.statusChip}>
              <Text style={styles.statusChipText}>{t.ride?.enRoute || 'En route'}</Text>
            </View>
          </View>

          {/* "Map" placeholder */}
          <View style={styles.mapCard}>
            <View style={styles.mapHeaderRow}>
              <View style={styles.mapHeaderLeft}>
                <View style={styles.mapDotPickup} />
                <Text numberOfLines={1} style={styles.mapAddressText}>
                  {order?.pickupAddress || (t.booking?.pickupLocation ?? 'Pickup location')}
                </Text>
              </View>
              <Feather name="arrow-right" size={16} color={colors.onSurfaceVariant} />
              <View style={styles.mapHeaderRight}>
                <View style={styles.mapDotDropoff} />
                <Text numberOfLines={1} style={styles.mapAddressText}>
                  {order?.dropoffAddress || (t.booking?.destination ?? 'Destination')}
                </Text>
              </View>
            </View>

            <View style={styles.mapCanvas}>
              {/* Route line */}
              <View style={styles.routeLine} />

              {/* "Nearby cars" mock markers */}
              <View style={[styles.carMarker, { top: 18, left: 22 }]}>
                <MaterialCommunityIcons name="car" size={16} color={colors.secondary} />
              </View>
              <View style={[styles.carMarker, { top: 58, right: 28 }]}>
                <MaterialCommunityIcons name="car" size={16} color={colors.secondary} />
              </View>
              <View style={[styles.carMarker, { bottom: 26, left: 90 }]}>
                <MaterialCommunityIcons name="car" size={16} color={colors.secondary} />
              </View>

              <View style={styles.mapCenterPin}>
                <MaterialCommunityIcons name="map-marker-radius" size={28} color={colors.success} />
              </View>

              <Text style={styles.mapHint}>{t.ride?.interactiveMap || 'Interactive map'}</Text>
            </View>
          </View>

          {/* Bottom sheet content (scrollable for small screens) */}
          <View style={styles.sheet}>
            <ScrollView
              contentContainerStyle={styles.sheetContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.sheetGrabber} />

              {/* Driver header */}
              <View style={styles.driverHeaderRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{driverInitials}</Text>
                </View>

                <View style={styles.driverMeta}>
                  <Text style={styles.driverName}>{driverName}</Text>
                  <View style={styles.driverStatsRow}>
                    <FontAwesome5 name="star" size={13} color={colors.warning} solid />
                    <Text style={styles.driverStatText}>
                      {(driverRating ?? 0).toFixed(2)}
                    </Text>
                    <Text style={styles.driverStatDivider}>•</Text>
                    <Text style={styles.driverStatMuted}>
                      {(driverTrips ?? 0)} {t.ride?.trips || 'trips'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Quick actions */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  accessibilityRole="button"
                  style={styles.actionButton}
                  onPress={handleCall}
                  disabled={!driver?.phone}
                >
                  <Feather name="phone" size={18} color={colors.onSurface} />
                  <Text style={styles.actionText}>{t.ride?.call || 'Call'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityRole="button"
                  style={styles.actionButton}
                  onPress={handleMessage}
                  disabled={!driver?.phone}
                >
                  <Feather name="message-circle" size={18} color={colors.onSurface} />
                  <Text style={styles.actionText}>{t.ride?.message || 'Message'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityRole="button"
                  style={styles.actionButton}
                  onPress={handleShare}
                >
                  <Feather name="share-2" size={18} color={colors.onSurface} />
                  <Text style={styles.actionText}>{t.ride?.share || 'Share'}</Text>
                </TouchableOpacity>
              </View>

              {/* Vehicle card */}
              <View style={styles.card}>
                <View style={styles.cardRowTop}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>{vehicleMake}</Text>
                    <View style={styles.vehicleBadge}>
                      <MaterialCommunityIcons name="car-outline" size={16} color={colors.secondary} />
                      <Text style={styles.vehicleBadgeText}>{t.ride?.vehicleVerified || 'Verified'}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.vehicleRow}>
                  <View style={styles.plateBlock}>
                    <Text style={styles.plateText}>{vehiclePlate}</Text>
                    {!!vehicleColor && <Text style={styles.vehicleColorText}>{vehicleColor}</Text>}
                  </View>
                  <View style={styles.vehicleIconBox}>
                    <MaterialCommunityIcons name="car-side" size={28} color={colors.onSurfaceVariant} />
                  </View>
                </View>
              </View>

              {/* Permit / compliance */}
              <View style={styles.permitCard}>
                <MaterialCommunityIcons name="shield-check" size={18} color={colors.success} />
                <Text style={styles.permitText}>
                  {t.ride?.permitNumber || 'Permit number'}: {permitNumber}
                </Text>
              </View>

              {/* Fare row */}
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>{t.booking?.estimatedFare || 'Estimated fare'}</Text>
                <Text style={styles.fareValue}>${estimatedFare.toFixed(2)}</Text>
              </View>

              {/* Cancel */}
              <TouchableOpacity
                accessibilityRole="button"
                style={styles.cancelButton}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>{t.common?.cancel || 'Cancel'}</Text>
              </TouchableOpacity>

              {showDevControls ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  style={styles.devButton}
                  onPress={handleDevMarkArrived}
                  activeOpacity={0.9}
                >
                  <Text style={styles.devButtonText}>DEV: Mark driver arrived</Text>
                </TouchableOpacity>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  background: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  centered: {
    flex: 1,
    alignSelf: 'center',
  },

  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.outline,
    ...shadows.sm,
  },
  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTextCol: {
    marginLeft: spacing.md,
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.onSurface,
  },
  statusSubtitle: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
  },
  statusChip: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.onSurface,
  },

  mapCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.outline,
    overflow: 'hidden',
    ...shadows.sm,
  },
  mapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
    gap: spacing.sm,
  },
  mapHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mapHeaderRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  mapDotPickup: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  mapDotDropoff: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.warning,
  },
  mapAddressText: {
    ...typography.body2,
    color: colors.onSurface,
    flexShrink: 1,
  },
  mapCanvas: {
    height: 220,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  routeLine: {
    position: 'absolute',
    width: '72%',
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.outlineVariant,
    top: 92,
  },
  carMarker: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.outline,
    ...shadows.sm,
  },
  mapCenterPin: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.outline,
    ...shadows.md,
  },
  mapHint: {
    marginTop: spacing.md,
    ...typography.caption,
    color: colors.onSurfaceVariant,
  },

  sheet: {
    flex: 1,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.outline,
    overflow: 'hidden',
    ...shadows.md,
  },
  sheetContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.giant,
  },
  sheetGrabber: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.outline,
    marginBottom: spacing.lg,
  },

  driverHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.outline,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.onSurface,
  },
  driverMeta: {
    flex: 1,
    marginLeft: spacing.md,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.onSurface,
  },
  driverStatsRow: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverStatText: {
    marginLeft: spacing.xs,
    fontSize: 13,
    fontWeight: '800',
    color: colors.onSurface,
  },
  driverStatDivider: {
    marginHorizontal: spacing.sm,
    fontSize: 13,
    fontWeight: '800',
    color: colors.onSurfaceVariant,
  },
  driverStatMuted: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
  },

  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.outline,
  },
  actionText: {
    marginTop: spacing.xs,
    fontSize: 12,
    fontWeight: '800',
    color: colors.onSurface,
  },

  card: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: spacing.lg,
  },
  cardRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    ...typography.subtitle1,
    color: colors.onSurface,
  },
  vehicleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  vehicleBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.onSurface,
  },

  vehicleRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  plateBlock: {
    flex: 1,
  },
  plateText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.onSurface,
    letterSpacing: 2,
  },
  vehicleColorText: {
    marginTop: spacing.xs,
    ...typography.body2,
    color: colors.onSurfaceVariant,
  },
  vehicleIconBox: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.outline,
  },

  permitCard: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: 'rgba(34, 197, 94, 0.10)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.30)',
  },
  permitText: {
    flex: 1,
    ...typography.body2,
    color: colors.onSurface,
    fontWeight: '700',
  },

  fareRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: colors.surfaceVariant,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  fareLabel: {
    ...typography.subtitle2,
    color: colors.onSurfaceVariant,
  },
  fareValue: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.onSurface,
  },

  cancelButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.error,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  cancelButtonText: {
    ...typography.button,
    color: colors.onError,
  },

  waitCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.outline,
    ...shadows.sm,
  },
  waitIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  waitTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.onSurface,
  },
  waitSubtitle: {
    marginTop: spacing.sm,
    ...typography.body2,
    color: colors.onSurfaceVariant,
    lineHeight: 20,
  },
  waitTripPreview: {
    marginTop: spacing.lg,
    backgroundColor: colors.surfaceVariant,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  waitTripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  waitTripText: {
    flex: 1,
    ...typography.body2,
    color: colors.onSurface,
    fontWeight: '700',
  },
  waitCancelButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.error,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  waitCancelText: {
    ...typography.button,
    color: colors.onError,
  },
  devButton: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(2, 132, 199, 0.10)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.25)',
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  devButtonText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.onSurface,
    letterSpacing: 0.2,
  },
});