import React, { useMemo, useState } from 'react';
import {
Alert,
KeyboardAvoidingView,
Platform,
ScrollView,
StyleSheet,
Text,
TextInput,
View,
} from 'react-native';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import PrimaryButton from '../components/PrimaryButton';
import { useDriverAuth } from '../lib/auth';
import { colors, radius, spacing } from '../lib/theme';

export default function DriverLoginScreen() {
const { signIn } = useDriverAuth();

const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [isSubmitting, setIsSubmitting] = useState(false);

const login = useMutation(api.users.login);

const isValidEmail = useMemo(() => {
const trimmed = email.trim();
return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}, [email]);

const onSubmit = async () => {
if (!email.trim() || !isValidEmail) {
Alert.alert('Invalid email', 'Please enter a valid email address.');
return;
}
if (!password) {
Alert.alert('Password required', 'Please enter your password.');
return;
}

setIsSubmitting(true);
try {
const user = await login({ email, password });
const role = String((user as any)?.role ?? '');

if (role !== 'driver' && role !== 'admin') {
Alert.alert(
'Not a driver account',
'This is the Driver app. Please sign in with a driver account or use the TransPo Users app.'
);
return;
}

await signIn({
userId: String((user as any)?._id),
email: String((user as any)?.email),
firstName: String((user as any)?.firstName ?? ''),
lastName: String((user as any)?.lastName ?? ''),
phone: (user as any)?.phone ? String((user as any)?.phone) : undefined,
profileImage: (user as any)?.profileImage ? String((user as any)?.profileImage) : undefined,
role: role as any,
});
} catch {
Alert.alert('Login failed', 'Please check your details and try again.');
} finally {
setIsSubmitting(false);
}
};

return (
<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
<ScrollView
style={styles.container}
contentContainerStyle={styles.content}
keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
keyboardShouldPersistTaps="handled"
>
<View style={styles.header}>
<Text style={styles.title}>TransPo Drivers</Text>
<Text style={styles.subtitle}>Go online. Accept jobs. Get paid.</Text>
</View>

<View style={styles.card}>
<Text style={styles.label}>Email</Text>
<TextInput
value={email}
onChangeText={setEmail}
placeholder="driver@email.com"
placeholderTextColor={colors.onSurfaceVariant}
keyboardType="email-address"
autoCapitalize="none"
style={styles.input}
editable={!isSubmitting}
/>

<View style={{ height: spacing.md }} />

<Text style={styles.label}>Password</Text>
<TextInput
value={password}
onChangeText={setPassword}
placeholder="••••••••"
placeholderTextColor={colors.onSurfaceVariant}
secureTextEntry
style={styles.input}
editable={!isSubmitting}
/>

<View style={{ height: spacing.xl }} />

<PrimaryButton title="Sign in" onPress={onSubmit} isLoading={isSubmitting} />

<Text style={styles.footnote}>
By continuing, you agree to drive safely and follow local regulations.
</Text>
</View>
</ScrollView>
</KeyboardAvoidingView>
);
}

const styles = StyleSheet.create({
container: { flex: 1, backgroundColor: colors.background },
content: { padding: spacing.xl, paddingBottom: spacing.xxxl, flexGrow: 1, justifyContent: 'center' },
header: { marginBottom: spacing.xl },
title: { color: colors.onBackground, fontSize: 30, fontWeight: '900', letterSpacing: 0.2 },
subtitle: { color: colors.onSurfaceVariant, fontSize: 14, marginTop: spacing.sm, fontWeight: '600' },
card: {
backgroundColor: colors.surface,
borderRadius: radius.xl,
borderWidth: 1,
borderColor: colors.outlineVariant,
padding: spacing.xl,
},
label: { color: colors.onSurfaceVariant, fontSize: 12, fontWeight: '800', letterSpacing: 0.4 },
input: {
marginTop: spacing.sm,
backgroundColor: colors.surfaceVariant,
borderColor: colors.outlineVariant,
borderWidth: 1,
borderRadius: radius.md,
paddingHorizontal: spacing.lg,
paddingVertical: spacing.md,
fontSize: 16,
color: colors.onSurface,
},
footnote: {
marginTop: spacing.lg,
color: colors.onSurfaceVariant,
fontSize: 12,
lineHeight: 16,
},
});