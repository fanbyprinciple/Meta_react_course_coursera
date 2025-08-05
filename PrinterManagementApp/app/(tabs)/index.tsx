import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Printer } from './types';
import { db } from '../../firebase'; // Corrected import path
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

const App = () => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentFilter, setCurrentFilter] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPrinterId, setEditingPrinterId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Printer, 'id'>>({
    name: '',
    model: '',
    status: 'working',
    location: '',
    inkLevel: 100,
    remarks: ''
  });

  const printersCollection = collection(db, 'printers');

  useEffect(() => {
    const subscriber = onSnapshot(printersCollection, (querySnapshot) => {
      const printersData: Printer[] = [];
      querySnapshot.forEach((doc) => {
        printersData.push({
          id: doc.id,
          ...doc.data(),
        } as Printer);
      });
      setPrinters(printersData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching printers: ', error);
      Alert.alert('Error', 'Failed to load printers from database');
      setLoading(false);
    });

    return () => subscriber();
  }, []);

  const filteredPrinters = printers.filter(printer => {
    const matchesSearch =
      printer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      printer.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      printer.model?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = currentFilter === 'all' || printer.status === currentFilter;

    return matchesSearch && matchesFilter;
  });

  const openModal = (printerId: string | null = null) => {
    if (printerId) {
      const printer = printers.find(p => p.id === printerId);
      if (printer) {
        setFormData(printer);
        setEditingPrinterId(printerId);
      }
    } else {
      setFormData({
        name: '',
        model: '',
        status: 'working',
        location: '',
        inkLevel: 100,
        remarks: ''
      });
      setEditingPrinterId(null);
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingPrinterId(null);
  };

  const savePrinter = async () => {
    console.log('Attempting to save printer...');
    if (!formData.name || !formData.model || !formData.location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const printerData = {
        ...formData,
        updatedAt: serverTimestamp(),
      };
      console.log('Printer data:', printerData);

      if (editingPrinterId) {
        console.log('Updating existing printer with ID:', editingPrinterId);
        const printerDoc = doc(db, 'printers', editingPrinterId);
        await updateDoc(printerDoc, printerData);
        Alert.alert('Success', 'Printer updated successfully');
      } else {
        console.log('Adding new printer...');
        await addDoc(printersCollection, {
          ...printerData,
          createdAt: serverTimestamp(),
        });
        Alert.alert('Success', 'Printer added successfully');
      }

      closeModal();
    } catch (error) {
      console.error('Error saving printer: ', error);
      Alert.alert('Error', 'Failed to save printer to database');
    }
  };

  const deletePrinter = (id: string) => {
    Alert.alert(
      'Delete Printer',
      'Are you sure you want to delete this printer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const printerDoc = doc(db, 'printers', id);
              await deleteDoc(printerDoc);
              Alert.alert('Success', 'Printer deleted successfully');
            } catch (error) {
              console.error('Error deleting printer: ', error);
              Alert.alert('Error', 'Failed to delete printer');
            }
          }
        }
      ]
    );
  };

  const updatePrinterStatus = async (printerId: string, newStatus: 'working' | 'not-working') => {
    try {
      const printerDoc = doc(db, 'printers', printerId);
      await updateDoc(printerDoc, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      Alert.alert('Success', `Printer status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating printer status: ', error);
      Alert.alert('Error', 'Failed to update printer status');
    }
  };

  const InkBar = ({ percentage }: { percentage: number }) => (
    <View style={styles.inkBar}>
      <View style={styles.inkProgress}>
        <View
          style={[
            styles.inkFill,
            { width: `${percentage}%`, backgroundColor: percentage > 10 ? '#28a745' : '#dc3545' }
          ]}
        />
      </View>
      <Text style={styles.inkPercentage}>{percentage}%</Text>
    </View>
  );

  const PrinterCard = ({ printer }: { printer: Printer }) => (
    <View style={[
      styles.printerCard,
      printer.status === 'not-working' && styles.printerCardNotWorking,
      printer.inkLevel <= 10 && styles.printerCardLowInk
    ]}>
      <View style={styles.printerHeader}>
        <View>
          <Text style={styles.printerName}>{printer.name}</Text>
          <Text style={styles.printerModel}>{printer.model}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.statusBadge,
            printer.status === 'working' ? styles.statusWorking : styles.statusNotWorking
          ]}
          onPress={() => updatePrinterStatus(
            printer.id,
            printer.status === 'working' ? 'not-working' : 'working'
          )}
        >
          <Text style={[
            styles.statusText,
            printer.status === 'working' ? styles.statusTextWorking : styles.statusTextNotWorking
          ]}>
            {printer.status === 'working' ? '✅ Working' : '❌ Not Working'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.printerInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>📍 Location:</Text>
          <View style={styles.locationTag}>
            <Text style={styles.locationText}>{printer.location}</Text>
          </View>
        </View>
      </View>

      <View style={styles.inkLevels}>
        <Text style={styles.infoLabel}>Ink Level:</Text>
        <InkBar percentage={printer.inkLevel || 0} />
      </View>

      {printer.remarks && (
        <View style={styles.remarks}>
          <Text style={styles.remarksText}>💬 {printer.remarks}</Text>
        </View>
      )}

      <View style={styles.printerActions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.editBtn]}
          onPress={() => openModal(printer.id)}
        >
          <Text style={styles.actionBtnText}>✏️ Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => deletePrinter(printer.id)}
        >
          <Text style={styles.actionBtnText}>🗑️ Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const FilterButton = ({ title, filter, active, onPress }: { title: string, filter: string, active: boolean, onPress: () => void }) => (
    <TouchableOpacity
      style={[styles.filterBtn, active && styles.filterBtnActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterBtnText, active && styles.filterBtnTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading printers...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#2c3e50" barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>🖨️ Printer Management</Text>
        <Text style={styles.headerSubtitle}>
          Centralized printer monitoring
        </Text>
      </View>

      <View style={styles.controls}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search printers..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />

        <View style={styles.filterControls}>
          <FilterButton
            title="All"
            filter="all"
            active={currentFilter === 'all'}
            onPress={() => setCurrentFilter('all')}
          />
          <FilterButton
            title="Working"
            filter="working"
            active={currentFilter === 'working'}
            onPress={() => setCurrentFilter('working')}
          />
          <FilterButton
            title="Not Working"
            filter="not-working"
            active={currentFilter === 'not-working'}
            onPress={() => setCurrentFilter('not-working')}
          />
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={() => openModal()}>
          <Text style={styles.addBtnText}>+ Add Printer</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredPrinters}
        renderItem={({ item }) => <PrinterCard printer={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.printersList}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingPrinterId ? 'Edit Printer' : 'Add New Printer'}
                </Text>
                <TouchableOpacity onPress={closeModal}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Printer Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Enter printer name"
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.formLabel}>Model *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.model}
                    onChangeText={(text) => setFormData({ ...formData, model: text })}
                    placeholder="Enter model"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Status *</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                      style={styles.picker}
                    >
                      <Picker.Item label="Working" value="working" />
                      <Picker.Item label="Not Working" value="not-working" />
                    </Picker>
                  </View>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Location *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.location}
                  onChangeText={(text) => setFormData({ ...formData, location: text })}
                  placeholder="Enter location"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Ink Level (%)</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.inkLevel.toString()}
                  onChangeText={(text) => setFormData({
                    ...formData,
                    inkLevel: parseInt(text) || 0
                  })}
                  keyboardType="numeric"
                  placeholder="0-100"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Remarks</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={formData.remarks}
                  onChangeText={(text) => setFormData({ ...formData, remarks: text })}
                  placeholder="Any additional notes or remarks..."
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={savePrinter}>
                <Text style={styles.submitBtnText}>Save Printer</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#667eea',
  },
  header: {
    backgroundColor: '#2c3e50',
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ecf0f1',
    opacity: 0.9,
  },
  controls: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  searchInput: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#e9ecef',
    fontSize: 16,
    marginBottom: 15,
  },
  filterControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  filterBtn: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  filterBtnActive: {
    backgroundColor: '#667eea',
  },
  filterBtnText: {
    color: 'white',
    fontWeight: '500',
  },
  filterBtnTextActive: {
    color: 'white',
  },
  addBtn: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  addBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  printersList: {
    padding: 15,
  },
  printerCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderLeftWidth: 5,
    borderLeftColor: '#667eea',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  printerCardNotWorking: {
    borderLeftColor: '#dc3545',
  },
  printerCardLowInk: {
    borderLeftColor: '#ffc107',
  },
  printerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  printerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 3,
  },
  printerModel: {
    fontSize: 14,
    color: '#6c757d',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusWorking: {
    backgroundColor: '#d4edda',
  },
  statusNotWorking: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusTextWorking: {
    color: '#155724',
  },
  statusTextNotWorking: {
    color: '#721c24',
  },
  printerInfo: {
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontWeight: '600',
    color: '#495057',
  },
  locationTag: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
  },
  locationText: {
    color: '#495057',
    fontSize: 12,
  },
  inkLevels: {
    marginVertical: 10,
  },
  inkBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inkProgress: {
    flex: 1,
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginRight: 10,
  },
  inkFill: {
    height: '100%',
    borderRadius: 4,
  },
  inkPercentage: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 35,
  },
  remarks: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#667eea',
  },
  remarksText: {
    fontStyle: 'italic',
    color: '#6c757d',
  },
  printerActions: {
    flexDirection: 'row',
    marginTop: 15,
  },
  actionBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  editBtn: {
    backgroundColor: '#007bff',
  },
  deleteBtn: {
    backgroundColor: '#dc3545',
  },
  actionBtnText: {
    color: 'white',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 15,
    padding: 20,
    maxHeight: '90%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  closeBtn: {
    fontSize: 24,
    color: '#aaa',
    fontWeight: 'bold',
  },
  formGroup: {
    marginBottom: 15,
  },
  formRow: {
    flexDirection: 'row',
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  picker: {
    height: 50,
  },
  submitBtn: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default App;