import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, skip } from 'convex/react';

import { api } from '../convex/_generated/api';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAuth } from '../lib/auth';
import { useTranslation } from '../lib/i18n';
import { colors, radius, spacing, typography } from '../lib/theme';

function paymentBrandIconName(brand: string) {
  const b = (brand ?? '').toLowerCase();
  if (b.includes('visa')) return 'cc-visa';
  if (b.includes('master')) return 'cc-mastercard';
  if (b.includes('american') || b.includes('amex')) return 'cc-amex';
  if (b.includes('discover')) return 'cc-discover';
  return 'credit-card';
}

function PaymentToggleRow({
  icon,
  title,
  subtitle,
  enabled,
  onToggle,
}: {
  icon: string;
  title: string;
  subtitle: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <FontAwesome5 name={icon as any} size={18} color={colors.primary} />
      </View>
      <View style={styles.rowMain}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Switch value={enabled} onValueChange={onToggle} />
    </View>
  );
}

export default function PaymentMethodsScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { session } = useAuth();
  const userId = session?.userId as any;

  // Saved cards (stored in Convex)
  const savedCards = useQuery(api.paymentMethods.getUserPaymentMethods, userId ? { userId } : skip);
  const setDefaultPaymentMethod = useMutation(api.paymentMethods.setDefaultPaymentMethod);
  const deletePaymentMethod = useMutation(api.paymentMethods.deletePaymentMethod);

  // UI-only toggles for now. Later these will reflect real provider availability.
  const [applePayEnabled, setApplePayEnabled] = useState(true);
  const [googlePayEnabled, setGooglePayEnabled] = useState(true);
  const [cashEnabled, setCashEnabled] = useState(true);

  const creditBalance = useMemo(() => 0, []);

  const handleAddCard = () => {
    navigation.navigate('AddCard');
  };

  const handleMakeDefault = async (paymentMethodId: string) => {
    if (!userId) return;
    try {
      await setDefaultPaymentMethod({ userId, paymentMethodId: paymentMethodId as any });
    } catch {
      Alert.alert(t.common.error, t.settings.defaultSetFailed);
    }
  };

  const handleDelete = (paymentMethodId: string) => {
    Alert.alert(t.settings.deleteCardTitle, t.settings.deleteCardConfirm, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.settings.delete,
        style: 'destructive',
        onPress: async () => {
          if (!userId) return;
          try {
            await deletePaymentMethod({ userId, paymentMethodId: paymentMethodId as any });
          } catch {
            Alert.alert(t.common.error, t.settings.deleteCardFailed);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScreenHeader title={t.settings.paymentMethods} onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <Card style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{t.settings.credits}</Text>
          <Text style={styles.balanceValue}>{'$'}{creditBalance.toFixed(2)}</Text>
          <Text style={styles.balanceHint}>{t.settings.creditsHint}</Text>
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{t.settings.cardsTitle}</Text>
            <Button title={t.settings.addCardCta} onPress={handleAddCard} size="sm" />
          </View>

          <Text style={styles.sectionHint}>{t.settings.cardsHint}</Text>

          {savedCards && savedCards.length > 0 ? (
            <View style={styles.cardList}>
              {savedCards.map((method: any, idx: number) => {
                const isDefault = Boolean(method.isDefault);
                const subtitle = `${method.cardSubtype === 'debit' ? t.settings.debitCard : t.settings.creditCard} · •••• ${method.last4} · ${String(method.expMonth).padStart(2, '0')}/${String(method.expYear).slice(-2)}`;

                return (
                  <View key={String(method._id)}>
                    <Pressable
                      onPress={() => (isDefault ? null : handleMakeDefault(String(method._id)))}
                      style={({ pressed }) => [styles.savedCardRow, pressed && styles.pressed]}
                    >
                      <View style={styles.iconWrap}>
                        <FontAwesome5
                          name={paymentBrandIconName(method.brand) as any}
                          size={18}
                          color={colors.primary}
                        />
                      </View>

                      <View style={styles.rowMain}>
                        <View style={styles.savedCardTitleRow}>
                          <Text style={styles.rowTitle} numberOfLines={1}>
                            {method.nickname ? method.nickname : method.brand}
                          </Text>
                          {isDefault ? (
                            <View style={styles.defaultBadge}>
                              <Text style={styles.defaultBadgeText}>{t.settings.defaultLabel}</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.rowSubtitle}>{subtitle}</Text>
                      </View>

                      <Pressable
                        hitSlop={10}
                        onPress={() => handleDelete(String(method._id))}
                        style={({ pressed }) => [styles.deleteIconButton, pressed && { opacity: 0.7 }]}
                      >
                        <FontAwesome5 name="trash" size={16} color={colors.error} />
                      </Pressable>
                    </Pressable>

                    {idx < savedCards.length - 1 ? <View style={styles.divider} /> : null}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <FontAwesome5 name="credit-card" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.emptyTitle}>{t.settings.noCardsTitle}</Text>
                <Text style={styles.emptySubtitle}>{t.settings.noCardsSubtitle}</Text>
              </View>
            </View>
          )}
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t.settings.paymentOptions}</Text>

          <PaymentToggleRow
            icon="apple"
            title={t.settings.applePay}
            subtitle={t.settings.applePayDesc}
            enabled={applePayEnabled}
            onToggle={setApplePayEnabled}
          />

          <View style={styles.divider} />

          <PaymentToggleRow
            icon="google"
            title={t.settings.googlePay}
            subtitle={t.settings.googlePayDesc}
            enabled={googlePayEnabled}
            onToggle={setGooglePayEnabled}
          />

          <View style={styles.divider} />

          <PaymentToggleRow
            icon="money-bill"
            title={t.settings.cash}
            subtitle={t.settings.cashDesc}
            enabled={cashEnabled}
            onToggle={setCashEnabled}
          />
        </Card>
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
    padding: spacing.lg,
    gap: spacing.lg,
  },
  balanceCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
  },
  balanceLabel: {
    fontSize: typography.caption.fontSize,
    color: colors.onSurfaceVariant,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  balanceValue: {
    marginTop: spacing.sm,
    fontSize: 34,
    fontWeight: '900',
    color: colors.onSurface,
  },
  balanceHint: {
    marginTop: spacing.sm,
    fontSize: typography.body2.fontSize,
    color: colors.onSurfaceVariant,
  },
  sectionCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    gap: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.subtitle2.fontSize,
    fontWeight: '900',
    color: colors.onSurface,
  },
  sectionHint: {
    marginTop: -6,
    fontSize: typography.caption.fontSize,
    color: colors.onSurfaceVariant,
  },
  cardList: {
    marginTop: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  savedCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.92,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowMain: {
    flex: 1,
  },
  savedCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowTitle: {
    fontSize: typography.body1.fontSize,
    fontWeight: '900',
    color: colors.onSurface,
  },
  rowSubtitle: {
    marginTop: spacing.xs,
    fontSize: typography.caption.fontSize,
    color: colors.onSurfaceVariant,
  },
  defaultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  defaultBadgeText: {
    color: colors.onPrimary,
    fontWeight: '900',
    fontSize: 11,
  },
  deleteIconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  divider: {
    height: 1,
    backgroundColor: colors.outlineVariant,
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  emptyTitle: {
    fontSize: typography.body1.fontSize,
    fontWeight: '900',
    color: colors.onSurface,
  },
  emptySubtitle: {
    marginTop: spacing.xs,
    fontSize: typography.caption.fontSize,
    color: colors.onSurfaceVariant,
  },
});