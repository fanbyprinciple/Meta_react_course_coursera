
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Modal, Alert, AppState } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Dimensions } from "react-native";
import {Link, useRouter} from "expo-router";
import Svg, { Circle } from "react-native-svg";

import { getTasks, Tasks, getTodaysTasks, recordTasks, TaskHistory } from "../utils/storage";
import { useFocusEffect } from "@react-navigation/native";

import {
    registerForPushNotificationsAsync,,
    scheduleTaskReminder,

} from "../utils/notifications"
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";



const {width} = Dimensions.get("window");

const AnimatedCircle = Animated.createAnimatedComponent(Circe);

const QUICK_ACTIONS = [
    {
        icon: "add-circle-outline" as const,
        label: "Add\nTask",
        route: "/tasks/add" as const,
        color: "#4CAF50",
        gradient: ["#4CAF50", "#2E7D32"] as [string, string] 
    },
    {
        icon: "calendar-outline" as const,
        label: "View\nCalendar",
        route: "/calendar" as const, 
        color: "#2196F3",
        gradient: ["#2196F3", "#1976D2"] as [string, string]
    },
    {
        icon: "time-outline" as const,
        label: "Task\nHistory",
        route: "/history" as const,
        color: "#FF9800",      
        gradient: ["#FF9800", "#F57C00"] as [string, string]
    },
    {
        icon: "receipt-outline" as const,
        label: "refill/trackers",
        route: "/refills" as const,
        color: "#9C27B0",
        gradient: ["#9C27B0", "#7B1FA2"] as [string, string]   
    }
]

interface CircularProgressProps {
    progress: number;
    totalTasks: number;
    completeTasks: number;
}

function CircularProgress({
    progress,
    totalTasks,
    completedTasks,
}: CircularProgressProps) {
    const useAnimationValue = useRef(new Animated.Value(0)).current;
    const size = width * 0.55;
    const strokeWidth = 15;
    const center = size/2
    const radius = (size - strokeWidth)/2
    const circumference = 2 * Math.PI * radius

    const strokeDashoffset = useAnimationValue.interpolate({
        inputRange: [0, 1],
        outputRange: [circumference, 0]
    });

    useEffect(() => {
        Animated.timing(useAnimationValue, {
            toValue: progress,
            duration: 1000,
            useNativeDriver: false
        }).start();
    }, [progress]);


     return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTextContainer}>
        <Text style={styles.progressPercentage}>
          {Math.round(progress * 100)}%
        </Text>
        <Text style={styles.progressDetails}>
          {completedTasks} of {totalTasks} doses
        </Text>
      </View>
      <Svg width={size} height={size} style={styles.progressRing}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="white"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
    </View>
  );
}

export default function HomeScreen() {
    const router = useRouter();
    const [showNotification, setShowNotifications] = useState(false);
    const [medications, setMedications] = useState<Tasks[]>([]);
    const [todaysTasks, setTodaysTasks] = useState<Tasks[]>([]);
    const [completeTasks, setCompleteTasks] = useState<number>(0);
    const [TaskHistory, setTaskHistory] = useState<TaskHistory[]>([]);

    const loadTasks = useCallback(async () => {
        try {
            const [allTasks, todaysTasks] = await Promise.all([
                getTasks(),
                getTodaysTasks(),
            ]);

            setTaskHistory(todaysTasks);
            setTasks(allTasks)

            const today = new Date()

}

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