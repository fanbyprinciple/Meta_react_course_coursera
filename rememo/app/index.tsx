import {View, Text, StyleSheet, Animated} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import React from 'react';
import { useRouter } from 'expo-router';

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const router = useRouter();
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 2,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      // Navigate to the main app screen after the animation
      // This is a placeholder, replace with your navigation logic
      router.replace('/auth');
      console.log('Navigate to main app screen');
    }, 5000);
    return () => clearTimeout(timer); // Cleanup the timer on unmount
  }, [fadeAnim, scaleAnim]);
  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.iconContainer,
                {
                    opacity: fadeAnim , 
                    transform: [{ scale: scaleAnim }] 
                }]}
        >
        <Ionicons name="receipt-outline" size={100} color="white" />
        <Text style={styles.text}>Rememo</Text>
      </Animated.View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black'
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  iconContainer: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 20,
    letterSpacing: 1,
    textAlign: 'center',
  },
});

