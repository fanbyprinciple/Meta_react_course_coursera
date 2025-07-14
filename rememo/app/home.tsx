import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  AppState,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import {
  registerForPushNotificationsAsync,
  scheduletaskReminder,
} from "../utils/notifications";
import {
  EffortHistory,
  gettasks,
  getTodaysItems,
  recordEffort,
  task,
} from "../utils/storage";

const { width } = Dimensions.get("window");

// Create animated circle component
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const QUICK_ACTIONS = [
  {
    icon: "add-circle-outline" as const,
    label: "Add\ntask",
    route: "/tasks/add" as const,
    color: "#2E7D32",
    gradient: ["#2C3E50 ", "#3498DB"] as [string, string],
  },
  {
    icon: "calendar-outline" as const,
    label: "Calendar\nView",
    route: "/calendar" as const,
    color: "#1976D2",
    gradient: ["#2196F3", "#1976D2"] as [string, string],
  },
  {
    icon: "time-outline" as const,
    label: "History\nLog",
    route: "/history" as const,
    color: "#C2185B",
    gradient: ["#E91E63", "#C2185B"] as [string, string],
  },
  {
    icon: "hourglass-outline" as const,
    label: "Credits",
    route: "/credits" as const, // Changed from "/about" to "/credits"
    color: "#E64A19",
    gradient: ["#FF5722", "#E64A19"] as [string, string],
  },
];

interface CircularProgressProps {
  progress: number;
  totalItems: number;
  completedItems: number;
}

