import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useMutation, useQuery, skip } from 'convex/react';
import * as Updates from 'expo-updates';

import { api } from '../convex/_generated/api';
import { useTranslation } from '../lib/i18n';
import { colors, radius, shadows, spacing, typography } from '../lib/theme';

type RideNavigationRouteParams = {
  orderId: string;
};

function buildDirectionsUrl(params: { origin: string; destination: string }) {
  const origin = encodeURIComponent(params.origin);
  const destination = encodeURIComponent(params.destination);

  // Universal HTTP link. On iOS/Android this will open a browser or hand off to the installed maps app.
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
}

export default function RideNavigationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();

  const completeOrderPayment = useMutation(api.users.completeOrderPayment);

  const params = (route.params || {}) as Partial<RideNavigationRouteParams>;
  const orderId = (params.orderId as any) || null;

  const rideDetails = useQuery(
    api.users.getRideTrackingDetails,
    orderId ? { orderId } : skip
  );

  const order = rideDetails?.order;

  // If the driver completes payment, take the customer to the Trip Completed screen.
  React.useEffect(() => {
    if (!orderId || !order) return;
    if (order.status !== 'completed') return;
    navigation.replace('TripCompleted' as never, { orderId } as never);
  }, [navigation, order, orderId]);

  // For now, we show a realistic ETA UI, but the actual value will come from routing later.
  const [etaMinutes] = useState(18);

  const isProductionChannel = (Updates.channel ?? '').toLowerCase() === 'production';
  const showDevControls = !isProductionChannel;

  const handleDevCompleteTrip = async () => {
    try {
      if (!orderId || !order) return;
      await completeOrderPayment({
        orderId,
        actualFare: order.estimatedFare,
        paymentMethod: 'card' as any,
        paymentBrand: 'Visa',
        paymentLast4: '4242',
      });
    } catch {
      // ignore
    }
  };

  const contentMaxWidth = useMemo(() => {
    return Math.min(620, Math.max(360, width - spacing.xxl * 2));
  }, [width]);

  const arrivalTimeText = useMemo(() => {
    const now = new Date();
    const etaMs = etaMinutes * 60 * 1000;
    const arrival = new Date(now.getTime() + etaMs);
    const hours = arrival.getHours();
    const minutes = arrival.getMinutes();
    const paddedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${hours}:${paddedMinutes}`;
  }, [etaMinutes]);

  const handleOpenNavigation = async () => {
    if (!order) return;
    const url = buildDirectionsUrl({
      origin: order.pickupAddress,
      destination: order.dropoffAddress,
    });

    try {
      await Linking.openURL(url);
    } catch {
      // ignore
    }
  };

  const handleBackToTracking = () => {
    // If the user wants to go back to the driver card view.
    navigation.goBack();
  };

  if (!orderId) {
    return null;
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.background}>
          <View style={[styles.centered, { width: contentMaxWidth }]}>
            <View style={styles.headerCard}>
              <Text style={styles.headerTitle}>{t.common.loading}</Text>
              <Text style={styles.headerSubtitle}>{t.booking.keepWaiting}</Text>
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              style={styles.secondaryButton}
              onPress={handleBackToTracking}
            >
              <Text style={styles.secondaryButtonText}>{t.common.back}</Text>
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
          {/* Header */}
          <View style={styles.headerCard}>
            <View style={styles.headerIcon}>
              <MaterialCommunityIcons name="navigation-variant" size={18} color={colors.onPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>{t.ride.navigationTitle}</Text>
              <Text style={styles.headerSubtitle}>{t.ride.navigationSubtitle}</Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.etaBig}>{etaMinutes}</Text>
              <Text style={styles.etaSmall}>{t.ride.minutes}</Text>
            </View>
          </View>

          {/* Route card */}
          <View style={styles.routeCard}>
            <View style={styles.routeRow}>
              <View style={[styles.dot, { backgroundColor: colors.success }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.routeLabel}>{t.booking.pickup}</Text>
                <Text numberOfLines={2} style={styles.routeValue}>
                  {order.pickupAddress}
                </Text>
              </View>
            </View>

            <View style={styles.routeSeparator}>
              <View style={styles.routeLine} />
            </View>

            <View style={styles.routeRow}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.routeLabel}>{t.booking.dropoff}</Text>
                <Text numberOfLines={2} style={styles.routeValue}>
                  {order.dropoffAddress}
                </Text>
              </View>
            </View>
          </View>

          {/* Map placeholder */}
          <View style={styles.mapCard}>
            <View style={styles.mapCanvas}>
              <View style={styles.mapPin}>
                <MaterialCommunityIcons name="map-marker-radius" size={28} color={colors.primary} />
              </View>
              <Text style={styles.mapHint}>{t.ride.interactiveMap}</Text>
            </View>
          </View>

          {/* Details / actions */}
          <View style={styles.sheet}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetContent}
            >
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t.ride.etaToDestination}</Text>
                <Text style={styles.detailValue}>
                  {etaMinutes} {t.ride.minutes}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t.ride.arrivalTime}</Text>
                <Text style={styles.detailValue}>{arrivalTimeText}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t.booking.estimatedFare}</Text>
                <Text style={styles.priceValue}>${order.estimatedFare.toFixed(2)}</Text>
              </View>

              <TouchableOpacity
                accessibilityRole="button"
                style={styles.primaryButton}
                onPress={handleOpenNavigation}
                activeOpacity={0.9}
              >
                <Feather name="navigation" size={18} color={colors.onPrimary} />
                <Text style={styles.primaryButtonText}>{t.ride.openNavigation}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={handleBackToTracking}
                activeOpacity={0.9}
              >
                <Text style={styles.secondaryButtonText}>{t.common.back}</Text>
              </TouchableOpacity>

              {showDevControls ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  style={styles.devButton}
                  onPress={handleDevCompleteTrip}
                  activeOpacity={0.9}
                >
                  <Text style={styles.devButtonText}>DEV: Complete trip (payment)</Text>
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
    paddingTop: spacing.lg,
  },

  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.outline,
    ...shadows.sm,
    gap: spacing.md,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.onSurface,
  },
  headerSubtitle: {
    marginTop: 2,
    ...typography.body2,
    color: colors.onSurfaceVariant,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  etaBig: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.onSurface,
    lineHeight: 22,
  },
  etaSmall: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '800',
    color: colors.onSurfaceVariant,
  },

  routeCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.outline,
    ...shadows.sm,
    padding: spacing.lg,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  routeLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  routeValue: {
    marginTop: 4,
    ...typography.subtitle2,
    color: colors.onSurface,
    fontWeight: '800',
  },
  routeSeparator: {
    height: 22,
    justifyContent: 'center',
    paddingLeft: 5,
    marginVertical: spacing.sm,
  },
  routeLine: {
    height: '100%',
    width: 2,
    backgroundColor: colors.outline,
    borderRadius: 1,
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
  mapCanvas: {
    height: 220,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPin: {
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
    padding: spacing.lg,
    paddingBottom: spacing.giant,
    gap: spacing.md,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceVariant,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  detailLabel: {
    ...typography.subtitle2,
    color: colors.onSurfaceVariant,
  },
  detailValue: {
    ...typography.subtitle2,
    fontWeight: '900',
    color: colors.onSurface,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.onSurface,
  },

  primaryButton: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    ...shadows.sm,
  },
  primaryButtonText: {
    ...typography.button,
    color: colors.onPrimary,
  },

  secondaryButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outline,
  },
  secondaryButtonText: {
    ...typography.button,
    color: colors.onSurface,
  },

  devButton: {
    marginTop: spacing.sm,
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