import { AntDesign } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

type Line = { id: string; text: string };

const createId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

type TodoItemRow = {
  id: string;
  text: string;
  position: number;
};

export default function AddTask() {
  const [lines, setLines] = useState<Line[]>([{ id: createId(), text: '' }]);
  const [autoFocusId, setAutoFocusId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const hasSupabase = useMemo(() => {
    // Guard if env vars are missing; allow local-only usage
    // @ts-ignore
    return !!process.env.EXPO_PUBLIC_SUPABASE_URL && !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  }, []);

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

    setAutoFocusId(newLine.id);
  }, []);

  // Load items from Supabase
  const reloadFromSupabase = useCallback(async () => {
    if (!hasSupabase) {
      Alert.alert('Supabase not configured', 'Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to enable cloud sync.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('todo_items')
        .select('id, text, position')
        .order('position', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) {
        setLines([{ id: createId(), text: '' }]);
      } else {
        setLines(data.map((r: TodoItemRow) => ({ id: r.id, text: r.text ?? '' })));
      }
    } catch (err: any) {
      console.error('Failed to load items:', err);
      Alert.alert('Load failed', err.message ?? 'Unknown error loading items');
    } finally {
      setLoading(false);
    }
  }, [hasSupabase]);

  // Save local items to Supabase (upsert + delete removed)
  const saveToSupabase = useCallback(async () => {
    if (!hasSupabase) {
      Alert.alert('Supabase not configured', 'Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to enable cloud sync.');
      return;
    }
    setSaving(true);
    try {
      // Prepare rows with stable order
      const rows: TodoItemRow[] = lines.map((l, idx) => ({
        id: l.id,
        text: l.text,
        position: idx,
      }));

      // Upsert existing/new rows
      const { error: upsertError } = await supabase.from('todo_items').upsert(rows, { onConflict: 'id' });
      if (upsertError) throw upsertError;

      // Remove rows in DB that are not present locally
      const { data: existingIds, error: selectError } = await supabase
        .from('todo_items')
        .select('id');

      if (selectError) throw selectError;

      const localIds = new Set(rows.map(r => r.id));
      const idsToDelete = (existingIds ?? [])
        .map((r: { id: string }) => r.id)
        .filter(id => !localIds.has(id));

      if (idsToDelete.length > 0) {
        const { error: deleteError } = await supabase.from('todo_items').delete().in('id', idsToDelete);
        if (deleteError) throw deleteError;
      }

      Alert.alert('Saved', 'Items saved to Supabase.');
    } catch (err: any) {
      console.error('Failed to save items:', err);
      Alert.alert('Save failed', err.message ?? 'Unknown error saving items');
    } finally {
      setSaving(false);
    }
  }, [hasSupabase, lines]);

  useEffect(() => {
    // Attempt initial load from Supabase; if not configured, just keep local
    reloadFromSupabase().catch(() => {});
  }, [reloadFromSupabase]);

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <TouchableOpacity onPress={reloadFromSupabase} style={styles.toolbarBtn} disabled={loading || saving}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <AntDesign name="reload1" size={18} color="white" />
              <Text style={styles.toolbarBtnText}>Reload</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={saveToSupabase} style={styles.toolbarBtnPrimary} disabled={loading || saving}>
          {saving ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <>
              <AntDesign name="save" size={18} color="black" />
              <Text style={styles.toolbarBtnPrimaryText}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {lines.map((line, i) => (
        <View key={line.id} style={styles.inputContainer}>
          <TextInput
            autoFocus={autoFocusId === line.id}
            onFocus={() => {
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
  toolbar: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 8,
    alignItems: 'center',
  },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#4a4747',
  },
  toolbarBtnText: {
    color: 'white',
    fontSize: 12,
  },
  toolbarBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  toolbarBtnPrimaryText: {
    color: 'black',
    fontSize: 12,
    fontWeight: '600',
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