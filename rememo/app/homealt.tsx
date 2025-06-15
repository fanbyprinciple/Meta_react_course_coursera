import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal, // Import Modal component
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the shape of a Task item
interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  remindAt?: string; // Optional reminder time as a string (e.g., "YYYY-MM-DD HH:MM")
}

/**
 * React Native Reminder Task App Component.
 * This component provides a simple task management interface with add,
 * toggle complete, and delete functionalities. It uses AsyncStorage
 * for local data persistence and a dark color scheme for the UI.
 */
const DarkPageComponent: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [newReminderText, setNewReminderText] = useState(''); // State for the reminder input in modal
  const [loading, setLoading] = useState(true);
  const [isReminderModalVisible, setIsReminderModalVisible] = useState(false); // State for modal visibility
  const [taskTextForReminder, setTaskTextForReminder] = useState(''); // Temporarily store task text for modal

  const TASKS_STORAGE_KEY = '@my_tasks';

  // --- Load Tasks from AsyncStorage on Component Mount ---
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const storedTasks = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
        if (storedTasks !== null) {
          const parsedTasks: Task[] = JSON.parse(storedTasks);
          parsedTasks.sort((a, b) => b.createdAt - a.createdAt);
          setTasks(parsedTasks);
        }
      } catch (error) {
        console.error('Error loading tasks from AsyncStorage:', error);
        Alert.alert('Error', 'Failed to load tasks.');
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  // --- Save Tasks to AsyncStorage whenever 'tasks' state changes ---
  useEffect(() => {
    const saveTasks = async () => {
      try {
        await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
      } catch (error) {
        console.error('Error saving tasks to AsyncStorage:', error);
        Alert.alert('Error', 'Failed to save tasks.');
      }
    };

    if (!loading) {
      saveTasks();
    }
  }, [tasks, loading]);

  // --- Task Management Functions ---

  /**
   * Initiates the process of adding a new task by showing the reminder modal.
   */
  const initiateAddTask = () => {
    if (newTaskText.trim() === '') {
      Alert.alert('Error', 'Task text cannot be empty.');
      return;
    }
    setTaskTextForReminder(newTaskText.trim()); // Store task text temporarily
    setIsReminderModalVisible(true); // Show the reminder modal
    setNewReminderText(''); // Clear previous reminder text in modal
  };

  /**
   * Confirms and adds the new task with or without a reminder.
   */
  const confirmAddTask = () => {
    const newId = Date.now().toString();
    const newTask: Task = {
      id: newId,
      text: taskTextForReminder,
      completed: false,
      createdAt: Date.now(),
      remindAt: newReminderText.trim() ? newReminderText.trim() : undefined,
    };

    setTasks(prevTasks => [newTask, ...prevTasks].sort((a, b) => b.createdAt - a.createdAt));
    setNewTaskText(''); // Clear main task input
    setNewReminderText(''); // Clear modal reminder input
    setTaskTextForReminder(''); // Clear temporary task text
    setIsReminderModalVisible(false); // Hide the modal
  };

  /**
   * Cancels the task addition process.
   */
  const cancelAddTask = () => {
    setNewTaskText(''); // Clear main task input
    setNewReminderText(''); // Clear modal reminder input
    setTaskTextForReminder(''); // Clear temporary task text
    setIsReminderModalVisible(false); // Hide the modal
  };

  /**
   * Toggles the 'completed' status of a task.
   * @param taskId The ID of the task to update.
   */
  const toggleTaskComplete = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  /**
   * Deletes a task.
   * @param taskId The ID of the task to delete.
   */
  const deleteTask = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };

  // --- Render Functions ---

  /**
   * Renders a single task item in the FlatList.
   * @param item The task object to render.
   */
  const renderItem = ({ item }: { item: Task }) => (
    <View style={styles.taskItem}>
      <TouchableOpacity
        onPress={() => toggleTaskComplete(item.id)}
        style={styles.taskTextContainer}
      >
        <Text style={[styles.taskText, item.completed && styles.completedTaskText]}>
          {item.text}
        </Text>
        {item.remindAt && (
          <Text style={styles.reminderText}>Remind: {item.remindAt}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => deleteTask(item.id)} style={styles.deleteButton}>
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

        <View style={styles.header}>
          <Text style={styles.headerText}>My Reminders</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#4CAF50" />
        ) : (
          <>
            {/* Main task input section */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Add a new task..."
                placeholderTextColor="#999"
                value={newTaskText}
                onChangeText={setNewTaskText}
                onSubmitEditing={initiateAddTask} // Trigger modal on Enter
              />
              <TouchableOpacity onPress={initiateAddTask} style={styles.addButton}>
                <Text style={styles.addButtonText}>Add Task</Text>
              </TouchableOpacity>
            </View>

            {/* Task list */}
            <FlatList
              data={tasks}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.taskList}
              ListEmptyComponent={
                <Text style={styles.emptyListText}>No tasks yet! Add one above.</Text>
              }
            />
          </>
        )}

        {/* Reminder Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isReminderModalVisible}
          onRequestClose={cancelAddTask} // Handle Android back button
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Set Reminder for:</Text>
              <Text style={styles.modalTaskText}>{taskTextForReminder}</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="Enter date & time (YYYY-MM-DD HH:MM)" // More descriptive placeholder
                placeholderTextColor="#999"
                value={newReminderText}
                onChangeText={setNewReminderText}
                onSubmitEditing={confirmAddTask}
              />
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity onPress={cancelAddTask} style={styles.modalCancelButton}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={confirmAddTask} style={styles.modalConfirmButton}>
                  <Text style={styles.modalButtonText}>Confirm Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

// Define the styles for the component using StyleSheet.create
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    padding: 20,
    backgroundColor: '#0f0f1b',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
    alignItems: 'center',
  },
  headerText: {
    color: '#e0e0e0',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#2a2a3e',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    marginHorizontal: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    height: 50,
    backgroundColor: '#3a3a4e',
    borderRadius: 8,
    paddingHorizontal: 15,
    color: '#e0e0e0',
    fontSize: 16,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  taskList: {
    padding: 10,
    paddingBottom: 20,
  },
  taskItem: {
    flexDirection: 'row',
    backgroundColor: '#2a2a3e',
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2.62,
    elevation: 4,
  },
  taskTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  taskText: {
    color: '#e0e0e0',
    fontSize: 18,
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
    color: '#a0a0a0',
  },
  reminderText: {
    color: '#888',
    fontSize: 12,
    marginTop: 5,
  },
  deleteButton: {
    backgroundColor: '#DC3545',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyListText: {
    color: '#a0a0a0',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: '#0f0f1b',
    padding: 25,
    borderRadius: 15,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  modalTitle: {
    color: '#e0e0e0',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalTaskText: {
    color: '#4CAF50',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  modalTextInput: {
    width: '100%',
    height: 50,
    backgroundColor: '#3a3a4e',
    borderRadius: 8,
    paddingHorizontal: 15,
    color: '#e0e0e0',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalCancelButton: {
    backgroundColor: '#DC3545',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  modalConfirmButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DarkPageComponent;