function CircularProgress({
  progress,
  totalItems,
  completedItems,
}: CircularProgressProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const size = width * 0.55;
  const strokeWidth = 15;
  const radius = (size - strokeWidth) /2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  }, [progress, animatedValue]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTextContainer}>
        <Text style={styles.progressPercentage}>
          {Math.round(progress * 100)}%
        </Text>
        <Text style={styles.progressDetails}>
          {completedItems} of {totalItems} Items
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
          strokeWidth={strokeWidth * 2}
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
  const router = useRouter()
  const [showNotifications, setShowNotifications] = useState(false);
  const [tasks, settasks] = useState<task[]>([])
  const [todaystasks, setTodaystasks] = useState<task[]>([]);
  const [completedItems, setCompletedItems] = useState(0);
  const [EffortHistory, setEffortHistory] = useState<EffortHistory[]>([]);

  const loadtasks = useCallback(async () => {
    try {
      const [alltasks, todaysItems] = await Promise.all([
        gettasks(),
        getTodaysItems(),
      ]);

      // setEffortHistory(todaysItems);
      settasks(alltasks);

      // Filter tasks for today
      const today = new Date();
      const todayMeds = alltasks.filter((med: task) => {
        // const startDate = new Date(med.startDate);
        // const durationDays = parseInt(med.duration.split(" ")[0]);

        // // For ongoing tasks or if within duration
        // if (
        //   durationDays === -1 ||
        //   (today >= startDate &&
        //     today <=
        //       new Date(
        //         startDate.getTime() + durationDays * 24 * 60 * 60 * 1000
        //       ))
        // ) {
        //   return true;
        // }
        // return false;
        return true; // I want all tasks today and otherwise
      });

      setTodaystasks(todayMeds);

      // Calculate completed Items
      // const completed = todaysItems.filter((Effort: EffortHistory) => Effort.Completed).length;
      const completed = alltasks.filter((task: task) => task.completed).length;
      
      setCompletedItems(completed);
    } catch (error) {
      console.error("Error loading tasks:", error);
    }
  }, []);

  const setupNotifications = async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      if (!token) {
        console.log("Failed to get push notification token");
        return;
      }

      // Schedule reminders for all tasks
      const tasks = await gettasks();
      for (const task of tasks) {
        if (task.reminderEnabled) {
          await scheduletaskReminder(task);
        }
      }
    } catch (error) {
      console.error("Error setting up notifications:", error);
    }
  };

  // Use useEffect for initial load
  useEffect(() => {
    loadtasks();
    setupNotifications();

    // Handle app state changes for notifications
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        loadtasks();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [loadtasks]);

  // Use useFocusEffect for subsequent updates
  useFocusEffect(
    useCallback(() => {
      const unsubscribe = () => {
        // Cleanup if needed
      };

      loadtasks();
      return () => unsubscribe();
    }, [loadtasks])
  );

  // Fix: Remove space in function name
  const handleCompleteEffort = async (task: task) => {
    try {
      await recordEffort(task.id, true, new Date().toISOString());
      await loadtasks(); // Reload data after recording Effort
    } catch (error) {
      console.error("Error recording Effort:", error);
      Alert.alert("Error", "Failed to record Effort. Please try again.");
    }
  };

  const isEffortCompleted = (taskId: string) => {
    return EffortHistory.some(
      (Effort) => Effort.taskId === taskId && Effort.Completed
    );
  };

  const progress =
    todaystasks.length > 0
      ? completedItems / (todaystasks.length * 2)
      : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={["#1a8e2d", "#146922"]} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.flex1}>
              <Text style={styles.greeting}>Daily Progress</Text>
            </View>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => setShowNotifications(true)}
            >
              <Ionicons name="notifications-outline" size={24} color="white" />
              {todaystasks.length > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationCount}>
                    {todaystasks.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <CircularProgress
            progress={progress}
            totalItems={todaystasks.length * 2}
            completedItems={completedItems}
          />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {QUICK_ACTIONS.map((action) => (
              <Link href={action.route} key={action.label} asChild>
                <TouchableOpacity style={styles.actionButton}>
                  <LinearGradient
                    colors={action.gradient}
                    style={styles.actionGradient}
                  >
                    <View style={styles.actionContent}>
                      <View style={styles.actionIcon}>
                        <Ionicons name={action.icon} size={28} color="white" />
                      </View>
                      <Text style={styles.actionLabel}>{action.label}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Link>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today&apos;s Schedule</Text>
            <Link href="/calendar" asChild>
              <TouchableOpacity>
                <Text style={styles.seeAllButton}>See All</Text>
              </TouchableOpacity>
            </Link>
          </View>
          {todaystasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="hourglass-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>
                No tasks scheduled for today
              </Text>
              <Link href="/tasks/add" asChild>
                <TouchableOpacity style={styles.addtaskButton}>
                  <Text style={styles.addtaskButtonText}>
                    Add task
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          ) : (
            todaystasks.map((task) => {
              const Completed = isEffortCompleted(task.id);
              return (
                <View key={task.id} style={styles.EffortCard}>
                  <View
                    style={[
                      styles.EffortBadge,
                      { backgroundColor: `${task.color}15` },
                    ]}
                  >
                    <Ionicons
                      name="medical"
                      size={24}
                      color={task.color}
                    />
                  </View>
                  <View style={styles.EffortInfo}>
                    <View>
                      <Text style={styles.medicineName}>{task.name}</Text>
                      <Text style={styles.manhourInfo}>{task.manhour}</Text>
                    </View>
                    <View style={styles.EffortTime}>
                      <Ionicons name="time-outline" size={16} color="#666" />
                      <Text style={styles.timeText}>{task.times[0]}</Text>
                    </View>
                  </View>
                  {Completed ? (
                    <View style={[styles.CompletedBadge]}>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#4CAF50"
                      />
                      <Text style={styles.CompletedText}>Completed</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.takeEffortButton,
                        { backgroundColor: task.color },
                      ]}
                      onPress={() => handleCompleteEffort(task)} // Fix: use correct function name
                    >
                      <Text style={styles.takeEffortText}>Complete </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </View>
      </View>

      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity
                onPress={() => setShowNotifications(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            {todaystasks.map((task) => (
              <View key={task.id} style={styles.notificationItem}>
                <View style={styles.notificationIcon}>
                  <Ionicons name="hourglass" size={24} color={task.color} />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>
                    {task.name}
                  </Text>
                  <Text style={styles.notificationMessage}>
                    {task.manhour}
                  </Text>
                  <Text style={styles.notificationTime}>
                    {task.times[0]}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  greeting: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    opacity: 0.9,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 15,
  },
  actionButton: {
    width: (width - 52) / 2,
    height: 110,
    borderRadius: 16,
    overflow: "hidden",
  },
  actionGradient: {
    flex: 1,
    padding: 15,
  },
  actionContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
    marginTop: 8,
  },
  section: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 5,
  },
  seeAllButton: {
    color: "#2E7D32",
    fontWeight: "600",
  },
  EffortCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  EffortBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  EffortInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  medicineName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  manhourInfo: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  EffortTime: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    marginLeft: 5,
    color: "#666",
    fontSize: 14,
  },
  takeEffortButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginLeft: 10,
  },
  takeEffortText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  progressContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  progressTextContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  progressPercentage: {
    fontSize: 36,
    fontWeight: "bold",
    color: "white",
  },
  progressLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 4,
  },
  progressRing: {
    transform: [{ rotate: "-90deg" }],
  },
  flex1: {
    flex: 1,
  },
  notificationButton: {
    position: "relative",
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    marginLeft: 8,
  },
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FF5252",
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#146922",
    paddingHorizontal: 4,
  },
  notificationCount: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
  },
  progressDetails: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  notificationItem: {
    flexDirection: "row",
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    marginBottom: 10,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: "#999",
  },
  emptyState: {
    alignItems: "center",
    padding: 30,
    backgroundColor: "white",
    borderRadius: 16,
    marginTop: 10,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
    marginBottom: 20,
  },
  addtaskButton: {
    backgroundColor: "#1a8e2d",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addtaskButtonText: {
    color: "white",
    fontWeight: "600",
  },
  CompletedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 10,
  },
  CompletedText: {
    color: "#4CAF50",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 4,
  },
});
