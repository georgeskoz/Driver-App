import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../lib/theme';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export default function TrackingScreen() {
  const [animatedValue] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Your Trip</Text>
          <Text style={styles.status}>In Progress</Text>
        </View>

        {/* Map Placeholder - Real map integration would go here */}
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <FontAwesome5 name="map" size={60} color={colors.outlineVariant} />
            <Text style={styles.mapText}>Map Integration Area</Text>
          </View>
        </View>

        {/* Driver Info Card */}
        <Card style={styles.driverCard}>
          <View style={styles.driverHeader}>
            <View style={styles.driverAvatar}>
              <FontAwesome5 name="user" size={24} color={colors.primary} />
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>John Doe</Text>
              <View style={styles.ratingContainer}>
                <FontAwesome5 name="star" size={12} color="#FFB800" />
                <Text style={styles.rating}>4.8 (245 trips)</Text>
              </View>
            </View>
            <View style={styles.vehicleInfo}>
              <FontAwesome5 name="car" size={20} color={colors.primary} />
              <Text style={styles.vehiclePlate}>ABC-1234</Text>
            </View>
          </View>
        </Card>

        {/* Trip Details */}
        <Card style={styles.tripDetails}>
          <View style={styles.tripStep}>
            <View style={styles.stepIndicator}>
              <FontAwesome5 name="map-pin" size={16} color={colors.success} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepLabel}>Pickup Location</Text>
              <Text style={styles.stepAddress}>123 Main Street, City</Text>
              <Text style={styles.stepTime}>Arrived</Text>
            </View>
          </View>

          <View style={styles.stepConnector} />

          <View style={styles.tripStep}>
            <Animated.View
              style={[
                styles.stepIndicator,
                styles.activeIndicator,
                { opacity },
              ]}
            >
              <FontAwesome5 name="map-pin" size={16} color={colors.primary} />
            </Animated.View>
            <View style={styles.stepContent}>
              <Text style={styles.stepLabel}>Dropoff Location</Text>
              <Text style={styles.stepAddress}>456 Business Ave, City</Text>
              <Text style={styles.stepTime}>10 mins away</Text>
            </View>
          </View>
        </Card>

        {/* Trip Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <FontAwesome5 name="clock" size={16} color={colors.primary} />
            <Text style={styles.statValue}>12 mins</Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
          <View style={styles.statCard}>
            <FontAwesome5 name="route" size={16} color={colors.primary} />
            <Text style={styles.statValue}>4.2 km</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statCard}>
            <FontAwesome5 name="tag" size={16} color={colors.primary} />
            <Text style={styles.statValue}>₦15.50</Text>
            <Text style={styles.statLabel}>Est. Fare</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <Button
            title="Call Driver"
            onPress={() => console.log('Call driver')}
            size="md"
            style={styles.actionButton}
          />
          <Button
            title="Cancel Trip"
            onPress={() => console.log('Cancel trip')}
            variant="danger"
            size="md"
            style={styles.actionButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.h2.fontSize,
    fontWeight: '700',
    color: colors.onSurface,
  },
  status: {
    fontSize: typography.body2.fontSize,
    color: colors.success,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  mapContainer: {
    height: 240,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    fontSize: typography.caption.fontSize,
    color: colors.onSurfaceVariant,
    marginTop: spacing.md,
  },
  driverCard: {
    marginBottom: spacing.lg,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  driverAvatar: {
    width: 56,
    height: 56,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: typography.body1.fontSize,
    fontWeight: '600',
    color: colors.onSurface,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  rating: {
    fontSize: typography.caption.fontSize,
    color: colors.onSurfaceVariant,
  },
  vehicleInfo: {
    alignItems: 'center',
  },
  vehiclePlate: {
    fontSize: typography.caption.fontSize,
    color: colors.onSurface,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  tripDetails: {
    marginBottom: spacing.lg,
  },
  tripStep: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stepIndicator: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIndicator: {
    backgroundColor: colors.primary,
  },
  stepConnector: {
    width: 2,
    height: 24,
    backgroundColor: colors.outlineVariant,
    marginLeft: 19,
    marginVertical: spacing.sm,
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: typography.body2.fontSize,
    fontWeight: '600',
    color: colors.onSurface,
  },
  stepAddress: {
    fontSize: typography.caption.fontSize,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  stepTime: {
    fontSize: typography.caption.fontSize,
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  statValue: {
    fontSize: typography.subtitle2.fontSize,
    fontWeight: '700',
    color: colors.onSurface,
    marginTop: spacing.sm,
  },
  statLabel: {
    fontSize: typography.caption.fontSize,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});