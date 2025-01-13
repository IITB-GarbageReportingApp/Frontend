import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Text,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (userToken) {
        // Verify token validity with your backend if needed
        navigation.replace('Home');
      }
    } catch (error) {
      console.error('Error checking login status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }


  const handleLogin = async () => {
    try {
      if (!email || !password) {
        Alert.alert('Error', 'Please enter both email and password');
        return;
      }

      const response = await axios.post('http://192.168.1.111:8000/api/login/', {
        email,
        password,
      });
      
      await AsyncStorage.setItem('userToken', response.data.token);
      await AsyncStorage.setItem('userName', email.split('@')[0]);
      navigation.replace('Home');
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.error || 
        error.response?.data?.message || 
        'Invalid email or password'
      );
    }
  };

  const handleSendOtp = async () => {
    try {
      if (!email) {
        Alert.alert('Error', 'Please enter an email address');
        return;
      }
      
      const response = await axios.post('http://192.168.1.111:8000/api/send-otp/', {
        email,
      });
      setShowOtpInput(true);
      Alert.alert('Success', 'OTP sent to your email');
    } catch (error) {
      console.error('Error details:', error.response?.data || error.message);
      Alert.alert(
        'Error',
        error.response?.data?.error || 
        error.response?.data?.message || 
        'Failed to send OTP. Please check your email address and try again.'
      );
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const response = await axios.post('http://192.168.1.111:8000/api/verify-otp/', {
        otp,
        password,
      });
      await AsyncStorage.setItem('userToken', response.data.token);
      await AsyncStorage.setItem('userName', email.split('@')[0]);
      navigation.replace('Home');
    } catch (error) {
      Alert.alert('Error', 'Invalid OTP');
    }
  };

  const CustomInput = ({ placeholder, value, onChangeText, secureTextEntry, keyboardType }) => (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#666"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  );

  const CustomButton = ({ title, onPress, secondary }) => (
    <TouchableOpacity 
      style={[styles.button, secondary && styles.buttonSecondary]}
      onPress={onPress}
    >
      <Text style={[styles.buttonText, secondary && styles.buttonTextSecondary]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.contentContainer}
      >
        <View style={styles.logoContainer}>
          <Image
            source={{ uri: '/api/placeholder/100/100' }}
            style={styles.logo}
          />
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            {isNewUser ? 'Create your account' : 'Sign in to continue'}
          </Text>
        </View>

        <View style={styles.formContainer}>
          <CustomInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          {isNewUser ? (
            !showOtpInput ? (
              <CustomButton title="Send OTP" onPress={handleSendOtp} />
            ) : (
              <>
                <CustomInput
                  placeholder="Enter OTP"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                />
                <CustomInput
                  placeholder="Set Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
                <CustomButton title="Verify OTP" onPress={handleVerifyOtp} />
              </>
            )
          ) : (
            <>
              <CustomInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <CustomButton title="Sign In" onPress={handleLogin} />
            </>
          )}

          <CustomButton 
            title={isNewUser ? "Already have an account? Sign In" : "New user? Create account"} 
            onPress={() => {
              setIsNewUser(!isNewUser);
              setShowOtpInput(false);
              setOtp('');
              setPassword('');
            }}
            secondary
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#007AFF',
  },
});

export default LoginScreen;