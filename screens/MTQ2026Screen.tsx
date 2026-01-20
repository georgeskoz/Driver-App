import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { colors, radius, spacing, typography } from '../lib/theme';
import { useTranslation } from '../lib/i18n';

export default function MTQ2026Screen({ navigation }: any) {
const { t } = useTranslation();

return (
<SafeAreaView style={styles.container} edges={['bottom']}>
<ScreenHeader title={t.mtq2026.title} onBack={() => navigation.goBack()} />

<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
<Card style={styles.heroCard}>
<View style={styles.heroIconCircle}>
<FontAwesome5 name="check-circle" size={22} color={colors.primary} />
</View>
<View style={{ flex: 1 }}>
<Text style={styles.heroTitle}>{t.mtq2026.subtitle}</Text>
<Text style={styles.heroBody}>{t.mtq2026.intro}</Text>
</View>
</Card>

{t.mtq2026.sections.map((section, sectionIndex) => (
<View key={`${sectionIndex}-${section.title}`} style={{ gap: spacing.sm }}>
<Text style={styles.sectionTitle}>{section.title}</Text>
{Boolean(section.description) && (
<Text style={styles.sectionDescription}>{section.description}</Text>
)}

<View style={{ gap: spacing.sm }}>
{section.bullets.map((bullet, bulletIndex) => (
<Card key={`${bulletIndex}-${bullet.title}`} style={styles.bulletCard}>
<View style={styles.bulletHeaderRow}>
<View style={styles.bulletDot} />
<Text style={styles.bulletTitle}>{bullet.title}</Text>
</View>
<Text style={styles.bulletBody}>{bullet.body}</Text>
</Card>
))}
</View>
</View>
))}

<Card style={styles.disclaimerCard}>
<View style={styles.disclaimerHeader}>
<FontAwesome5 name="info-circle" size={16} color={colors.onSurfaceVariant} />
<Text style={styles.disclaimerTitle}>{t.mtq2026.noteTitle}</Text>
</View>
<Text style={styles.disclaimerBody}>{t.mtq2026.noteBody}</Text>
</Card>
</ScrollView>
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
paddingBottom: spacing.giant,
gap: spacing.xl,
},
heroCard: {
borderRadius: radius.xl,
padding: spacing.lg,
flexDirection: 'row',
gap: spacing.md,
alignItems: 'flex-start',
},
heroIconCircle: {
width: 40,
height: 40,
borderRadius: radius.round,
backgroundColor: colors.surfaceVariant,
borderWidth: 1,
borderColor: colors.outlineVariant,
alignItems: 'center',
justifyContent: 'center',
},
heroTitle: {
fontSize: typography.subtitle1.fontSize,
fontWeight: '900',
color: colors.onSurface,
},
heroBody: {
marginTop: spacing.xs,
fontSize: typography.body2.fontSize,
lineHeight: 20,
color: colors.onSurfaceVariant,
},
sectionTitle: {
fontSize: typography.subtitle1.fontSize,
fontWeight: '900',
color: colors.onSurface,
},
sectionDescription: {
fontSize: typography.body2.fontSize,
lineHeight: 20,
color: colors.onSurfaceVariant,
},
bulletCard: {
borderRadius: radius.lg,
padding: spacing.lg,
},
bulletHeaderRow: {
flexDirection: 'row',
alignItems: 'center',
gap: spacing.sm,
},
bulletDot: {
width: 8,
height: 8,
borderRadius: 4,
backgroundColor: colors.primary,
},
bulletTitle: {
flex: 1,
fontSize: typography.subtitle2.fontSize,
fontWeight: '900',
color: colors.onSurface,
},
bulletBody: {
marginTop: spacing.sm,
fontSize: typography.body2.fontSize,
lineHeight: 20,
color: colors.onSurfaceVariant,
},
disclaimerCard: {
borderRadius: radius.xl,
padding: spacing.lg,
backgroundColor: colors.surfaceVariant,
},
disclaimerHeader: {
flexDirection: 'row',
alignItems: 'center',
gap: spacing.sm,
},
disclaimerTitle: {
fontSize: typography.subtitle2.fontSize,
fontWeight: '900',
color: colors.onSurface,
},
disclaimerBody: {
marginTop: spacing.sm,
fontSize: typography.body2.fontSize,
lineHeight: 20,
color: colors.onSurfaceVariant,
},
});
