// WorkTrackerApp - aplikacja do zapisywania godzin pracy

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Alert,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function App() {
  const [date, setDate] = useState(new Date());
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');
  const [entries, setEntries] = useState([]);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDay, setCurrentDay] = useState('');
  const [weather, setWeather] = useState('');

  useEffect(() => {
    loadData();
    updateDateTime();
    fetchWeather();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    saveData(entries);
  }, [entries]);

  const updateDateTime = () => {
    const now = new Date();
    setCurrentTime(now.toLocaleTimeString());
    setCurrentDay(now.toLocaleDateString('pl-PL', { weekday: 'long' }));
  };

  const fetchWeather = async () => {
    try {
      const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=51.1523&longitude=17.1903&current=temperature_2m,weathercode&timezone=Europe%2FWarsaw");
      const data = await res.json();
      const temp = data.current.temperature_2m;
      const code = data.current.weathercode;

      const descriptionMap = {
        0: 'Bezchmurnie', 1: 'Głównie bezchmurnie', 2: 'Częściowo pochmurno', 3: 'Zachmurzenie duże',
        45: 'Mgła', 48: 'Osadzająca się mgła', 51: 'Lekka mżawka', 53: 'Mżawka', 55: 'Gęsta mżawka',
        61: 'Lekki deszcz', 63: 'Deszcz', 65: 'Silny deszcz', 80: 'Przelotny deszcz',
        81: 'Umiarkowane przelotne opady', 82: 'Silne przelotne opady'
      };

      const iconMap = {
        0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
        51: '🌦️', 53: '🌧️', 55: '🌧️', 61: '🌦️', 63: '🌧️', 65: '🌧️',
        80: '🌧️', 81: '🌧️', 82: '⛈️'
      };

      const description = descriptionMap[code] || 'Nieznana pogoda';
      const icon = iconMap[code] || '❓';
      setWeather(`${icon} ${description}, ${temp.toFixed(1)}°C`);
    } catch (e) {
      console.log('Nie udało się pobrać pogody');
    }
  };

  const saveData = async (data) => {
    try {
      await AsyncStorage.setItem('workEntries', JSON.stringify(data));
    } catch (e) {
      console.log('Błąd zapisu', e);
    }
  };

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem('workEntries');
      if (saved) setEntries(JSON.parse(saved));
    } catch (e) {
      console.log('Błąd odczytu', e);
    }
  };

  const handleAddEntry = () => {
    if (!hours) return;
    const newEntry = {
      id: Date.now().toString(),
      date: date.toLocaleDateString(),
      hours: parseFloat(hours),
      description,
    };
    setEntries([newEntry, ...entries]);
    setHours('');
    setDescription('');
  };

  const handleDeleteEntry = (id) => {
    Alert.alert('Usuń wpis', 'Czy na pewno chcesz usunąć ten wpis?', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: () => {
          const updated = entries.filter((e) => e.id !== id);
          setEntries(updated);
        },
      },
    ]);
  };

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);

  return (
    <LinearGradient colors={["#e0c3fc", "#8ec5fc"]} style={styles.safeArea}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Animatable.Text animation="fadeInDown" style={styles.header}>Work Tracker</Animatable.Text>

          <TouchableOpacity onPress={() => setPickerVisible(true)} style={styles.dateButton}>
            <Text style={styles.dateButtonText}>Wybierz datę: {date.toLocaleDateString()}</Text>
          </TouchableOpacity>

          <DateTimePickerModal
            isVisible={isPickerVisible}
            mode="date"
            onConfirm={(selectedDate) => {
              setPickerVisible(false);
              setDate(selectedDate);
            }}
            onCancel={() => setPickerVisible(false)}
          />

          <Animatable.View animation="fadeInUp" delay={100}>
            <TextInput
              style={styles.input}
              placeholder="Ile godzin?"
              keyboardType="numeric"
              value={hours}
              onChangeText={setHours}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Opis dnia..."
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
            />
          </Animatable.View>

          <Animatable.View animation="pulse" iterationCount="infinite">
            <TouchableOpacity style={styles.addButton} onPress={handleAddEntry}>
              <Text style={styles.addButtonText}>Dodaj wpis</Text>
            </TouchableOpacity>
          </Animatable.View>

          <Text style={styles.total}>Suma godzin: {totalHours.toFixed(2)}</Text>

          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity onLongPress={() => handleDeleteEntry(item.id)}>
                <Animatable.View animation="fadeIn" style={styles.entry}>
                  <Text style={styles.entryDate}>{item.date}</Text>
                  <Text style={styles.entryHours}>{item.hours}h</Text>
                  <Text style={styles.entryDesc}>{item.description}</Text>
                </Animatable.View>
              </TouchableOpacity>
            )}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Dzisiaj: {currentDay}, {currentTime}</Text>
            <Text style={styles.footerText}>Pogoda w Kiełczowie: {weather}</Text>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: 20 },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  dateButton: {
    backgroundColor: '#4c6ef5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  dateButtonText: { color: 'white', fontWeight: 'bold', textAlign: 'center' },
  input: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  textArea: { height: 80 },
  addButton: {
    backgroundColor: '#38b000',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  total: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  entry: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  entryDate: { fontWeight: 'bold', fontSize: 16 },
  entryHours: { fontSize: 16, color: '#333' },
  entryDesc: { fontSize: 14, color: '#555' },
  footer: {
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    marginTop: 10,
  },
  footerText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
});