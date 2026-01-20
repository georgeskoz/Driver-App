import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useMutation } from 'convex/react';

import { api } from '../convex/_generated/api';
import { useAuth } from '../lib/auth';
import { colors, spacing, typography } from '../lib/theme';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

function parseDateToMs(value: string) {
// Accepts YYYY-MM-DD
const trimmed = value.trim();
const parts = trimmed.split('-');
if (parts.length !== 3) return null;

const year = Number(parts[0]);
const month = Number(parts[1]);
const day = Number(parts[2]);

if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;

const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
const ms = date.getTime();
if (Number.isNaN(ms)) return null;
return ms;
}

export default function DriverOnboardingScreen() {
const navigation = useNavigation();
const { session, updateSession } = useAuth();

const [licenseNumber, setLicenseNumber] = useState('');
const [licenseExpiry, setLicenseExpiry] = useState('');
const [licensePlate, setLicensePlate] = useState('');
const [vehicleType, setVehicleType] = useState<'sedan' | 'suv' | 'van' | 'truck' | 'motorcycle'>('sedan');
const [vehicleMake, setVehicleMake] = useState('');
const [vehicleModel, setVehicleModel] = useState('');
const [vehicleYear, setVehicleYear] = useState('');
const [vehicleColor, setVehicleColor] = useState('');

const [isSaving, setIsSaving] = useState(false);

const bootstrapMakeUserDriver = useMutation(api.users.bootstrapMakeUserDriver);
const createOrUpdateMyDriverProfile = useMutation(api.drivers.createOrUpdateMyDriverProfile);

const isDriverRole = session?.role === 'driver' || session?.role === 'admin';

const handleBecomeDriver = async () => {
  if (!session?.userId) {
    Alert.alert('Not signed in', 'Please sign in again.');
    return;
  }

  try {
    setIsSaving(true);
    await bootstrapMakeUserDriver({ userId: session.userId as any } as any);
    await updateSession({ role: 'driver' });
  } catch (e: any) {
    Alert.alert('Could not enable driver mode', e?.message ?? 'Please try again.');
  } finally {
    setIsSaving(false);
  }
};

const canSave = useMemo(() => {
return Boolean(licenseNumber.trim() && licensePlate.trim() && licenseExpiry.trim());
}, [licenseExpiry, licenseNumber, licensePlate]);

const handleSave = async () => {
if (!session?.userId) {
Alert.alert('Not signed in', 'Please sign in again.');
return;
}

const expiryMs = parseDateToMs(licenseExpiry);
if (!expiryMs) {
Alert.alert('Invalid expiry date', 'Use the format YYYY-MM-DD.');
return;
}

const yearNumber = vehicleYear.trim() ? Number(vehicleYear.trim()) : undefined;
if (vehicleYear.trim() && (!Number.isFinite(yearNumber) || yearNumber! < 1990 || yearNumber! > 2100)) {
Alert.alert('Invalid vehicle year', 'Enter a year like 2020.');
return;
}

try {
setIsSaving(true);
await createOrUpdateMyDriverProfile({
userId: session.userId as any,
licenseNumber: licenseNumber.trim(),
licenseExpiry: expiryMs,
licensePlate: licensePlate.trim(),
vehicleType,
vehicleMake: vehicleMake.trim() || undefined,
vehicleModel: vehicleModel.trim() || undefined,
vehicleYear: yearNumber,
vehicleColor: vehicleColor.trim() || undefined,
} as any);

navigation.goBack();
} catch (e: any) {
Alert.alert('Could not save', e?.message ?? 'Please try again.');
} finally {
setIsSaving(false);
}
};

const vehicleOptions: Array<{ id: typeof vehicleType; label: string }> = [
{ id: 'sedan', label: 'Sedan' },
{ id: 'suv', label: 'SUV' },
{ id: 'van', label: 'Van' },
{ id: 'truck', label: 'Truck' },
{ id: 'motorcycle', label: 'Motorcycle' },
];

return (
<SafeAreaView style={styles.container} edges={['top', 'bottom']}>
<ScreenHeader title="Driver setup" />

<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
<ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
<Card>
<Text style={styles.h1}>Your driver info</Text>
<Text style={styles.muted}>
This information is needed before you can receive trips.
</Text>

{!isDriverRole ? (
  <View style={{ marginTop: spacing.lg }}>
    <Card style={{ backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant }}>
      <Text style={[styles.h1, { fontSize: 18 }]}>Driver account required</Text>
      <Text style={[styles.muted, { marginTop: 6 }]}>This account is currently a rider account. For testing, you can promote the very first driver account.</Text>
      <Button
        title="Become a driver (testing)"
        onPress={handleBecomeDriver}
        loading={isSaving}
        style={{ marginTop: spacing.md }}
      />
    </Card>
  </View>
) : null}

<View style={{ height: spacing.lg }} />

<Input label="License number" value={licenseNumber} onChangeText={setLicenseNumber} />
<Input
label="License expiry"
placeholder="YYYY-MM-DD"
value={licenseExpiry}
onChangeText={setLicenseExpiry}
/>

<Input label="License plate" value={licensePlate} onChangeText={setLicensePlate} />

<View style={{ height: spacing.md }} />

<Text style={styles.sectionLabel}>Vehicle type</Text>
<View style={styles.chipRow}>
{vehicleOptions.map((opt) => {
const selected = opt.id === vehicleType;
return (
<Button
key={opt.id}
title={opt.label}
variant={selected ? 'primary' : 'outline'}
size="sm"
onPress={() => setVehicleType(opt.id)}
style={styles.chipButton}
/>
);
})}
</View>

<View style={{ height: spacing.md }} />

<Input label="Vehicle make (optional)" value={vehicleMake} onChangeText={setVehicleMake} />
<Input label="Vehicle model (optional)" value={vehicleModel} onChangeText={setVehicleModel} />
<Input label="Vehicle year (optional)" value={vehicleYear} onChangeText={setVehicleYear} keyboardType="number-pad" />
<Input label="Vehicle color (optional)" value={vehicleColor} onChangeText={setVehicleColor} />

<View style={{ height: spacing.lg }} />

<Button title="Save" onPress={handleSave} disabled={!canSave || !isDriverRole} loading={isSaving} />
</Card>
</ScrollView>
</KeyboardAvoidingView>
</SafeAreaView>
);
}

const styles = StyleSheet.create({
container: {
flex: 1,
backgroundColor: colors.background,
},
content: {
paddingHorizontal: spacing.lg,
paddingTop: spacing.md,
paddingBottom: spacing.xl,
},
h1: {
...typography.h2,
color: colors.onSurface,
},
muted: {
...typography.body,
color: colors.onSurfaceVariant,
lineHeight: 20,
marginTop: 6,
},
sectionLabel: {
...typography.caption,
color: colors.onSurfaceVariant,
textTransform: 'uppercase',
letterSpacing: 0.6,
marginBottom: spacing.sm,
},
chipRow: {
flexDirection: 'row',
flexWrap: 'wrap',
gap: spacing.sm,
},
chipButton: {
marginRight: 0,
},
});
