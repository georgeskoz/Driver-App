import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useMutation } from 'convex/react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '../components/ScreenHeader';
import { Input } from '../components/Input';
import { colors, radius, spacing, typography } from '../lib/theme';
import { useTranslation } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { api } from '../convex/_generated/api';

export default function AddSavedAddressScreen({ navigation, route }: any) {
const { t } = useTranslation();
const { session } = useAuth();
const addSavedAddress = useMutation(api.users.addSavedAddress);

const initialKind = route?.params?.kind === 'dropoff' ? 'dropoff' : 'pickup';
const [kind, setKind] = useState<'pickup' | 'dropoff'>(initialKind);
const [label, setLabel] = useState('');
const [address, setAddress] = useState('');
const [notes, setNotes] = useState('');
const [isSaving, setIsSaving] = useState(false);

const kindOptions = useMemo(
() => [
{ id: 'pickup', label: t.settings.pickup },
{ id: 'dropoff', label: t.settings.dropoff },
],
[t]
);

const canSave = label.trim().length > 0 && address.trim().length > 0 && !isSaving;

const handleSave = async () => {
if (!session?.userId) return;
setIsSaving(true);
try {
await addSavedAddress({
userId: session.userId as any,
kind,
label: label.trim(),
address: address.trim(),
notes: notes.trim().length ? notes.trim() : undefined,
// Lat/lng will be added once geocoding is integrated.
latitude: undefined,
longitude: undefined,
});
navigation.goBack();
} catch {
Alert.alert(t.common.error, t.settings.addAddressFailed);
} finally {
setIsSaving(false);
}
};

return (
<SafeAreaView style={styles.container} edges={['bottom']}>
<ScreenHeader title={t.settings.addAddress} onBack={() => navigation.goBack()} />

<KeyboardAvoidingView
style={styles.flex}
behavior={Platform.OS === 'ios' ? 'padding' : undefined}
keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
>
<ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
<View style={styles.kindRow}>
{kindOptions.map((opt) => {
const active = opt.id === kind;
return (
<TouchableOpacity
key={opt.id}
activeOpacity={0.85}
onPress={() => setKind(opt.id as any)}
style={[styles.kindPill, active && styles.kindPillActive]}
>
<Text style={[styles.kindPillText, active && styles.kindPillTextActive]}>{opt.label}</Text>
</TouchableOpacity>
);
})}
</View>

<Input label={t.settings.label} value={label} onChangeText={setLabel} placeholder={t.settings.labelPlaceholder} />
<View style={{ height: spacing.md }} />
<Input label={t.settings.address} value={address} onChangeText={setAddress} placeholder={t.settings.addressPlaceholder} />
<View style={{ height: spacing.md }} />
<Input
label={t.settings.notes}
value={notes}
onChangeText={setNotes}
placeholder={t.settings.notesPlaceholder}
multiline
/>

<TouchableOpacity
activeOpacity={0.85}
onPress={handleSave}
disabled={!canSave}
style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
>
<Text style={styles.saveButtonText}>{isSaving ? t.common.loading : t.common.save}</Text>
</TouchableOpacity>

<Text style={styles.hint}>{t.settings.addressGeocodingHint}</Text>
</ScrollView>
</KeyboardAvoidingView>
</SafeAreaView>
);
}

const styles = StyleSheet.create({
flex: { flex: 1 },
container: { flex: 1, backgroundColor: colors.background },
content: { padding: spacing.lg, paddingBottom: spacing.giant },
kindRow: {
flexDirection: 'row',
gap: spacing.sm,
marginBottom: spacing.lg,
},
kindPill: {
flex: 1,
paddingVertical: spacing.md,
borderRadius: radius.xl,
borderWidth: 1,
borderColor: colors.outlineVariant,
backgroundColor: colors.surface,
alignItems: 'center',
},
kindPillActive: {
backgroundColor: colors.primary,
borderColor: colors.primary,
},
kindPillText: {
fontSize: typography.caption.fontSize,
fontWeight: '900',
color: colors.onSurface,
},
kindPillTextActive: {
color: colors.onPrimary,
},
saveButton: {
marginTop: spacing.xl,
height: 54,
borderRadius: radius.xl,
backgroundColor: colors.primary,
alignItems: 'center',
justifyContent: 'center',
},
saveButtonDisabled: { opacity: 0.5 },
saveButtonText: {
color: colors.onPrimary,
fontSize: typography.button.fontSize,
fontWeight: '900',
},
hint: {
marginTop: spacing.md,
fontSize: typography.caption.fontSize,
color: colors.onSurfaceVariant,
textAlign: 'center',
lineHeight: 16,
},
});
