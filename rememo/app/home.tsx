import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Animated } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

const {width} = Dimensions.get("window");

interface CircularProgressProps {
    progress: number;
    totalDoses: number;
    completeDoses: number;
}

function CircularProgress({
    progress,
    totalDoses,
    completeDoses
}: CircularProgressProps) {
    const useAnimationValue = useRef(new Animated.Value(0)).current;
    const size = width * 0.55;
    const strokeWidth = 15;
    const center = size/2
    const radius = (size - strokeWidth)/2

    useEffect(() => {
        Animated.timing(useAnimationValue, {
            toValue: progress,
            duration: 1000,
            useNativeDriver: false
        }).start();
    }, [progress]);

    return (
        <ScrollView showsVerticalScrollIndicator={false}>
            <LinearGradient colors={["#4c669f", "#3b5998", "#192f6a"]}>
                <View>
                    <View>
                        <View>
                            <Text>Daily Progress</Text>
                        </View>
                        <TouchableOpacity>
                            <Ionicons name='notifications-outline' size={24} color='black' />
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>
            <View>
                <Text>Home</Text>
            </View>
        </ScrollView>
    );
}