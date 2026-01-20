import React, { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useMutation, useQuery } from 'convex/react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { colors, radius, spacing, typography } from '../lib/theme';
import { useTranslation } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { api } from '../convex/_generated/api';

function formatKind(kind: 'pickup' | 'dropoff', t: any) {
return kind === 'pickup' ? t.settings.pickupAddresses : t.settings.dropoffAddresses;
}

export default function SavedAddressesScreen({ navigation }: any) {
const { t } = useTranslation();
const { session } = useAuth();

const userId = session?.userId as any;
const [kind, setKind] = useState<'pickup' | 'dropoff'>('pickup');

const addresses = useQuery(
api.users.getSavedAddresses,
session?.userId ? { userId, kind } : ('skip' as any)
);
const deleteSavedAddress = useMutation(api.users.deleteSavedAddress);

const headerRight = (
<TouchableOpacity
activeOpacity={0.7}
onPress={() => navigation.navigate('AddSavedAddress', { kind })}
style={styles.headerIconButton}
>
<FontAwesome5 name="plus" size={18} color={colors.primary} />
</TouchableOpacity>
);

const tabs = useMemo(
() => [
{ id: 'pickup', label: t.settings.pickupAddresses },
{ id: 'dropoff', label: t.settings.dropoffAddresses },
],
[t]
);

const renderItem = ({ item }: any) => {
return (
<Card style={styles.itemCard}>
<View style={styles.itemRow}>
<View style={styles.itemIcon}>
<FontAwesome5
name={item.kind === 'pickup' ? 'arrow-up' : 'arrow-down'}
size={14}
color={colors.primary}
/>
</View>
<View style={styles.itemMain}>
<Text style={styles.itemLabel}>{item.label}</Text>
<Text style={styles.itemAddress} numberOfLines={2}>
{item.address}
</Text>
{item.notes ? (
<Text style={styles.itemNotes} numberOfLines={2}>
{item.notes}
</Text>
) : null}
</View>
<TouchableOpacity
activeOpacity={0.7}
onPress={() => {
Alert.alert(t.common.confirm, t.settings.deleteAddressConfirm, [
{ text: t.common.cancel, style: 'cancel' },
{
text: t.settings.delete,
style: 'destructive',
onPress: async () => {
try {
await deleteSavedAddress({ savedAddressId: item._id, userId });
} catch {
Alert.alert(t.common.error, t.settings.deleteFailed);
}
},
},
]);
}}
style={styles.deleteButton}
>
<FontAwesome5 name="trash" size={16} color={colors.error} />
</TouchableOpacity>
</View>
</Card>
);
};

return (
  <SafeAreaView style={styles.container} edges={['bottom']}>
    <ScreenHeader title={t.settings.savedAddresses} onBack={() => navigation.goBack()} right={headerRight} />

    <View style={styles.content}>
      <View style={styles.tabs}>
        {tabs.map((tab) => {
          const active = tab.id === kind;
          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.8}
              onPress={() => setKind(tab.id as any)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={addresses ?? []}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <FontAwesome5 name="map-marked-alt" size={18} color={colors.onSurfaceVariant} />
            </View>
            <Text style={styles.emptyTitle}>{t.settings.noSavedAddressesTitle}</Text>
            <Text style={styles.emptySubtitle}>
              {t.settings.noSavedAddressesSubtitle.replace('{kind}', formatKind(kind, t))}
            </Text>
          </View>
        }
      />

      <View style={styles.bottomCtaWrap} pointerEvents="box-none">
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('AddSavedAddress', { kind })}
          style={styles.bottomCta}
        >
          <FontAwesome5 name="plus" size={14} color={colors.onPrimary} />
          <Text style={styles.bottomCtaText}>{t.settings.addAddress}</Text>
        </TouchableOpacity>
      </View>
    </View>
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
container: { flex: 1, backgroundColor: colors.background },
content: { flex: 1, paddingHorizontal: spacing.lg },
headerIconButton: {
width: 44,
height: 36,
borderRadius: 10,
alignItems: 'center',
justifyContent: 'center',
},
tabs: {
flexDirection: 'row',
backgroundColor: colors.surfaceVariant,
borderRadius: radius.xl,
padding: spacing.xs,
borderWidth: 1,
borderColor: colors.outlineVariant,
},
tab: {
flex: 1,
paddingVertical: spacing.sm,
borderRadius: radius.lg,
alignItems: 'center',
justifyContent: 'center',
},
tabActive: {
backgroundColor: colors.surface,
borderWidth: 1,
borderColor: colors.outlineVariant,
},
tabText: {
fontSize: typography.caption.fontSize,
color: colors.onSurfaceVariant,
fontWeight: '800',
},
tabTextActive: {
color: colors.onSurface,
},
listContent: {
  paddingTop: spacing.lg,
  paddingBottom: spacing.giant,
  gap: spacing.md,
},
itemCard: {
borderRadius: radius.xl,
},
itemRow: {
flexDirection: 'row',
alignItems: 'flex-start',
gap: spacing.md,
},
itemIcon: {
width: 36,
height: 36,
borderRadius: radius.lg,
backgroundColor: colors.surfaceVariant,
borderWidth: 1,
borderColor: colors.outlineVariant,
alignItems: 'center',
justifyContent: 'center',
marginTop: 2,
},
itemMain: { flex: 1 },
itemLabel: {
fontSize: typography.body1.fontSize,
fontWeight: '900',
color: colors.onSurface,
},
itemAddress: {
marginTop: spacing.xs,
fontSize: typography.body2.fontSize,
color: colors.onSurfaceVariant,
},
itemNotes: {
marginTop: spacing.xs,
fontSize: typography.caption.fontSize,
color: colors.onSurfaceVariant,
},
deleteButton: {
width: 44,
height: 44,
borderRadius: radius.lg,
alignItems: 'center',
justifyContent: 'center',
},
empty: {
  paddingTop: spacing.huge,
  alignItems: 'center',
  paddingHorizontal: spacing.xl,
},
emptyIcon: {
width: 54,
height: 54,
borderRadius: radius.round,
backgroundColor: colors.surfaceVariant,
borderWidth: 1,
borderColor: colors.outlineVariant,
alignItems: 'center',
justifyContent: 'center',
},
emptyTitle: {
marginTop: spacing.lg,
fontSize: typography.subtitle1.fontSize,
fontWeight: '900',
color: colors.onSurface,
textAlign: 'center',
},
emptySubtitle: {
  marginTop: spacing.sm,
  fontSize: typography.body2.fontSize,
  color: colors.onSurfaceVariant,
  textAlign: 'center',
  lineHeight: 20,
},
bottomCtaWrap: {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: spacing.lg,
  alignItems: 'center',
},
bottomCta: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing.sm,
  minWidth: 220,
  paddingHorizontal: spacing.xl,
  height: 54,
  borderRadius: radius.xl,
  backgroundColor: colors.primary,
  borderWidth: 1,
  borderColor: colors.primary,
},
bottomCtaText: {
  color: colors.onPrimary,
  fontSize: typography.button.fontSize,
  fontWeight: '900',
},
});