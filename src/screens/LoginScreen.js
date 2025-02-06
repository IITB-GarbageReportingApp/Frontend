import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Text,
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userType, setUserType] = useState('user');

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (userToken) {
        navigation.replace('Home');
      }
    } catch (error) {
      console.error('Error checking login status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      if (!email || !password) {
        Alert.alert('Error', 'Please enter both email and password');
        return;
      }

      const response = await axios.post('http://192.168.227.240:8000/api/login/', {
        email,
        password,
        user_type: userType
      });

      await AsyncStorage.setItem('userId', String(response.data.user.id));

      
      await AsyncStorage.setItem('userToken', response.data.token);
      await AsyncStorage.setItem('userName', email.split('@')[0]);
      await AsyncStorage.setItem('userType', userType);
      
      
      // Store worker zone if applicable
      if (userType === 'worker' && response.data.user.worker_profile) {
        await AsyncStorage.setItem('workerZone', 
          response.data.user.worker_profile.zone.toString());
      }
      
      navigation.replace('Home');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Invalid email or password');
    }
  };

  const handleSendOtp = async () => {
    try {
      if (!email) {
        Alert.alert('Error', 'Please enter an email address');
        return;
      }
      
      await axios.post('http://192.168.227.240:8000/api/send-otp/', { email });
      setShowOtpInput(true);
      Alert.alert('Success', 'OTP sent to your email');
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const response = await axios.post('http://192.168.227.240:8000/api/verify-otp/', {
        otp,
        password,
      });
      await AsyncStorage.setItem('userToken', response.data.token);
      await AsyncStorage.setItem('userName', email.split('@')[0]);
      await AsyncStorage.setItem('userType', userType);
      navigation.replace('Home');
    } catch (error) {
      Alert.alert('Error', 'Invalid OTP');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <ImageBackground 
      source={require('./iitb.jpg')} 
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.overlay}>
            <View style={styles.formContainer}>
              <Text style={styles.title}>
                {isNewUser ? 'Create Account' : 'Welcome Back'}
              </Text>

              {/* User Type Selection */}
              <View style={styles.userTypeContainer}>
                <TouchableOpacity 
                  style={[
                    styles.userTypeButton, 
                    userType === 'user' && styles.selectedUserType
                  ]}
                  onPress={() => setUserType('user')}
                >
                  <Ionicons 
                    name="person-outline" 
                    size={20} 
                    color={userType === 'user' ? '#FFFFFF' : '#2196F3'} 
                  />
                  <Text style={[
                    styles.userTypeText, 
                    userType === 'user' && styles.selectedUserTypeText
                  ]}>
                    User
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.userTypeButton, 
                    userType === 'worker' && styles.selectedUserType
                  ]}
                  onPress={() => setUserType('worker')}
                >
                  <Ionicons 
                    name="build-outline" 
                    size={20} 
                    color={userType === 'worker' ? '#FFFFFF' : '#2196F3'} 
                  />
                  <Text style={[
                    styles.userTypeText, 
                    userType === 'worker' && styles.selectedUserTypeText
                  ]}>
                    J . E .
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {isNewUser ? (
                !showOtpInput ? (
                  <TouchableOpacity style={styles.button} onPress={handleSendOtp}>
                    <Text style={styles.buttonText}>Send OTP</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter OTP"
                      placeholderTextColor="#666"
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Set Password"
                      placeholderTextColor="#666"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                    <TouchableOpacity style={styles.button} onPress={handleVerifyOtp}>
                      <Text style={styles.buttonText}>Verify OTP</Text>
                    </TouchableOpacity>
                  </>
                )
              ) : (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#666"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                  <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Sign In</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => {
                  setIsNewUser(!isNewUser);
                  setShowOtpInput(false);
                  setOtp('');
                  setPassword('');
                }}
              >
                <Text style={styles.secondaryButtonText}>
                  {isNewUser ? "Already have an account? Sign In" : "New user? Create account"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: 20,
    padding: 10,
  },
  secondaryButtonText: {
    color: '#007AFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  userTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  userTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#2196F3',
    borderRadius: 10,
  },
  selectedUserType: {
    backgroundColor: '#2196F3',
  },
  userTypeText: {
    color: '#2196F3',
    marginLeft: 5,
    fontWeight: '600',
  },
  selectedUserTypeText: {
    color: '#FFFFFF',
  },
});

export default LoginScreen;