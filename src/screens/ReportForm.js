import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  Text,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Geolocation from '@react-native-community/geolocation';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';

const ReportForm = ({ navigation }) => {
  // State management
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);

  const [showMap, setShowMap] = useState(false);
  const [tempLocation, setTempLocation] = useState(null);
  const [locationType, setLocationType] = useState('auto');
  const [webViewKey, setWebViewKey] = useState(0);

  // Colors
  const colors = {
    primary: '#2196F3',
    secondary: '#64B5F6',
    background: '#FFFFFF',
    text: '#333333',
    lightGray: '#E0E0E0',
    darkGray: '#757575',
    error: '#F44336',
    success: '#4CAF50',
  };

  useEffect(() => {
    const loadUserName = async () => {
      const name = await AsyncStorage.getItem('userName');
      setUserName(name || '');
    };
    loadUserName();
  }, []);

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocation(newLocation);
        setTempLocation(newLocation);
        setLocationType('auto');
        // Force WebView refresh when location changes
        setWebViewKey(prev => prev + 1);
      },
      (error) => {
        console.error('Location error:', error);
        Alert.alert(
          'Location Error',
          `Error Code: ${error.code}\nMessage: ${error.message}`,
          [{ text: 'OK' }]
        );
      },
      { enableHighAccuracy: false, timeout: 30000, maximumAge: 10000 }
    );
  };

  const handleImagePicker = async (type) => {
    const options = {
      mediaType: 'photo',
      quality: 1,
      maxWidth: 1280,
      maxHeight: 1280,
    };

    try {
      const response = type === 'camera' 
        ? await launchCamera(options)
        : await launchImageLibrary(options);

      if (response.assets && response.assets[0]) {
        setImage(response.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSubmit = async () => {
    if (!image || !description || !location) {
      Alert.alert('Missing Information', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      const formData = new FormData();
      formData.append('image', {
        uri: image.uri,
        type: image.type || 'image/jpeg',
        name: image.fileName || 'photo.jpg',
      });
      formData.append('description', description);
      formData.append('latitude', location.latitude);
      formData.append('longitude', location.longitude);

      const response = await axios.post('http://192.168.1.111:8000/api/reports/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      navigation.replace('Home', {
        newReport: response.data,
        focusLocation: {
          latitude: location.latitude,
          longitude: location.longitude
        }
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  // Custom button component for consistency
  const CustomButton = ({ onPress, icon, title, style }) => (
    <TouchableOpacity
      style={[styles.customButton, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={24} color="#FFFFFF" />
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );


  // Function to generate the HTML content for the Leaflet map
  const generateMapHTML = () => {
    const initialLat = tempLocation?.latitude || 0;
    const initialLng = tempLocation?.longitude || 0;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
            body { margin: 0; padding: 0; }
            #map { width: 100vw; height: 100vh; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            // Initialize the map
            var map = L.map('map').setView([19.1334, 72.9133], 15);
            
            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            // Add a draggable marker
            var marker = L.marker([${initialLat}, ${initialLng}], {
              draggable: true
            }).addTo(map);

            // Handle marker drag events
            marker.on('dragend', function(event) {
              var position = marker.getLatLng();
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'location',
                latitude: position.lat,
                longitude: position.lng
              }));
            });

            // Handle map click events
            map.on('click', function(event) {
              var latlng = event.latlng;
              marker.setLatLng(latlng);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'location',
                latitude: latlng.lat,
                longitude: latlng.lng
              }));
            });
          </script>
        </body>
      </html>
    `;
  };

  // Handle messages from WebView
  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'location') {
        setTempLocation({
          latitude: data.latitude,
          longitude: data.longitude,
        });
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  // Confirm location from map
  const confirmMapLocation = () => {
    setLocation(tempLocation);
    setLocationType('manual');
    setShowMap(false);
  };

  // Map Modal Component using Leaflet
  const MapModal = () => (
    <Modal
      animationType="slide"
      transparent={false}
      visible={showMap}
      onRequestClose={() => setShowMap(false)}
    >
      <View style={styles.mapContainer}>
        <WebView
          key={webViewKey}
          source={{ html: generateMapHTML() }}
          onMessage={handleWebViewMessage}
          style={styles.map}
        />
        <View style={styles.mapButtons}>
          <TouchableOpacity
            style={[styles.mapButton, { backgroundColor: colors.error }]}
            onPress={() => setShowMap(false)}
          >
            <Text style={styles.mapButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mapButton, { backgroundColor: colors.success }]}
            onPress={confirmMapLocation}
          >
            <Text style={styles.mapButtonText}>Confirm Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Location Section Component
  const LocationSection = () => (
    <View style={styles.section}>
      <View style={styles.locationHeader}>
        <Ionicons name="location-outline" size={24} color={colors.primary} />
        <Text style={styles.label}>Location</Text>
      </View>
      
      <View style={styles.locationButtons}>
        <CustomButton
          icon="navigate-outline"
          title="Use Current Location"
          onPress={getCurrentLocation}
          style={[
            styles.locationButton,
            locationType === 'auto' && styles.activeLocationButton
          ]}
        />
        <CustomButton
          icon="map-outline"
          title="Choose on Map"
          onPress={() => setShowMap(true)}
          style={[
            styles.locationButton,
            locationType === 'manual' && styles.activeLocationButton
          ]}
        />
      </View>

      {location && (
        <View style={styles.locationInfo}>
          <Text style={styles.locationText}>
            Latitude: {location.latitude.toFixed(6)}
          </Text>
          <Text style={styles.locationText}>
            Longitude: {location.longitude.toFixed(6)}
          </Text>
          <Text style={styles.locationTypeText}>
            {locationType === 'auto' ? 'Using current location' : 'Location selected from map'}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <View style={styles.headerSection}>
        <Ionicons name="person-circle-outline" size={40} color={colors.primary} />
        <View style={styles.headerText}>
          <Text style={styles.label}>Reported by</Text>
          <Text style={styles.userName}>{userName}</Text>
        </View>
      </View>

      {/* Description Section */}
      <View style={styles.section}>
        <Text style={styles.label}>
          Description <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          multiline
          numberOfLines={4}
          placeholder="Describe the garbage situation..."
          value={description}
          onChangeText={setDescription}
          placeholderTextColor={colors.darkGray}
        />
      </View>

      {/* Image Section */}
      <View style={styles.section}>
        <Text style={styles.label}>
          Photo <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.imageButtons}>
          <CustomButton
            icon="camera-outline"
            title="Take Photo"
            onPress={() => handleImagePicker('camera')}
            style={{ marginRight: 10 }}
          />
          {/* <CustomButton
            icon="images-outline"
            title="Gallery"
            onPress={() => handleImagePicker('gallery')}
          /> */}
        </View>
        
        {image && (
          <View style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: image.uri }}
              style={styles.preview}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setImage(null)}
            >
              <Ionicons name="close-circle" size={24} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Location Section */}
      {location && (
        <View style={styles.section}>
          <View style={styles.locationHeader}>
            <Ionicons name="location-outline" size={24} color={colors.primary} />
            <Text style={styles.label}>Location</Text>
          </View>
          <View style={styles.locationInfo}>
            <Text style={styles.locationText}>
              Latitude: {location.latitude.toFixed(6)}
            </Text>
            <Text style={styles.locationText}>
              Longitude: {location.longitude.toFixed(6)}
            </Text>
          </View>
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, (!image || !description || !location) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading || !image || !description || !location}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="send" size={24} color="#FFFFFF" style={styles.submitIcon} />
            <Text style={styles.submitButtonText}>Submit Report</Text>
          </>
        )}
      </TouchableOpacity>

      <LocationSection />
      <MapModal />

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    padding: 20,
    marginTop: 40,

  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerText: {
    marginLeft: 15,
  },
  section: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  required: {
    color: '#F44336',
  },
  userName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#2196F3',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 15,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 16,
    backgroundColor: '#F5F5F5',
  },
  imageButtons: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  customButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 12,
    elevation: 2,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationInfo: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 12,
  },
  locationText: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 5,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#A5D6A7',
    elevation: 0,
  },
  submitIcon: {
    marginRight: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'black',
  },
  map: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  mapButtons: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1000,
  },
  mapButton: {
    flex: 0.48,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  mapButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  locationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  locationButton: {
    flex: 0.48,
  },
  activeLocationButton: {
    backgroundColor: '#1976D2',
  },
  locationTypeText: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
    marginTop: 5,
  },
});

export default ReportForm;