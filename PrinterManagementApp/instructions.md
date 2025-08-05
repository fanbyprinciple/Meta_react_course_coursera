<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# Give me the full code and step by step tutorial in order to copy paste and make this application

I'll provide you with a complete step-by-step tutorial to create the React Native printer management app with Firebase integration. Here's everything you need:

## Step 1: Create New React Native Project

```bash
# Install React Native CLI (if not already installed)
npm install -g react-native-cli

# Create new project
npx react-native init PrinterManagementApp
cd PrinterManagementApp
```


## Step 2: Install Required Dependencies

```bash
# Install Firebase packages
npm install @react-native-firebase/app
npm install @react-native-firebase/firestore

# Install React Native Picker
npm install @react-native-picker/picker

# For iOS, install pods
cd ios && pod install && cd ..
```


## Step 3: Firebase Console Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project" or "Add project"
3. Enter project name: "printer-management"
4. Enable Google Analytics (optional)
5. Click "Create project"

### Configure Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode"
4. Select a location close to your users
5. Click "Done"

### Add Android App

1. Click "Add app" → Android icon
2. Enter package name: `com.printermanagementapp`
3. Download `google-services.json`
4. Place it in `android/app/` directory

### Add iOS App (if using iOS)

1. Click "Add app" → iOS icon
2. Enter bundle ID: `com.printermanagementapp`
3. Download `GoogleService-Info.plist`
4. Add it to your iOS project in Xcode

## Step 4: Configure Android

### android/build.gradle

```gradle
buildscript {
    ext {
        buildToolsVersion = "33.0.0"
        minSdkVersion = 21
        compileSdkVersion = 33
        targetSdkVersion = 33
        ndkVersion = "23.1.7779620"
    }
    dependencies {
        classpath("com.android.tools.build:gradle:7.3.1")
        classpath("com.facebook.react:react-native-gradle-plugin")
        classpath 'com.google.gms:google-services:4.3.15' // Add this line
    }
}
```


### android/app/build.gradle

Add at the bottom of the file:

```gradle
apply plugin: 'com.google.gms.google-services' // Add this line
```


## Step 5: Configure iOS (if using iOS)

### ios/Podfile

Add this line after `use_react_native!`:

```ruby
use_frameworks! :linkage => :static
```

Then run:

```bash
cd ios && pod install && cd ..
```


## Step 6: Complete App.js Code

Replace the contents of `App.js` with this complete code:

