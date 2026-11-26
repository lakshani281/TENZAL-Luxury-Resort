import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CreateAccountScreen({
  navigation,
  onSignUp,
  onSignInLink,
  onBack,
  isLoading = false,
  apiError = '',
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const busy = isLoading || submitting;
  const displayError = errorMessage || apiError;

  const handleSignUpPress = async () => {
    if (busy) return;
    setErrorMessage('');

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phoneNumber.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage('Please enter your full name (at least 2 characters).');
      return;
    }

    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!trimmedPhone) {
      setErrorMessage('Please enter your phone number.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter a password.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }

    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setErrorMessage('Password must include at least one uppercase letter and one number.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (onSignUp) {
      try {
        setSubmitting(true);
        await onSignUp({
          fullName: trimmedName,
          email: trimmedEmail,
          phoneNumber: trimmedPhone,
          password,
        });
      } catch (err) {
        setErrorMessage(err?.message || 'Unable to create account. Please try again.');
      } finally {
        setSubmitting(false);
      }
    } else if (navigation && navigation.navigate) {
      navigation.navigate('Summary');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Brand Header */}
          <View style={styles.brandHeader}>
            {onBack ? (
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.7}
                disabled={busy}
              >
                <Ionicons name="arrow-back" size={18} color="#183642" />
              </TouchableOpacity>
            ) : null}
            <Text style={styles.brandText}>TENZAL</Text>
          </View>

          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.joinTag}>JOIN US</Text>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>Save stays, orders and perfect days.</Text>
          </View>

          {/* Form Inputs */}
          <View style={styles.formContainer}>
            {/* Error Banner */}
            {displayError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color="#C53030" />
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            ) : null}

            {/* Full Name Input Box */}
            <View style={styles.inputBox}>
              <Text style={styles.inputLabel}>Full name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Your name"
                placeholderTextColor="#8C96A4"
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (errorMessage) setErrorMessage('');
                }}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            {/* Email Input Box */}
            <View style={styles.inputBox}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                placeholder="you@example.com"
                placeholderTextColor="#8C96A4"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errorMessage) setErrorMessage('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Phone Number Input Box */}
            <View style={styles.inputBox}>
              <Text style={styles.inputLabel}>Phone number</Text>
              <TextInput
                style={styles.textInput}
                placeholder="+94"
                placeholderTextColor="#8C96A4"
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(text);
                  if (errorMessage) setErrorMessage('');
                }}
                keyboardType="phone-pad"
              />
            </View>

            {/* Password Input Box */}
            <View style={styles.inputBox}>
              <View style={styles.passwordRow}>
                <View style={styles.passwordInputWrapper}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="At least 8 characters"
                    placeholderTextColor="#8C96A4"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errorMessage) setErrorMessage('');
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                </View>
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#718096"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input Box */}
            <View style={styles.inputBox}>
              <Text style={styles.inputLabel}>Confirm password</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Repeat password"
                placeholderTextColor="#8C96A4"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errorMessage) setErrorMessage('');
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[styles.signUpButton, busy && { opacity: 0.7 }]}
              activeOpacity={0.85}
              onPress={handleSignUpPress}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.signUpButtonText}>Sign up</Text>
              )}
            </TouchableOpacity>

            {/* Bottom Sign In Link */}
            <View style={styles.bottomRow}>
              <Text style={styles.bottomPromptText}>Already have an account? </Text>
              <TouchableOpacity activeOpacity={0.7} onPress={onSignInLink}>
                <Text style={styles.signInLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 40,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 34,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E2DC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  brandText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 3.5,
    color: '#183642',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  headerSection: {
    marginBottom: 24,
  },
  joinTag: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#357285',
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#183642',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
  },
  formContainer: {
    width: '100%',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FEB2B2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#C53030',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  inputBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E2DC',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    color: '#8C96A4',
    marginBottom: 4,
  },
  textInput: {
    fontSize: 15,
    color: '#1A202C',
    padding: 0,
    margin: 0,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passwordInputWrapper: {
    flex: 1,
  },
  eyeButton: {
    paddingLeft: 10,
    paddingVertical: 4,
  },
  signUpButton: {
    backgroundColor: '#357285',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomPromptText: {
    fontSize: 13,
    color: '#718096',
  },
  signInLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#357285',
  },
});