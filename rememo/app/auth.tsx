import React from 'react';
import {useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import  useAuth  from '../hooks/useAuth';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const AuthScreen = () => {
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { signIn, signOut } = useAuth();

  const checkBiometrics  = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (compatible && isEnrolled) {
      setHasBiometrics(compatible);
    }
  };

  useEffect(() => {
    checkBiometrics();
  }, []);

  const authenticate = async () => {
    setIsAuthenticating(true);
    setError(null);
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      const auth = await LocalAuthentication.authenticateAsync({
        promptMessage: compatible && isEnrolled ? 'Use Face ID/ Touch ID' : 'Enter your PIN',
        fallbackLabel: 'Enter your PIN',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      if (auth.success) {
        await signIn();
        router.replace('/home');
      } else {
        setError('Authentication failed. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during authentication.');
    } finally {
      setIsAuthenticating(false);
    }
  }
  return (
    <LinearGradient colors={["#000000", "#050a30"]} style={styles.container}>
      <View style={styles.viewContainer}>
        <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
            <Ionicons name="receipt-outline" size={80} color="white" />
            </View>
            <Text style={styles.title}  >
            Welcome to Rememo
            </Text>
            <Text style={styles.subtitle}>
              Originally made for Devu but you can use it too.
            </Text>

        </View>
        <View style={styles.card}>
            <Text style={styles.textContainer}>
              Please click button below to continue
            </Text>
            <TouchableOpacity style={[styles.button, isAuthenticating && styles.buttonDisabled]} disabled= {isAuthenticating} onPress={authenticate}> 
                <Ionicons style={styles.buttonIcon} name={hasBiometrics? 'finger-print-outline' : 'keypad-outline'} size={24} color="white" />
                <Text style={styles.buttonText}>
                  {hasBiometrics
                    ? 'Use Face/ Touch ID or PIN'
                    : 'Enter your PIN'}
                </Text> 
                <Text style={styles.buttonText}>
                {isAuthenticating ? 'Authenticating...' : hasBiometrics
                ? ''
                : ''}
                </Text>
            </TouchableOpacity>

            {error && 
            <View style={styles.errorContainer}>
                <Ionicons name="warning-outline" size={24} color="red" />
                <Text style={styles.errorText}>{error}</Text>
            </View>}
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 100,
  },
  viewContainer:{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: width * 0.9,
   
  },

  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'center',
    borderRadius: 60,  
    padding: 20,

  },
  textContainer: {
    alignItems: 'center',
    color: 'white',
    fontSize: 16,
    padding: 5,
  },
errorText: {
        color: 'red',
        marginTop: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 10,
        textShadowColor: "rgba(0, 0, 0, 0.2)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    subtitle: {
        fontSize: 18,
        color: "rgba(255,255,255,0.9)", 
        marginBottom: 20,
        textAlign: 'center',
    },
    card: {
      backgroundColor: 'rgba(2, 35, 142, 0.6)',
      borderRadius: 20,
      padding: 30,
      width: width -50,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      textAlign: 'center',
      justifyContent: 'center',
      alignItems: 'center',
    },  
   iconCircle: {
    width: 120,    // Set a fixed width
    height: 120,    // Set a fixed height (must be same as width for a perfect circle)
      // Half of the width/height to make it a circle
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',  // Center the icon horizontally
    alignItems: 'center',      // Center the icon vertically
    // You can add more styling here, e.g., borderWidth, borderColor, shadow, etc.
    shadowColor: '#fff',
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.25,
    elevation: 5,
    padding: 10,
    marginBottom: 30,
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    color: 'black',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,   
    shadowRadius: 3.84,
    elevation: 5, 
  },
  buttonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  }, 
  buttonDisabled: {
    opacity: 0.5,
  },

  buttonIcon: {
    marginRight: 10,
    color: 'black',
  },

});

export default AuthScreen;
