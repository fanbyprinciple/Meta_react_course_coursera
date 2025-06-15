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

  return (
    <LinearGradient colors={["#2D3250", "#424769"]} style={styles.container}>
      <View style={styles.viewContainer}>
        <View style={styles.iconContainer}>
            <Ionicons name="receipt-outline" size={80} style={styles.icon} color="white" />
            <Text style={styles.title}  >
            Welcome to Rememo <br />
            </Text>
            <Text style={styles.subtitle}>
              Your reminder app.
            </Text>
            <Text style={styles.textContainer}>
              {hasBiometrics
                ? 'Use face/ Touch ID or PIN'
                : 'Enter your PIN'}
            </Text> 
            <TouchableOpacity>
                <Ionicons style={styles.icon} name={hasBiometrics? 'finger-print-outline' : 'keypad-outline'} size={24} color="white" />

                <Text style={styles.textContainer}>
                {isAuthenticating ? 'Authenticating...' : hasBiometrics
                ? 'Authenticate'
                : ''}
                </Text>
            </TouchableOpacity>

            {error && 
            <View>
                <Ionicons name="warning-outline" size={24} color="red" />
                <Text style={styles.errorText}>{error}</Text>
            </View>}
        </View>
        
        <View>
            
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
    padding: 20,
  },
  viewContainer:{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: width * 0.9,
    backgroundColor: 'rgba(18, 6, 91, 0.8)',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
      backgroundColor: 'rgba(12, 40, 130, 0.6)',
      borderRadius: 20,
      padding: 30,
      width: width -40,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },  
    icon: {
        color: 'white',
        borderRadius: 30,
        padding: 10,
    }

});

export default AuthScreen;
