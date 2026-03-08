// NewLoginScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Svg, Path } from 'react-native-svg';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { LoginSrv } from '../../services/LoginSrv';
import AccountSelectorModal from './SelectUserMode';
import ErrorPopupModal from '../PopUps/MessagePop';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ismServices } from '../../services/ismServices';
import BRAND from '../config';

const { width } = Dimensions.get('window');

// ─── Wave Divider ────────────────────────────────────────────────────────────
const Wave = () => (
  <View style={{ backgroundColor: 'transparent', height: 100 }}>
    <Svg
      height="100%"
      width="100%"
      viewBox={`0 0 ${width} 100`}
      preserveAspectRatio="none"
    >
      <Path
        d={`M0,40 C${width * 0.3},120 ${width * 0.6},-20 ${width},60 L${width},100 L0,100 Z`}
        fill="white"
      />
    </Svg>
  </View>
);

// ─── Email validator ──────────────────────────────────────────────────────────
const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

// ─── Component ───────────────────────────────────────────────────────────────
const NewLoginScreen = () => {
  const [email, setEmail] = useState('sahilmulanioneplus@gmail.com');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);

  const navigation = useNavigation();

  const [modalVisible, setModalVisible] = useState(false);
  const [accounts, setAccounts] = useState([]);

  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorTitle, setErrorTitle] = useState('Login Failed');

  const [isLoading, setIsLoading] = useState(false);

  // ─── Auto-login: restore existing session ──────────────────────────────────
  const getUserDetails = async () => {
    try {
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (!userInfo) return; // No session — stay on login screen

      // Validate stored session has required fields before navigating
      const parsed = JSON.parse(userInfo);
      if (!parsed?.token && !parsed?.id) return; // Stale or invalid session

      await ismServices.getUserDetails();

      const updatedUserInfo = await AsyncStorage.getItem('userInfo');
      if (!updatedUserInfo) return;

      const updatedParsed = JSON.parse(updatedUserInfo);
      if (!updatedParsed?.token && !updatedParsed?.id) return;

      // Valid session — navigate immediately, no artificial delay
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'MainApp' }],
        })
      );
    } catch (error) {
      // Session restore failed (expired token, network error, corrupted data)
      // Clear potentially bad data so user gets a clean login
      console.log('Session restore failed:', error);
      await AsyncStorage.removeItem('userInfo').catch(() => {});
    }
  };

  useEffect(() => {
    getUserDetails();
  }, []);

  // ─── Login ─────────────────────────────────────────────────────────────────
  const handleLogin = async (userid) => {
    setIsLoading(true);

    const payload = {
      identity: email.trim(),
      password: password,
      tenant: 0,
      user_id: userid?.user_id || null,
    };

    try {
      const response = await LoginSrv.login(payload);

      // Guard: null/undefined body means server sent something unexpected
      if (!response || !response.status) {
        setErrorTitle('Server Error');
        setErrorMessage('Received an unexpected response. Please try again.');
        setShowError(true);
        return;
      }

      if (response.status === 'multipleLogin') {
        // Multiple accounts found — let user pick one
        setAccounts(response.data);
        setModalVisible(true);

      } else if (response.status === 'error') {
        // Wrong password, invalid credentials, or any server-side rejection
        setErrorTitle('Login Failed');
        setErrorMessage(
          response.message || 'Incorrect email or password. Please try again.'
        );
        setShowError(true);

      } else if (response.status === 'success') {
        await AsyncStorage.setItem('userInfo', JSON.stringify(response.data));
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'MainApp' }],
          })
        );

      } else {
        // Fallback: unknown status — never silently fail
        console.warn('Unhandled login status:', response.status);
        setErrorTitle('Login Failed');
        setErrorMessage('Something went wrong. Please try again.');
        setShowError(true);
      }

    } catch (error) {
      console.error('Login failed:', error);
      setErrorTitle('Connection Error');
      setErrorMessage(
        'Unable to connect to server. Please check your internet connection and try again.'
      );
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Account selector (multipleLogin flow) ─────────────────────────────────
  const handleAccountSelect = (selectedUserId) => {
    setModalVisible(false);
    handleLogin(selectedUserId);
  };

  // ─── Validation ────────────────────────────────────────────────────────────
  const validateInputs = () => {
    if (!email.trim()) {
      setErrorTitle('Validation Error');
      setErrorMessage('Please enter your email address.');
      setShowError(true);
      return false;
    }

    if (!isValidEmail(email)) {
      setErrorTitle('Validation Error');
      setErrorMessage('Please enter a valid email address.');
      setShowError(true);
      return false;
    }

    if (!password.trim()) {
      setErrorTitle('Validation Error');
      setErrorMessage('Please enter your password.');
      setShowError(true);
      return false;
    }

    return true;
  };

  const handleLoginPress = () => {
    if (validateInputs()) {
      handleLogin();
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND.PRIMARY_COLOR} />

      {/* KeyboardAvoidingView wraps only the scrollable content */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>

            {/* ── Header ── */}
            <View style={styles.headerContainer}>
              <View style={styles.logoContainer}>
                <Image
                  source={BRAND.LOGO}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.welcomeMessage}>Welcome Back</Text>
              <Text style={styles.subWelcomeMessage}>
                Please sign in to continue
              </Text>
            </View>

            {/* ── Form ── */}
            <View style={styles.formContainer}>
              <Wave />
              <View style={styles.formInputsWrapper}>

                {/* Email */}
                <View style={styles.inputContainer}>
                  <View style={styles.icon}>
                    <Icon name="email" size={20} color="#9e9e9e" />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#9e9e9e"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>

                {/* Password */}
                <View style={styles.inputContainer}>
                  <View style={styles.icon}>
                    <Icon name="lock" size={20} color="#9e9e9e" />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#9e9e9e"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    editable={!isLoading}
                  />
                  {/* Show / hide password toggle */}
                  <TouchableOpacity
                    onPress={() => setShowPassword((prev) => !prev)}
                    style={styles.eyeIcon}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Icon
                      name={showPassword ? 'visibility' : 'visibility-off'}
                      size={20}
                      color="#9e9e9e"
                    />
                  </TouchableOpacity>
                </View>

                {/* OTP Login */}
                <TouchableOpacity
                  style={styles.forgotPasswordButton}
                  onPress={() => {
                    // TODO: implement OTP login navigation
                    setErrorTitle('Coming Soon');
                    setErrorMessage('OTP login will be available soon.');
                    setShowError(true);
                  }}
                >
                  <Text style={styles.forgotPasswordText}>OTP LOGIN</Text>
                </TouchableOpacity>

                {/* Sign In button */}
                <TouchableOpacity
                  onPress={handleLoginPress}
                  style={[
                    styles.loginButton,
                    isLoading && styles.loginButtonDisabled,
                  ]}
                  disabled={isLoading}
                >
                  <Text style={styles.loginButtonText}>
                    {isLoading ? 'Signing in...' : 'Sign in'}
                  </Text>
                </TouchableOpacity>

                {/* Sign Up */}
                <View style={styles.signUpContainer}>
                  <Text style={styles.signUpText}>Don't have an account? </Text>
                  <TouchableOpacity
                    onPress={() => {
                      // TODO: implement Sign Up navigation
                      setErrorTitle('Coming Soon');
                      setErrorMessage('Sign up will be available soon.');
                      setShowError(true);
                    }}
                  >
                    <Text style={styles.signUpLink}>Sign up</Text>
                  </TouchableOpacity>
                </View>

              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Modals ── */}
      <AccountSelectorModal
        visible={modalVisible}
        accounts={accounts}
        onSelect={handleAccountSelect}
        onClose={() => setModalVisible(false)}
      />

      <ErrorPopupModal
        visible={showError}
        onClose={() => setShowError(false)}
        title={errorTitle}
        message={errorMessage}
        type="error"
        buttonText="OK"
      />
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
    backgroundColor: BRAND.PRIMARY_COLOR,
  },

  scrollViewContent: {
    flexGrow: 1,
  },

  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: BRAND.PRIMARY_COLOR,
  },

  // ── Header ──
  headerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  logoContainer: {
    width: '60%',
    alignSelf: 'center',
    justifyContent: 'center',
  },

  logo: {
    width: 300,
    height: 60,
    alignSelf: 'center',
  },

  welcomeMessage: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },

  subWelcomeMessage: {
    fontSize: 16,
    color: '#E8F4FD',
    textAlign: 'center',
    opacity: 0.9,
    fontWeight: '400',
  },

  // ── Form ──
  formContainer: {},

  formInputsWrapper: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 25,
    paddingTop: 30,
    paddingBottom: 50,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 15,
    height: 60,
  },

  icon: {
    marginRight: 15,
  },

  eyeIcon: {
    paddingLeft: 10,
  },

  input: {
    flex: 1,
    height: 60,
    fontSize: 16,
    color: '#000',
  },

  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 25,
  },

  forgotPasswordText: {
    color: '#074B7C',
    fontSize: 14,
    fontWeight: '600',
  },

  loginButton: {
    backgroundColor: BRAND.COLORS.button,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    height: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  loginButtonDisabled: {
    backgroundColor: '#B0B0B0',
    elevation: 0,
    shadowOpacity: 0,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },

  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },

  signUpText: {
    fontSize: 14,
    color: '#9e9e9e',
  },

  signUpLink: {
    fontSize: 14,
    color: '#074B7C',
    fontWeight: 'bold',
  },
});

export default NewLoginScreen;