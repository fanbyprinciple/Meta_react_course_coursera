import AsyncStorage from "@react-native-async-storage/async-storage";

const taskS_KEY = "@tasks";
const Effort_HISTORY_KEY = "@Effort_history";

export interface task {
  id: string;
  name: string;
  times: string[];
  startDate: string;
  color: string;
  reminderEnabled: boolean;
  completed: boolean;
}

export interface EffortHistory {
  id: string;
  taskId: string;
  timestamp: string;
  Completed: boolean;
}

// // exports import {
//   gettasks,
//   task,
//   getTodaysItems,
//   recordEffort,
//   EffortHistory,
// } from "../utils/storage";
export async function gettasks(): Promise<task[]> {
  try {
    const data = await AsyncStorage.getItem(taskS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting tasks:", error);
    return [];
  }
}

export async function addtask(task: task): Promise<void> {
  try {
    const tasks = await gettasks();
    tasks.push(task);
    await AsyncStorage.setItem(taskS_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error("Error adding task:", error);
    throw error;
  }
}

export async function updatetask(
  updatedtask: task
): Promise<void> {
  try {
    const tasks = await gettasks();
    const index = tasks.findIndex(
      (med) => med.id === updatedtask.id
    );
    if (index !== -1) {
      tasks[index] = updatedtask;
      await AsyncStorage.setItem(taskS_KEY, JSON.stringify(tasks));
    }
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
}

export async function deletetask(id: string): Promise<void> {
  try {
    const tasks = await gettasks();
    const updatedtasks = tasks.filter((med) => med.id !== id);
    await AsyncStorage.setItem(
      taskS_KEY,
      JSON.stringify(updatedtasks)
    );
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
}

export async function getEffortHistory(): Promise<EffortHistory[]> {
  try {
    const data = await AsyncStorage.getItem(Effort_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting Effort history:", error);
    return [];
  }
}

export async function getTodaysItems(): Promise<EffortHistory[]> {
  try {
    const history = await getEffortHistory();
    const today = new Date().toDateString();
    return history.filter(
      (Effort) => new Date(Effort.timestamp).toDateString() === today
    );
  } catch (error) {
    console.error("Error getting today's Items:", error);
    return [];
  }
}

export async function recordEffort(
  taskId: string,
  Completed: boolean,
  timestamp: string
): Promise<void> {
  try {
    const history = await getEffortHistory();
    const newEffort: EffortHistory = {
      id: Math.random().toString(36).substr(2, 9),
      taskId,
      timestamp,
      Completed,
    };

    history.push(newEffort);
    await AsyncStorage.setItem(Effort_HISTORY_KEY, JSON.stringify(history));

    // Update task supply if Completed
    if (Completed) {
      const tasks = await gettasks();
      const task = tasks.find((med) => med.id === taskId);
      if (task && task.currentSupply > 0) {
        task.currentSupply -= 1;
        await updatetask(task);
      }
    }
  } catch (error) {
    console.error("Error recording Effort:", error);
    throw error;
  }
}

export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([taskS_KEY, Effort_HISTORY_KEY]);
  } catch (error) {
    console.error("Error clearing data:", error);
    throw error;
  }
}