```javascript
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
import firestore from '@react-native-firebase/firestore';

const App = () => {
  const [printers, setPrinters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentFilter, setCurrentFilter] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPrinterId, setEditingPrinterId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    status: 'working',
    location: '',
    ink: { black: 100, cyan: 100, magenta: 100, yellow: 100 },
    remarks: ''
  });

  // Firebase collection reference
  const printersCollection = firestore().collection('printers');

  // Load printers from Firebase on app start
  useEffect(() => {
    const subscriber = printersCollection.onSnapshot(
      (querySnapshot) => {
        const printersData = [];
        querySnapshot.forEach((doc) => {
          printersData.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        setPrinters(printersData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching printers: ', error);
        Alert.alert('Error', 'Failed to load printers from database');
        setLoading(false);
      }
    );

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

  const openModal = (printerId = null) => {
    if (printerId) {
      const printer = printers.find(p => p.id === printerId);
      setFormData(printer);
      setEditingPrinterId(printerId);
    } else {
      setFormData({
        name: '',
        model: '',
        status: 'working',
        location: '',
        ink: { black: 100, cyan: 100, magenta: 100, yellow: 100 },
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
    if (!formData.name || !formData.model || !formData.location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const printerData = {
        ...formData,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      if (editingPrinterId) {
        await printersCollection.doc(editingPrinterId).update(printerData);
        Alert.alert('Success', 'Printer updated successfully');
      } else {
        printerData.createdAt = firestore.FieldValue.serverTimestamp();
        await printersCollection.add(printerData);
        Alert.alert('Success', 'Printer added successfully');
      }
      
      closeModal();
    } catch (error) {
      console.error('Error saving printer: ', error);
      Alert.alert('Error', 'Failed to save printer to database');
    }
  };

  const deletePrinter = (id) => {
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
              await printersCollection.doc(id).delete();
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

  const updatePrinterStatus = async (printerId, newStatus) => {
    try {
      await printersCollection.doc(printerId).update({
        status: newStatus,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      Alert.alert('Success', `Printer status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating printer status: ', error);
      Alert.alert('Error', 'Failed to update printer status');
    }
  };

  const InkBar = ({ color, percentage, colorCode }) => (
    <View style={styles.inkBar}>
      <View style={[styles.inkColor, { backgroundColor: colorCode }]} />
      <View style={styles.inkProgress}>
        <View 
          style={[
            styles.inkFill, 
            { width: `${percentage}%`, backgroundColor: colorCode }
          ]} 
        />
      </View>
      <Text style={styles.inkPercentage}>{percentage}%</Text>
    </View>
  );

  const PrinterCard = ({ printer }) => (
    <View style={[
      styles.printerCard, 
      printer.status === 'not-working' && styles.printerCardNotWorking
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
        <InkBar color="Black" percentage={printer.ink?.black || 0} colorCode="#000000" />
        <InkBar color="Cyan" percentage={printer.ink?.cyan || 0} colorCode="#00FFFF" />
        <InkBar color="Magenta" percentage={printer.ink?.magenta || 0} colorCode="#FF00FF" />
        <InkBar color="Yellow" percentage={printer.ink?.yellow || 0} colorCode="#FFFF00" />
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

  const FilterButton = ({ title, filter, active, onPress }) => (
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
          Centralized printer monitoring with Firebase
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
                  onChangeText={(text) => setFormData({...formData, name: text})}
                  placeholder="Enter printer name"
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.formLabel}>Model *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.model}
                    onChangeText={(text) => setFormData({...formData, model: text})}
                    placeholder="Enter model"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Status *</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={formData.status}
                      onValueChange={(value) => setFormData({...formData, status: value})}
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
                  onChangeText={(text) => setFormData({...formData, location: text})}
                  placeholder="Enter location"
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.formLabel}>Black Ink (%)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.ink.black.toString()}
                    onChangeText={(text) => setFormData({
                      ...formData, 
                      ink: {...formData.ink, black: parseInt(text) || 0}
                    })}
                    keyboardType="numeric"
                    placeholder="0-100"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Cyan Ink (%)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.ink.cyan.toString()}
                    onChangeText={(text) => setFormData({
                      ...formData, 
                      ink: {...formData.ink, cyan: parseInt(text) || 0}
                    })}
                    keyboardType="numeric"
                    placeholder="0-100"
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.formLabel}>Magenta Ink (%)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.ink.magenta.toString()}
                    onChangeText={(text) => setFormData({
                      ...formData, 
                      ink: {...formData.ink, magenta: parseInt(text) || 0}
                    })}
                    keyboardType="numeric"
                    placeholder="0-100"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Yellow Ink (%)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.ink.yellow.toString()}
                    onChangeText={(text) => setFormData({
                      ...formData, 
                      ink: {...formData.ink, yellow: parseInt(text) || 0}
                    })}
                    keyboardType="numeric"
                    placeholder="0-100"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Remarks</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={formData.remarks}
                  onChangeText={(text) => setFormData({...formData, remarks: text})}
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
  inkColor: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    marginRight: 10,
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
```


## Step 7: Update package.json

Make sure your `package.json` includes these dependencies:

```json
{
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.72.6",
    "@react-native-firebase/app": "^18.6.1",
    "@react-native-firebase/firestore": "^18.6.1",
    "@react-native-picker/picker": "^2.4.10"
  }
}
```


## Step 8: Set Firebase Security Rules

In Firebase Console, go to Firestore Database → Rules and set:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /printers/{document} {
      allow read, write: if true; // Allow all for testing
    }
  }
}
```


## Step 9: Run the Application

```bash
# For Android
npx react-native run-android

# For iOS (Mac only)
npx react-native run-ios
```


## Step 10: Test the Application

1. **Add a Printer**: Tap the green "Add Printer" button
2. **Fill Form**: Enter printer name, model, location, ink levels
3. **Save**: Data will be stored in Firebase
4. **Edit**: Tap edit button on any printer card
5. **Delete**: Tap delete button with confirmation
6. **Search**: Use search bar to filter printers
7. **Filter**: Use status filter buttons

## Troubleshooting

### Common Issues:

1. **Firebase not connecting**:
    - Check `google-services.json` is in `android/app/`
    - Verify package name matches Firebase configuration
2. **Build errors**:

```bash
# Clean and rebuild
cd android && ./gradlew clean && cd ..
npx react-native run-android
```

3. **iOS issues**:

```bash
cd ios && pod install && cd ..
npx react-native run-ios
```

4. **Metro bundler issues**:

```bash
npx react-native start --reset-cache
```


## Features Available:

✅ **Real-time sync** across all devices
✅ **Add/Edit/Delete** printers
✅ **Search and filter** functionality
✅ **Ink level monitoring** with visual bars
✅ **Status management** (Working/Not Working)
✅ **Location tracking** and remarks
✅ **Offline support** (Firebase handles this automatically)
✅ **Cross-platform** (iOS and Android)

The app is now ready to use with centralized Firebase storage!

