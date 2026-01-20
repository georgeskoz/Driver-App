import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '../lib/theme';
import { Card } from '../components/Card';

import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { useAuth } from '../lib/auth';
import { useTranslation } from '../lib/i18n';

function formatDateShort(timestampMs: number) {
  const d = new Date(timestampMs);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function HistoryScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();

  const orders = useQuery(
    api.users.getUserOrders,
    session?.userId ? { userId: session.userId as any } : ('skip' as any)
  );

  const data = useMemo(() => orders ?? [], [orders]);

  const renderBooking = ({ item }: { item: any }) => (
    <TouchableOpacity activeOpacity={0.7}>
      <Card style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <View style={styles.bookingIcon}>
            <FontAwesome5
              name={item.mode === 'ride' ? 'car' : 'box'}
              size={20}
              color={item.mode === 'ride' ? colors.primary : colors.secondary}
            />
          </View>
          <View style={styles.bookingMain}>
            <Text style={styles.bookingType}>
              {item.mode === 'ride' ? t.home.ride : t.home.delivery} • {formatDateShort(item.createdAt)}
            </Text>
            <Text style={styles.bookingRoute}>{item.from}</Text>
            <Text style={styles.bookingRoute} numberOfLines={1}>
              → {item.to}
            </Text>
          </View>
          <View style={styles.costWrap}>
            <Text style={styles.bookingCost}>{'—'}</Text>
          </View>
        </View>

        <View style={styles.bookingFooter}>
          <View style={styles.statusBadge}>
            <FontAwesome5
              name={item.status === 'completed' ? 'check-circle' : item.status === 'cancelled' ? 'times-circle' : 'clock'}
              size={14}
              color={item.status === 'completed' ? colors.success : item.status === 'cancelled' ? colors.error : colors.onSurfaceVariant}
            />
            <Text
              style={[
                styles.statusText,
                item.status === 'completed'
                  ? styles.completedStatus
                  : item.status === 'cancelled'
                    ? styles.cancelledStatus
                    : styles.pendingStatus,
              ]}
            >
              {item.status === 'completed'
                ? t.tripCompleted.title
                : item.status === 'cancelled'
                  ? t.common.cancel
                  : item.status}
            </Text>
          </View>

          <View />
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.activity.title}</Text>
      </View>

      <FlatList
        data={data.map((o: any) => ({
          _id: o._id,
          mode: o.mode,
          status: o.status,
          createdAt: o.createdAt,
          from: o.pickupAddress,
          to: o.dropoffAddress,
        }))}
        renderItem={renderBooking}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        scrollEnabled={true}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t.activity.noOrders}</Text>
            <Text style={styles.emptySubtitle}>{t.activity.orderHistory}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  title: {
    fontSize: typography.h2.fontSize,
    fontWeight: '700',
    color: colors.onSurface,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  bookingCard: {
    marginBottom: spacing.md,
  },
  bookingHeader: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  bookingIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingMain: {
    flex: 1,
  },
  bookingType: {
    fontSize: typography.caption.fontSize,
    color: colors.onSurfaceVariant,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  bookingRoute: {
    fontSize: typography.body2.fontSize,
    color: colors.onSurface,
  },
  bookingCost: {
    fontSize: typography.subtitle2.fontSize,
    fontWeight: '700',
    color: colors.primary,
  },
  costWrap: { alignItems: 'flex-end', justifyContent: 'center' },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  completedStatus: {
    color: colors.success,
  },
  cancelledStatus: {
    color: colors.error,
  },
  pendingStatus: {
    color: colors.onSurfaceVariant,
  },
  emptyState: {
    paddingTop: spacing.huge,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.subtitle1.fontSize,
    fontWeight: '800',
    color: colors.onSurface,
  },
  emptySubtitle: {
    marginTop: spacing.sm,
    fontSize: typography.body2.fontSize,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
});