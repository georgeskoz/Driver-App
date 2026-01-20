import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import PrimaryButton from '../components/PrimaryButton';
import { useDriverAuth } from '../lib/auth';
import { colors, radius, spacing } from '../lib/theme';

export default function DriverTripScreen() {
  const { session } = useDriverAuth();
  const userId = session?.userId as any;

  const active = useQuery(api.drivers.getMyActiveOrder, session ? { userId } : 'skip');
  const updateStatus = useMutation(api.drivers.updateOrderStatusAsDriver);

  const [busy, setBusy] = useState(false);

  const nextActions = useMemo(() => {
    if (!active) return [] as Array<{ label: string; status: any }>;

    const status = String((active as any).status);

    if (status === 'matched') {
      return [{ label: 'Arrived at pickup', status: 'driver_arrived' }];
    }
    if (status === 'driver_arrived') {
      return [{ label: 'Picked up rider', status: 'picked_up' }];
    }
    if (status === 'picked_up') {
      return [{ label: 'Start trip', status: 'in_transit' }];
    }
    if (status === 'in_transit') {
      return [{ label: 'Complete trip', status: 'completed' }];
    }

    return [];
  }, [active]);

  const run = async (status: any) => {
    if (!session || !active) return;

    setBusy(true);
    try {
      await updateStatus({ userId, orderId: (active as any).orderId, status });
    } catch (e: any) {
      Alert.alert('Could not update trip', String(e?.message ?? 'Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trip</Text>
        <Text style={styles.subtitle}>Your current ride</Text>
      </View>

      {!active ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>No active trip</Text>
          <Text style={styles.cardBody}>Accept a job to see trip details here.</Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pickup</Text>
          <Text style={styles.cardBody}>{String((active as any).pickupAddress)}</Text>

          <View style={{ height: spacing.lg }} />

          <Text style={styles.cardTitle}>Dropoff</Text>
          <Text style={styles.cardBody}>{String((active as any).dropoffAddress)}</Text>

          <View style={{ height: spacing.lg }} />

          <Text style={styles.meta}>Status: {String((active as any).status)}</Text>
          <Text style={styles.meta}>Fare: ${Number((active as any).estimatedFare).toFixed(2)}</Text>

          <View style={{ height: spacing.xl }} />

          {nextActions.map((a: any) => (
            <View key={a.status} style={{ marginBottom: spacing.md }}>
              <PrimaryButton title={a.label} onPress={() => run(a.status)} isLoading={busy} />
            </View>
          ))}

          <PrimaryButton
            title="Cancel ride"
            tone="danger"
            onPress={() => run('cancelled')}
            isLoading={busy}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl },
  header: { marginBottom: spacing.lg },
  title: { color: colors.onBackground, fontSize: 28, fontWeight: '900' },
  subtitle: { color: colors.onSurfaceVariant, marginTop: spacing.xs, fontWeight: '600' },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.xl,
  },
  cardTitle: { color: colors.onSurfaceVariant, fontWeight: '900', fontSize: 12, letterSpacing: 0.3 },
  cardBody: { color: colors.onSurface, marginTop: spacing.xs, fontWeight: '700', lineHeight: 18 },
  meta: { color: colors.onSurfaceVariant, fontWeight: '700', marginTop: spacing.xs },
});