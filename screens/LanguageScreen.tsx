import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from 'convex/react';

import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { colors, radius, spacing, typography } from '../lib/theme';
import { useTranslation } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { api } from '../convex/_generated/api';

export default function LanguageScreen({ navigation }: any) {
const { t, language, setLanguage } = useTranslation();
const { session, updateSession } = useAuth();
const updateLanguage = useMutation(api.users.updateLanguage);

const set = async (next: 'en' | 'fr') => {
try {
setLanguage(next);
if (session?.userId) {
await updateLanguage({ userId: session.userId as any, language: next });
}
await updateSession({ language: next });
} catch {
Alert.alert(t.common.error, t.settings.languageSaveFailed);
}
};

return (
<SafeAreaView style={styles.container} edges={['bottom']}>
<ScreenHeader title={t.settings.language} onBack={() => navigation.goBack()} />

<View style={styles.content}>
<Card style={styles.card}>
<TouchableOpacity
activeOpacity={0.8}
onPress={() => set('en')}
style={[styles.row, language === 'en' && styles.rowActive]}
>
<Text style={styles.rowTitle}>{t.auth.english}</Text>
{language === 'en' ? <FontAwesome5 name="check" size={16} color={colors.primary} /> : null}
</TouchableOpacity>

<View style={styles.divider} />

<TouchableOpacity
activeOpacity={0.8}
onPress={() => set('fr')}
style={[styles.row, language === 'fr' && styles.rowActive]}
>
<Text style={styles.rowTitle}>{t.auth.french}</Text>
{language === 'fr' ? <FontAwesome5 name="check" size={16} color={colors.primary} /> : null}
</TouchableOpacity>
</Card>

<Text style={styles.hint}>{t.settings.languageHint}</Text>
</View>
</SafeAreaView>
);
}

const styles = StyleSheet.create({
container: { flex: 1, backgroundColor: colors.background },
content: { padding: spacing.lg, gap: spacing.md },
card: { borderRadius: radius.xl, overflow: 'hidden' },
row: {
padding: spacing.lg,
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'space-between',
backgroundColor: colors.surface,
},
rowActive: {
backgroundColor: colors.surfaceVariant,
},
rowTitle: { fontSize: typography.body1.fontSize, fontWeight: '900', color: colors.onSurface },
divider: { height: 1, backgroundColor: colors.outlineVariant },
hint: {
marginTop: spacing.sm,
fontSize: typography.caption.fontSize,
color: colors.onSurfaceVariant,
textAlign: 'center',
},
});
