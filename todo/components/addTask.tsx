import { AntDesign } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

type Line = { id: string; text: string }; // Represents a single input row with a stable id and its current text

// Generate a unique-ish id by combining random base36 string with a timestamp
const createId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export default function AddTask() {
  // Keep an ordered list of input rows; start with a single empty row
  const [lines, setLines] = useState<Line[]>([{ id: createId(), text: '' }]);

  // Track which line should autoFocus after it mounts (used when inserting new rows)
  const [autoFocusId, setAutoFocusId] = useState<string | null>(null);

  // Update the text of a specific row by id
  const updateText = useCallback((id: string, value: string) => {
    // Functional setState to avoid stale closures and ensure consistent updates
    setLines(prev => prev.map(l => (l.id === id ? { ...l, text: value } : l)));
  }, []);

  // Insert a new empty row immediately after the given row id
  const addLineAfter = useCallback((afterId: string) => {
    const newLine: Line = { id: createId(), text: '' };

    setLines(prev => {
      // Find the insertion index and insert the new line; if not found, append
      const idx = prev.findIndex(l => l.id === afterId);
      const next = [...prev];
      if (idx >= 0) next.splice(idx + 1, 0, newLine);
      else next.push(newLine);
      return next;
    });

    // Flag the new line to auto-focus once it's rendered
    setAutoFocusId(newLine.id);
  }, []);

  return (
    <View style={styles.container}>
      {lines.map((line, i) => (
        <View key={line.id} style={styles.inputContainer}>
          <TextInput
            // Only auto-focus the TextInput if this row matches the flagged id
            autoFocus={autoFocusId === line.id}
            onFocus={() => {
              // Clear the flag once focus occurs so it doesn't re-trigger on re-renders
              if (autoFocusId === line.id) setAutoFocusId(null);
            }}
            style={styles.textInput}
            // Controlled input value
            value={line.text}
            // Update the corresponding line's text
            onChangeText={(t) => updateText(line.id, t)}
            // Helpful placeholder that reflects the row number
            placeholder={`Add item ${i + 1}`}
            placeholderTextColor="rgba(255,255,255,0.5)"
            // Show "Next" on the keyboard; we handle moving to a new line on submit
            returnKeyType="next"
            // When the user submits (presses return), insert a new line after this one
            onSubmitEditing={() => addLineAfter(line.id)}
            // Keep the keyboard open on submit so typing can continue seamlessly
            blurOnSubmit={false}
          />
          {/* Plus button as an alternative to pressing return to add a new line */}
          <TouchableOpacity onPress={() => addLineAfter(line.id)}>
            <AntDesign name="pluscircleo" size={24} color="white" style={styles.plusicon} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#322f2fff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  textInput: {
    flex: 1,
    color: 'white',
    fontSize: 12,
    paddingVertical: 8,
  },
  plusicon: {
    marginLeft: 10,
  },
});