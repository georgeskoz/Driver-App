import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation } from 'convex/react';

import { api } from '../convex/_generated/api';
import { useAuth } from '../lib/auth';
import { useTranslation } from '../lib/i18n';
import { colors, radius, spacing } from '../lib/theme';

type SignupFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  country: string;
  state: string;
  city: string;
  address: string;
};

export default function SignupScreen() {
  const { t, language, setLanguage } = useTranslation();
  const navigation = useNavigation();
  const { signIn } = useAuth();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SignupFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    country: '',
    state: '',
    city: '',
    address: '',
  });

  const handleFieldChange = (field: keyof SignupFormData) => (text: string) => {
    setFormData((prev: SignupFormData) => ({ ...prev, [field]: text }));
  };

  const signup = useMutation(api.users.signup);

  const validateForm = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Alert.alert(t.auth.allFieldsRequired);
      return false;
    }

    const email = formData.email.trim();
    if (!email) {
      Alert.alert(t.auth.invalidEmail);
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t.auth.invalidEmail);
      return false;
    }

    if (!formData.phone.trim()) {
      Alert.alert(t.auth.allFieldsRequired);
      return false;
    }

    if (!formData.password) {
      Alert.alert(t.auth.passwordRequired);
      return false;
    }

    if (formData.password.length < 8) {
      Alert.alert(t.auth.passwordMinLength);
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert(t.auth.passwordMismatch);
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const user = await signup({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        role: 'user',
        language: language as 'en' | 'fr',
        country: formData.country.trim() || undefined,
        state: formData.state.trim() || undefined,
        city: formData.city.trim() || undefined,
        address: formData.address.trim() || undefined,
      });

      // Sign in as the role returned by the backend.
      await signIn({
        userId: String(user._id),
        email: String(user.email),
        firstName: String(user.firstName),
        lastName: String(user.lastName),
        phone: String((user as any).phone ?? formData.phone.trim()),
        profileImage: (user as any).profileImage ? String((user as any).profileImage) : undefined,
        role: ((user as any).role as any) ?? 'user',
        language: (user.language as 'en' | 'fr') ?? (language as 'en' | 'fr'),
      });

      Alert.alert(t.auth.accountCreated);
      // AuthProvider will switch the app to the main tabs automatically.
    } catch (error: any) {
      Alert.alert(t.common.error, error?.message ?? 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const LanguageToggle = () => (
    <View style={styles.languageToggle}>
      <TouchableOpacity
        style={[styles.languageBtn, language === 'en' && styles.languageBtnActive]}
        onPress={() => setLanguage('en')}
        disabled={loading}
      >
        <Text
          style={[styles.languageBtnText, language === 'en' && styles.languageBtnTextActive]}
        >
          EN
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.languageBtn, language === 'fr' && styles.languageBtnActive]}
        onPress={() => setLanguage('fr')}
        disabled={loading}
      >
        <Text
          style={[styles.languageBtnText, language === 'fr' && styles.languageBtnTextActive]}
        >
          FR
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <LanguageToggle />

        <View style={styles.header}>
          <Text style={styles.title}>TransPo</Text>
          <Text style={styles.subtitle}>{t.auth.signup}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.auth.firstName}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.auth.firstName}
              placeholderTextColor={colors.onSurfaceVariant}
              value={formData.firstName}
              onChangeText={handleFieldChange('firstName')}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.auth.lastName}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.auth.lastName}
              placeholderTextColor={colors.onSurfaceVariant}
              value={formData.lastName}
              onChangeText={handleFieldChange('lastName')}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.auth.email}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.auth.email}
              placeholderTextColor={colors.onSurfaceVariant}
              value={formData.email}
              onChangeText={handleFieldChange('email')}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.auth.phone}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.auth.phone}
              placeholderTextColor={colors.onSurfaceVariant}
              value={formData.phone}
              onChangeText={handleFieldChange('phone')}
              keyboardType="phone-pad"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.auth.password}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.auth.password}
              placeholderTextColor={colors.onSurfaceVariant}
              value={formData.password}
              onChangeText={handleFieldChange('password')}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.auth.confirmPassword}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.auth.confirmPassword}
              placeholderTextColor={colors.onSurfaceVariant}
              value={formData.confirmPassword}
              onChangeText={handleFieldChange('confirmPassword')}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <Text style={styles.optionalTitle}>{t.auth.optional}</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.auth.country}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.auth.country}
              placeholderTextColor={colors.onSurfaceVariant}
              value={formData.country}
              onChangeText={handleFieldChange('country')}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.auth.state}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.auth.state}
              placeholderTextColor={colors.onSurfaceVariant}
              value={formData.state}
              onChangeText={handleFieldChange('state')}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.auth.city}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.auth.city}
              placeholderTextColor={colors.onSurfaceVariant}
              value={formData.city}
              onChangeText={handleFieldChange('city')}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.auth.address}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.auth.address}
              placeholderTextColor={colors.onSurfaceVariant}
              value={formData.address}
              onChangeText={handleFieldChange('address')}
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.primaryButtonText}>{t.auth.signUp}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.bottomRow}>
            <Text style={styles.bottomRowText}>{t.auth.accountExists} </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login' as never)}
              disabled={loading}
            >
              <Text style={styles.bottomRowLink}>{t.auth.signIn}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.giant,
  },
  languageToggle: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
    justifyContent: 'flex-end',
  },
  header: {
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.onBackground,
  },
  form: {
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onBackground,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.onBackground,
    backgroundColor: colors.surface,
  },
  optionalTitle: {
    marginTop: spacing.sm,
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  bottomRowText: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  bottomRowLink: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.secondary,
  },
});