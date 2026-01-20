import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useMutation, useQuery } from 'convex/react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { Input } from '../components/Input';
import { colors, radius, shadows, spacing, typography } from '../lib/theme';
import { useTranslation } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { api } from '../convex/_generated/api';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfileScreen({ navigation }: any) {
const { t } = useTranslation();
const { session, updateSession } = useAuth();

const userId = session?.userId as any;
const profile = useQuery(api.users.getUserProfile, session?.userId ? { userId } : ('skip' as any));
const updateProfile = useMutation(api.users.updateUserProfileById);
const generateUploadUrl = useMutation(api.users.generateProfileImageUploadUrl);
const setProfileImageFromUpload = useMutation(api.users.setUserProfileImageFromUpload);
const removeProfileImage = useMutation(api.users.removeUserProfileImage);

// IMPORTANT: Convex queries hydrate async. We initialize empty and then fill once when profile arrives.
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');
const [phone, setPhone] = useState('');
const [profileImage, setProfileImage] = useState('');
const [isSaving, setIsSaving] = useState(false);
const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

const hasHydratedRef = React.useRef(false);
React.useEffect(() => {
  // Only hydrate the form once per mount, otherwise typing could get overwritten by query refreshes.
  if (hasHydratedRef.current) return;
  if (!session?.userId) return;
  if (!profile) return;

  setFirstName(profile.firstName ?? session?.firstName ?? '');
  setLastName(profile.lastName ?? session?.lastName ?? '');
  setPhone(profile.phone ?? '');
  setProfileImage((profile.profileImage ?? '') as string);
  setAvatarLoadFailed(false);
  hasHydratedRef.current = true;
}, [profile, session?.firstName, session?.lastName, session?.userId]);

const initials = useMemo(() => {
const a = (firstName || session?.firstName || '').trim().slice(0, 1).toUpperCase();
const b = (lastName || session?.lastName || '').trim().slice(0, 1).toUpperCase();
return `${a}${b}` || 'U';
}, [firstName, lastName, session?.firstName, session?.lastName]);

const canSave = firstName.trim().length > 0 && lastName.trim().length > 0 && !isSaving;

const handleSave = async () => {
if (!session?.userId) return;

setIsSaving(true);
try {
const updated = await updateProfile({
userId,
firstName: firstName.trim(),
lastName: lastName.trim(),
phone: phone.trim(),
});

await updateSession({
firstName: updated.firstName,
lastName: updated.lastName,
phone: updated.phone,
});

navigation.goBack();
} catch {
Alert.alert(t.common.error, t.settings.profileSaveFailed);
} finally {
setIsSaving(false);
}
};

const uploadPickedImageAsync = async (localUri: string, mimeType?: string) => {
  if (!session?.userId) return;

  setIsUploadingPhoto(true);
  try {
    const uploadUrl = await generateUploadUrl({ userId });

    // Expo: `fetch(file://...)` returns a blob.
    const fileResponse = await fetch(localUri);
    const blob = await fileResponse.blob();

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': mimeType ?? (blob.type || 'image/jpeg'),
      },
      body: blob,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.status}`);
    }

    const { storageId } = (await uploadResponse.json()) as { storageId: string };
    const result = await setProfileImageFromUpload({ userId, storageId: storageId as any });

    const nextProfileImage = result?.profileImage ? String(result.profileImage) : '';
    setProfileImage(nextProfileImage);
    setAvatarLoadFailed(false);
    await updateSession({ profileImage: nextProfileImage || undefined });
  } catch {
    Alert.alert(t.common.error, t.settings.profilePhotoUploadFailed);
  } finally {
    setIsUploadingPhoto(false);
  }
};

const handleChooseFromLibrary = async () => {
  try {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t.common.error, t.settings.profilePhotoLibraryPermissionDenied);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.75,
    });

    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    await uploadPickedImageAsync(asset.uri, (asset as any).mimeType);
  } catch {
    Alert.alert(t.common.error, t.settings.profilePhotoUploadUnavailable);
  }
};

const handleTakePhoto = async () => {
  try {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t.common.error, t.settings.profilePhotoCameraPermissionDenied);
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.75,
    });

    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    await uploadPickedImageAsync(asset.uri, (asset as any).mimeType);
  } catch {
    Alert.alert(t.common.error, t.settings.profilePhotoUploadUnavailable);
  }
};

const handleRemovePhoto = async () => {
  if (!session?.userId) return;

  setIsUploadingPhoto(true);
  try {
    await removeProfileImage({ userId });
    setProfileImage('');
    setAvatarLoadFailed(false);
    await updateSession({ profileImage: undefined });
  } catch {
    Alert.alert(t.common.error, t.settings.profilePhotoUploadFailed);
  } finally {
    setIsUploadingPhoto(false);
  }
};

return (
<SafeAreaView style={styles.container} edges={['bottom']}>
<ScreenHeader title={t.settings.profile} onBack={() => navigation.goBack()} />

<KeyboardAvoidingView
style={styles.flex}
behavior={Platform.OS === 'ios' ? 'padding' : undefined}
keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
>
<ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
<View style={styles.heroCard}>
<View style={styles.avatar}>
  {profileImage.trim().length > 0 && !avatarLoadFailed ? (
    <Image
      source={{ uri: profileImage.trim() }}
      style={styles.avatarImage}
      onError={() => setAvatarLoadFailed(true)}
    />
  ) : (
    <Text style={styles.avatarText}>{initials}</Text>
  )}

  {isUploadingPhoto && (
    <View style={styles.avatarUploadingOverlay}>
      <ActivityIndicator color={colors.onPrimary} />
    </View>
  )}
</View>
<View style={styles.heroText}>
<Text style={styles.heroTitle}>{t.settings.profileDetailsTitle}</Text>
<Text style={styles.heroSubtitle}>{session?.email ?? '—'}</Text>
</View>
</View>

<View style={styles.photoActionsRow}>
  <TouchableOpacity
    activeOpacity={0.85}
    style={styles.photoActionButton}
    onPress={handleTakePhoto}
    disabled={isUploadingPhoto}
  >
    <FontAwesome5 name="camera" size={14} color={colors.onSurface} />
    <Text style={styles.photoActionText}>{t.settings.profilePhotoTakePhoto}</Text>
  </TouchableOpacity>
  <TouchableOpacity
    activeOpacity={0.85}
    style={styles.photoActionButton}
    onPress={handleChooseFromLibrary}
    disabled={isUploadingPhoto}
  >
    <FontAwesome5 name="images" size={14} color={colors.onSurface} />
    <Text style={styles.photoActionText}>{t.settings.profilePhotoChoosePhoto}</Text>
  </TouchableOpacity>
  {profileImage.trim().length > 0 && (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.photoActionButton, styles.photoActionDanger]}
      onPress={handleRemovePhoto}
      disabled={isUploadingPhoto}
    >
      <FontAwesome5 name="trash" size={14} color={colors.error} />
      <Text style={[styles.photoActionText, styles.photoActionDangerText]}>{t.settings.profilePhotoRemove}</Text>
    </TouchableOpacity>
  )}
</View>

<View style={styles.section}>
<Text style={styles.sectionLabel}>{t.settings.userInfo}</Text>

<Input label={t.auth.firstName} value={firstName} onChangeText={setFirstName} />
<View style={{ height: spacing.md }} />
<Input label={t.auth.lastName} value={lastName} onChangeText={setLastName} />
<View style={{ height: spacing.md }} />
<Input label={t.auth.phone} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

</View>

<TouchableOpacity
activeOpacity={0.8}
style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
disabled={!canSave}
onPress={handleSave}
>
<Text style={styles.saveButtonText}>{isSaving ? t.common.loading : t.common.save}</Text>
</TouchableOpacity>
</ScrollView>
</KeyboardAvoidingView>
</SafeAreaView>
);
}

const styles = StyleSheet.create({
flex: { flex: 1 },
container: {
flex: 1,
backgroundColor: colors.background,
},
content: {
padding: spacing.lg,
paddingBottom: spacing.giant,
},
heroCard: {
flexDirection: 'row',
gap: spacing.md,
alignItems: 'center',
padding: spacing.lg,
backgroundColor: colors.surface,
borderWidth: 1,
borderColor: colors.outlineVariant,
borderRadius: radius.xl,
...shadows.sm,
},
avatar: {
width: 54,
height: 54,
borderRadius: radius.round,
backgroundColor: colors.surfaceVariant,
borderWidth: 1,
borderColor: colors.outlineVariant,
alignItems: 'center',
justifyContent: 'center',
overflow: 'hidden',
},
avatarImage: {
width: '100%',
height: '100%',
},
avatarText: {
fontSize: 18,
fontWeight: '900',
color: colors.onSurface,
},
avatarUploadingOverlay: {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  backgroundColor: 'rgba(0,0,0,0.45)',
  alignItems: 'center',
  justifyContent: 'center',
},
heroText: { flex: 1 },
heroTitle: {
fontSize: typography.subtitle1.fontSize,
fontWeight: '900',
color: colors.onSurface,
},
heroSubtitle: {
marginTop: spacing.xs,
fontSize: typography.caption.fontSize,
color: colors.onSurfaceVariant,
},
photoActionsRow: {
  marginTop: spacing.md,
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: spacing.sm,
},
photoActionButton: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.sm,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  borderRadius: radius.lg,
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.outlineVariant,
},
photoActionText: {
  fontSize: typography.caption.fontSize,
  fontWeight: '800',
  color: colors.onSurface,
},
photoActionDanger: {
  borderColor: 'rgba(220, 38, 38, 0.25)',
  backgroundColor: 'rgba(220, 38, 38, 0.06)',
},
photoActionDangerText: {
  color: colors.error,
},
section: {
marginTop: spacing.xl,
padding: spacing.lg,
backgroundColor: colors.surface,
borderWidth: 1,
borderColor: colors.outlineVariant,
borderRadius: radius.xl,
},
sectionLabel: {
marginBottom: spacing.md,
fontSize: typography.caption.fontSize,
fontWeight: '800',
color: colors.onSurfaceVariant,
textTransform: 'uppercase',
letterSpacing: 0.8,
},
saveButton: {
marginTop: spacing.xl,
height: 54,
borderRadius: radius.xl,
backgroundColor: colors.primary,
alignItems: 'center',
justifyContent: 'center',
},
saveButtonDisabled: {
opacity: 0.5,
},
saveButtonText: {
fontSize: typography.button.fontSize,
fontWeight: '900',
color: colors.onPrimary,
},
});