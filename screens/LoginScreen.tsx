import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from '../lib/i18n';
import { colors, spacing, radius } from '../lib/theme';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { useAuthActions } from '../lib/auth';

export default function LoginScreen() {
  const { t, language, setLanguage } = useTranslation();
  const navigation = useNavigation();
  const { signIn } = useAuthActions();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = useMutation(api.users.login);

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert(t.auth.invalidEmail);
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t.auth.invalidEmail);
      return false;
    }
    if (!password) {
      Alert.alert(t.auth.passwordRequired);
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const user = await login({ email, password });

      if ((user as any)?.role === 'driver') {
        Alert.alert(
          'Driver account detected',
          'You are signing in as a driver. In Preview, driver mode will open inside this same app.'
        );
      }

      const serverLanguage = user?.language === 'fr' ? 'fr' : 'en';
      setLanguage(serverLanguage);

      await signIn({
        userId: String(user._id),
        email: String(user.email),
        firstName: String(user.firstName),
        lastName: String(user.lastName),
        phone: String((user as any).phone ?? ''),
        profileImage: (user as any).profileImage ? String((user as any).profileImage) : undefined,
        role: (user.role as any) ?? 'user',
        language: serverLanguage,
      });

      Alert.alert(t.common.success, t.auth.signingIn);
      // AuthProvider will switch the app to the main tabs automatically.
    } catch (error: any) {
      Alert.alert(t.common.error, t.auth.loginFailed);
    } finally {
      setLoading(false);
    }
  };

  const LanguageToggle = () => (
    <View style={styles.languageToggle}>
      <TouchableOpacity
        style={[
          styles.languageBtn,
          language === 'en' && styles.languageBtnActive,
        ]}
        onPress={() => setLanguage('en')}
        disabled={loading}
      >
        <Text
          style={[
            styles.languageBtnText,
            language === 'en' && styles.languageBtnTextActive,
          ]}
        >
          EN
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.languageBtn,
          language === 'fr' && styles.languageBtnActive,
        ]}
        onPress={() => setLanguage('fr')}
        disabled={loading}
      >
        <Text
          style={[
            styles.languageBtnText,
            language === 'fr' && styles.languageBtnTextActive,
          ]}
        >
          FR
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <LanguageToggle />

        <View style={styles.header}>
          <Text style={styles.title}>TransPo</Text>
          <Text style={styles.subtitle}>{t.auth.login}</Text>
        </View>

        <View style={styles.form}>
          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.auth.email}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.auth.email}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
              placeholderTextColor={colors.onSurfaceVariant}
            />
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <View style={styles.passwordHeader}>
              <Text style={styles.label}>{t.auth.password}</Text>
              <TouchableOpacity
                onPress={() => Alert.alert('Coming soon')}
                disabled={loading}
              >
                <Text style={styles.forgotPassword}>
                  {t.auth.forgotPassword}
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder={t.auth.password}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
              placeholderTextColor={colors.onSurfaceVariant}
            />
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.loginBtnText}>{t.auth.signIn}</Text>
            )}
          </TouchableOpacity>

          {/* Signup Link */}
          <View style={styles.signupLink}>
            <Text style={styles.signupLinkText}>{t.auth.noAccount} </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Signup' as never)}
              disabled={loading}
            >
              <Text style={styles.signupLinkButton}>{t.auth.signUp}</Text>
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
    paddingBottom: spacing.huge,
    justifyContent: 'center',
    minHeight: '100%',
  },
  languageToggle: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
    justifyContent: 'flex-end',
  },
  languageBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.outline,
    backgroundColor: colors.surface,
  },
  languageBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  languageBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onBackground,
  },
  languageBtnTextActive: {
    color: colors.onPrimary,
  },
  header: {
    marginBottom: spacing.xxxl,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.onSurfaceVariant,
  },
  form: {
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.sm,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.onBackground,
  },
  forgotPassword: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.secondary,
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
  loginBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  signupLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  signupLinkText: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  signupLinkButton: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
  },
});