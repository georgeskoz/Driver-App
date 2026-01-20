import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { colors, radius, spacing, typography } from '../lib/theme';
import { useTranslation } from '../lib/i18n';

function ServiceCard({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
return (
<Card style={styles.serviceCard}>
<View style={styles.serviceIcon}>
<FontAwesome5 name={icon as any} size={18} color={colors.primary} />
</View>
<View style={{ flex: 1 }}>
<Text style={styles.serviceTitle}>{title}</Text>
<Text style={styles.serviceSubtitle}>{subtitle}</Text>
</View>
</Card>
);
}

export default function AboutScreen({ navigation }: any) {
const { t } = useTranslation();

return (
<SafeAreaView style={styles.container} edges={['bottom']}>
<ScreenHeader title={t.settings.about} onBack={() => navigation.goBack()} />

<View style={styles.content}>
<TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('MTQ2026')}>
<Card style={styles.mtqCard}>
<View style={styles.mtqIcon}>
<FontAwesome5 name="check" size={18} color={colors.primary} />
</View>
<View style={{ flex: 1 }}>
<Text style={styles.mtqTitle}>{t.mtq2026.badgeTitle}</Text>
<Text style={styles.mtqSubtitle}>{t.mtq2026.badgeSubtitle}</Text>
</View>
<FontAwesome5 name="chevron-right" size={16} color={colors.onSurfaceVariant} />
</Card>
</TouchableOpacity>

<View style={styles.brandRow}>
<View style={styles.logoCircle}>
<Text style={styles.logoText}>T</Text>
</View>
<View style={{ flex: 1 }}>
<Text style={styles.brandTitle}>TransPo</Text>
<Text style={styles.brandSubtitle}>{t.settings.aboutTagline}</Text>
</View>
</View>

<Text style={styles.sectionLabel}>{t.settings.aboutServices}</Text>

<ServiceCard icon="car" title={t.settings.aboutTaxiTitle} subtitle={t.settings.aboutTaxiDesc} />
<ServiceCard icon="box" title={t.settings.aboutCourierTitle} subtitle={t.settings.aboutCourierDesc} />
<ServiceCard icon="utensils" title={t.settings.aboutFoodTitle} subtitle={t.settings.aboutFoodDesc} />

<Card style={styles.footerCard}>
<Text style={styles.footerTitle}>{t.settings.aboutSupportTitle}</Text>
<Text style={styles.footerSubtitle}>{t.settings.aboutSupportDesc}</Text>
</Card>
</View>
</SafeAreaView>
);
}

const styles = StyleSheet.create({
container: { flex: 1, backgroundColor: colors.background },
content: {
padding: spacing.lg,
gap: spacing.md,
},
brandRow: {
flexDirection: 'row',
alignItems: 'center',
gap: spacing.md,
marginBottom: spacing.sm,
},
logoCircle: {
width: 54,
height: 54,
borderRadius: radius.round,
backgroundColor: colors.primary,
alignItems: 'center',
justifyContent: 'center',
},
logoText: {
color: colors.onPrimary,
fontWeight: '900',
fontSize: 22,
},
brandTitle: {
fontSize: typography.h2.fontSize,
fontWeight: '900',
color: colors.onSurface,
},
brandSubtitle: {
marginTop: spacing.xs,
fontSize: typography.body2.fontSize,
color: colors.onSurfaceVariant,
},
sectionLabel: {
marginTop: spacing.md,
fontSize: typography.caption.fontSize,
fontWeight: '900',
textTransform: 'uppercase',
letterSpacing: 0.8,
color: colors.onSurfaceVariant,
},
serviceCard: {
borderRadius: radius.xl,
padding: spacing.lg,
flexDirection: 'row',
alignItems: 'center',
gap: spacing.md,
},
serviceIcon: {
width: 42,
height: 42,
borderRadius: radius.lg,
backgroundColor: colors.surfaceVariant,
borderWidth: 1,
borderColor: colors.outlineVariant,
alignItems: 'center',
justifyContent: 'center',
},
serviceTitle: {
fontSize: typography.subtitle2.fontSize,
fontWeight: '900',
color: colors.onSurface,
},
serviceSubtitle: {
marginTop: spacing.xs,
fontSize: typography.body2.fontSize,
color: colors.onSurfaceVariant,
},
footerCard: {
borderRadius: radius.xl,
padding: spacing.lg,
marginTop: spacing.md,
},
footerTitle: {
fontSize: typography.subtitle2.fontSize,
fontWeight: '900',
color: colors.onSurface,
},
footerSubtitle: {
marginTop: spacing.xs,
fontSize: typography.body2.fontSize,
color: colors.onSurfaceVariant,
},
mtqCard: {
borderRadius: radius.xl,
padding: spacing.lg,
flexDirection: 'row',
alignItems: 'center',
gap: spacing.md,
},
mtqIcon: {
width: 42,
height: 42,
borderRadius: radius.lg,
backgroundColor: colors.surfaceVariant,
borderWidth: 1,
borderColor: colors.outlineVariant,
alignItems: 'center',
justifyContent: 'center',
},
mtqTitle: {
fontSize: typography.subtitle2.fontSize,
fontWeight: '900',
color: colors.onSurface,
},
mtqSubtitle: {
marginTop: spacing.xs,
fontSize: typography.body2.fontSize,
color: colors.onSurfaceVariant,
},
});