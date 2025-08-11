import { AntDesign } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

type Line = { id: string; text: string };

const createId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export default function AddTask() {
  const [lines, setLines] = useState<Line[]>([{ id: createId(), text: '' }]);
  // Track which line should autoFocus after it mounts
  const [autoFocusId, setAutoFocusId] = useState<string | null>(null);

  const updateText = useCallback((id: string, value: string) => {
    setLines(prev => prev.map(l => (l.id === id ? { ...l, text: value } : l)));
  }, []);

  const addLineAfter = useCallback((afterId: string) => {
    const newLine: Line = { id: createId(), text: '' };
    setLines(prev => {
      const idx = prev.findIndex(l => l.id === afterId);
      const next = [...prev];
      if (idx >= 0) next.splice(idx + 1, 0, newLine);
      else next.push(newLine);
      return next;
    });
    // Tell the UI to auto-focus the newly added line
    setAutoFocusId(newLine.id);
  }, []);

  return (
    <View style={styles.container}>
      {lines.map((line, i) => (
        <View key={line.id} style={styles.inputContainer}>
          <TextInput
            // Auto-focus only the line we just added
            autoFocus={autoFocusId === line.id}
            onFocus={() => {
              // Clear the auto-focus flag once we focused something
              if (autoFocusId === line.id) setAutoFocusId(null);
            }}
            style={styles.textInput}
            value={line.text}
            onChangeText={(t) => updateText(line.id, t)}
            placeholder={`Add item ${i + 1}`}
            placeholderTextColor="rgba(255,255,255,0.5)"
            returnKeyType="next"
            onSubmitEditing={() => addLineAfter(line.id)}
            blurOnSubmit={false}
          />
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