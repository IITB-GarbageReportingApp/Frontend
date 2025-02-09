// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   TextInput,
//   TouchableOpacity,
//   Image,
//   StyleSheet,
//   Alert,
//   ScrollView,
//   Text,
//   ActivityIndicator,
// } from 'react-native';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
// import Geolocation from '@react-native-community/geolocation';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const ReportForm = ({ navigation }) => {
//   // State management
//   const [description, setDescription] = useState('');
//   const [image, setImage] = useState(null);
//   const [location, setLocation] = useState(null);
//   const [userName, setUserName] = useState('');
//   const [loading, setLoading] = useState(false);

//   // Colors
//   const colors = {
//     primary: '#2196F3',
//     secondary: '#64B5F6',
//     background: '#FFFFFF',
//     text: '#333333',
//     lightGray: '#E0E0E0',
//     darkGray: '#757575',
//     error: '#F44336',
//     success: '#4CAF50',
//   };

//   useEffect(() => {
//     const loadUserName = async () => {
//       const name = await AsyncStorage.getItem('userName');
//       setUserName(name || '');
//     };
//     loadUserName();
//     getCurrentLocation();
//   }, []);

//   const getCurrentLocation = () => {
//     Geolocation.getCurrentPosition(
//       (position) => {
//         setLocation({
//           latitude: position.coords.latitude,
//           longitude: position.coords.longitude,
//         });
//       },
//       (error) => {
//         console.error('Location error:', error);
//         Alert.alert(
//           'Location Error',
//           `Error Code: ${error.code}\nMessage: ${error.message}`,
//           [{ text: 'OK' }]
//         );
//       },
//       { enableHighAccuracy: false, timeout: 300000, maximumAge: 10000 }
//     );
//   };

//   const handleImagePicker = async (type) => {
//     const options = {
//       mediaType: 'photo',
//       quality: 1,
//       maxWidth: 1280,
//       maxHeight: 1280,
//     };

//     try {
//       const response = type === 'camera' 
//         ? await launchCamera(options)
//         : await launchImageLibrary(options);

//       if (response.assets && response.assets[0]) {
//         setImage(response.assets[0]);
//       }
//     } catch (error) {
//       Alert.alert('Error', 'Failed to pick image');
//     }
//   };

//   const handleSubmit = async () => {
//     if (!image || !description || !location) {
//       Alert.alert('Missing Information', 'Please fill all required fields');
//       return;
//     }

//     setLoading(true);
//     try {
//       const token = await AsyncStorage.getItem('userToken');
      
//       const formData = new FormData();
//       formData.append('image', {
//         uri: image.uri,
//         type: image.type || 'image/jpeg',
//         name: image.fileName || 'photo.jpg',
//       });
//       formData.append('description', description);
//       formData.append('latitude', location.latitude);
//       formData.append('longitude', location.longitude);

//       const response = await axios.post('https://api.iitbcleanandgreen.in/api/reports/', formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       navigation.replace('Home', {
//         newReport: response.data,
//         focusLocation: {
//           latitude: location.latitude,
//           longitude: location.longitude
//         }
//       });
//     } catch (error) {
//       Alert.alert('Error', 'Failed to submit report');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Custom button component for consistency
//   const CustomButton = ({ onPress, icon, title, style }) => (
//     <TouchableOpacity
//       style={[styles.customButton, style]}
//       onPress={onPress}
//       activeOpacity={0.8}
//     >
//       <Ionicons name={icon} size={24} color="#FFFFFF" />
//       <Text style={styles.buttonText}>{title}</Text>
//     </TouchableOpacity>
//   );

//   return (
//     <ScrollView 
//       style={styles.scrollView}
//       contentContainerStyle={styles.container}
//       showsVerticalScrollIndicator={false}
//     >
//       {/* Header Section */}
//       <View style={styles.headerSection}>
//         <Ionicons name="person-circle-outline" size={40} color={colors.primary} />
//         <View style={styles.headerText}>
//           <Text style={styles.label}>Reported by</Text>
//           <Text style={styles.userName}>{userName}</Text>
//         </View>
//       </View>

//       {/* Description Section */}
//       <View style={styles.section}>
//         <Text style={styles.label}>
//           Description <Text style={styles.required}>*</Text>
//         </Text>
//         <TextInput
//           style={styles.input}
//           multiline
//           numberOfLines={4}
//           placeholder="Describe the garbage situation..."
//           value={description}
//           onChangeText={setDescription}
//           placeholderTextColor={colors.darkGray}
//         />
//       </View>

//       {/* Image Section */}
//       <View style={styles.section}>
//         <Text style={styles.label}>
//           Photo <Text style={styles.required}>*</Text>
//         </Text>
//         <View style={styles.imageButtons}>
//           <CustomButton
//             icon="camera-outline"
//             title="Take Photo"
//             onPress={() => handleImagePicker('camera')}
//             style={{ marginRight: 10 }}
//           />
//           {/* <CustomButton
//             icon="images-outline"
//             title="Gallery"
//             onPress={() => handleImagePicker('gallery')}
//           /> */}
//         </View>
        
//         {image && (
//           <View style={styles.imagePreviewContainer}>
//             <Image
//               source={{ uri: image.uri }}
//               style={styles.preview}
//               resizeMode="cover"
//             />
//             <TouchableOpacity
//               style={styles.removeImageButton}
//               onPress={() => setImage(null)}
//             >
//               <Ionicons name="close-circle" size={24} color={colors.error} />
//             </TouchableOpacity>
//           </View>
//         )}
//       </View>

//       {/* Location Section */}
//       {location && (
//         <View style={styles.section}>
//           <View style={styles.locationHeader}>
//             <Ionicons name="location-outline" size={24} color={colors.primary} />
//             <Text style={styles.label}>Location</Text>
//           </View>
//           <View style={styles.locationInfo}>
//             <Text style={styles.locationText}>
//               Latitude: {location.latitude.toFixed(6)}
//             </Text>
//             <Text style={styles.locationText}>
//               Longitude: {location.longitude.toFixed(6)}
//             </Text>
//           </View>
//         </View>
//       )}

//       {/* Submit Button */}
//       <TouchableOpacity
//         style={[styles.submitButton, (!image || !description || !location) && styles.submitButtonDisabled]}
//         onPress={handleSubmit}
//         disabled={loading || !image || !description || !location}
//       >
//         {loading ? (
//           <ActivityIndicator color="#FFFFFF" />
//         ) : (
//           <>
//             <Ionicons name="send" size={24} color="#FFFFFF" style={styles.submitIcon} />
//             <Text style={styles.submitButtonText}>Submit Report</Text>
//           </>
//         )}
//       </TouchableOpacity>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   scrollView: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//   },
//   container: {
//     padding: 20,
//     marginTop: 40,

//   },
//   headerSection: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 20,
//     paddingBottom: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: '#E0E0E0',
//   },
//   headerText: {
//     marginLeft: 15,
//   },
//   section: {
//     marginBottom: 25,
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333333',
//     marginBottom: 4,
//   },
//   required: {
//     color: '#F44336',
//   },
//   userName: {
//     fontSize: 18,
//     fontWeight: '500',
//     color: '#2196F3',
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: '#E0E0E0',
//     borderRadius: 12,
//     padding: 15,
//     minHeight: 120,
//     textAlignVertical: 'top',
//     fontSize: 16,
//     backgroundColor: '#F5F5F5',
//   },
//   imageButtons: {
//     flexDirection: 'row',
//     marginBottom: 15,
//   },
//   customButton: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#2196F3',
//     padding: 12,
//     borderRadius: 12,
//     elevation: 2,
//   },
//   buttonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '500',
//     marginLeft: 8,
//   },
//   imagePreviewContainer: {
//     position: 'relative',
//     borderRadius: 12,
//     overflow: 'hidden',
//     elevation: 3,
//   },
//   preview: {
//     width: '100%',
//     height: 200,
//     borderRadius: 12,
//   },
//   removeImageButton: {
//     position: 'absolute',
//     top: 10,
//     right: 10,
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//   },
//   locationHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 10,
//   },
//   locationInfo: {
//     backgroundColor: '#F5F5F5',
//     padding: 15,
//     borderRadius: 12,
//   },
//   locationText: {
//     fontSize: 15,
//     color: '#666666',
//     marginBottom: 5,
//   },
//   submitButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#4CAF50',
//     padding: 16,
//     borderRadius: 12,
//     elevation: 3,
//     marginTop: 10,
//   },
//   submitButtonDisabled: {
//     backgroundColor: '#A5D6A7',
//     elevation: 0,
//   },
//   submitIcon: {
//     marginRight: 10,
//   },
//   submitButtonText: {
//     color: '#FFFFFF',
//     fontSize: 18,
//     fontWeight: '600',
//   },
// });

// export default ReportForm;




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
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import VideoPlayer from 'react-native-video-player'; // You'll need to install this package

import Geolocation from '@react-native-community/geolocation';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import zoneData from './zone.json';

const ReportForm = ({ navigation }) => {
  // State management
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);
  const [location, setLocation] = useState(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);

  const [showMap, setShowMap] = useState(false);
  const [tempLocation, setTempLocation] = useState(null);
  const [locationType, setLocationType] = useState('auto');
  const [webViewKey, setWebViewKey] = useState(0);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);


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

  useEffect(() => {
    const initializeLocation = async () => {
      Geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setLocation(newLocation);
          setTempLocation(newLocation);
          setLocationType('auto');
        },
        (error) => {
          console.error('Initial location error:', error);
          // Set default location if getting current location fails
          const defaultLocation = {
            latitude: 19.1334,
            longitude: 72.9133,
          };
          setLocation(defaultLocation);
          setTempLocation(defaultLocation);
        },
        { enableHighAccuracy: false, timeout: 30000, maximumAge: 10000 }
      );
    };

    initializeLocation();
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

  const requestCameraPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'We need access to your camera to take photos of the garbage situation.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setHasCameraPermission(true);
          return true;
        } else {
          Alert.alert(
            'Permission Denied',
            'We need camera access to take photos. Please enable it in your device settings.',
            [{ text: 'OK' }]
          );
          return false;
        }
      } else if (Platform.OS === 'ios') {
        // For iOS, the permission request is handled by image picker
        return true;
      }
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  // Modified handleImagePicker function with permission check
  const handleImagePicker = async (type) => {
    if (type === 'camera') {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return;
    }

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
      if (error.code === 'E_PICKER_CANCELLED') {
        // User cancelled the picker
        return;
      }
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleVideoPicker = async (type) => {
    const options = {
      mediaType: 'video',
      videoQuality: 'medium',
      durationLimit: 30, // Limit video length to 30 seconds
    };

    try {
      const response = type === 'camera' 
        ? await launchCamera(options)
        : await launchImageLibrary(options);

      if (response.assets && response.assets[0]) {
        setVideo(response.assets[0]);
      }
    } catch (error) {
      if (error.code === 'E_PICKER_CANCELLED') {
        return;
      }
      Alert.alert('Error', 'Failed to capture video. Please try again.');
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
      // const userId = await AsyncStorage.getItem('userId');
      // console.log(userId)
      
      const formData = new FormData();
      formData.append('image', {
        uri: image.uri,
        type: image.type || 'image/jpeg',
        name: image.fileName || 'photo.jpg',
      });

      if (video) {
        formData.append('video', {
          uri: video.uri,
          type: video.type || 'video/mp4',
          name: video.fileName || 'video.mp4',
        });
      }

      formData.append('description', description);
      formData.append('latitude', location.latitude);
      formData.append('longitude', location.longitude);


      const response = await axios.post('https://api.iitbcleanandgreen.in/api/reports/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      navigation.replace('Home', {
        newReport: response.data,
        focusLocation: {
          latitude: 19.1334,
          longitude: 72.9133
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
    const initialLat = tempLocation?.latitude || 19.1334;
    const initialLng = tempLocation?.longitude || 72.9133;
  
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
            body { padding: 0; margin: 0; }
            #map { width: 100%; height: 100vh; }
            .custom-marker {
              width: 30px;
              height: 30px;
              background: white;
              border: 2px solid #ff4444;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
            }
            .marker-inner {
              width: 8px;
              height: 8px;
              background: #ff4444;
              border-radius: 50%;
            }
            .zone-popup {
              font-size: 14px;
              line-height: 1.4;
            }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            // Store the zone data globally
            const zones = ${JSON.stringify(zoneData)};
  
            function getZoneColor(zoneNumber) {
              const colors = [
                '#2196F3', '#4CAF50', '#FFC107', '#9C27B0', '#FF5722',
                '#00BCD4', '#3F51B5', '#E91E63', '#8BC34A', '#FF9800',
                '#009688', '#673AB7', '#795548', '#607D8B', '#F44336', 'grey'
              ];
              return colors[(zoneNumber - 1) % colors.length];
            }
  
            // Initialize the map
            const map = L.map('map', {
              zoomControl: false,
              attributionControl: true
            }).setView([${initialLat}, ${initialLng}], 15);
            
            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors'
            }).addTo(map);
  
            // Add zones
            const zoneLayer = L.geoJSON(zones, {
              style: function(feature) {
                return {
                  fillColor: getZoneColor(feature.properties.Zone_No),
                  weight: 2,
                  opacity: 1,
                  color: 'white',
                  fillOpacity: 0.5
                };
              },
              onEachFeature: function(feature, layer) {
                const popupContent = \`
                  <div class="zone-popup">
                    <strong>\${feature.properties.Zone_Name}</strong><br>
                    Area: \${feature.properties.Area_Name}<br>
                    J.E.: \${feature.properties.J_E}<br>
                    Remarks: \${feature.properties.remark}
                  </div>
                \`;
                layer.bindPopup(popupContent);
                
                layer.on('mouseover', function (e) {
                  this.setStyle({
                    fillOpacity: 0.6
                  });
                  this.openPopup();
                });
                
                layer.on('mouseout', function (e) {
                  this.setStyle({
                    fillOpacity: 0.3
                  });
                  this.closePopup();
                });
              }
            }).addTo(map);

            // Add zoom control to bottom right
            L.control.zoom({
              position: 'bottomright'
            }).addTo(map);
  
            // Add a draggable marker
            const customIcon = L.divIcon({
              className: 'custom-marker',
              html: '<div class="marker-inner"></div>',
              iconSize: [20, 20],
              iconAnchor: [15, 15]
            });
  
            const marker = L.marker([${initialLat}, ${initialLng}], {
              draggable: true,
              icon: customIcon
            }).addTo(map);

                        map.setView([${initialLat}, ${initialLng}], 16);

  
            // Handle marker drag events
            marker.on('dragend', function(event) {
              const position = marker.getLatLng();
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'location',
                latitude: position.lat,
                longitude: position.lng
              }));
            });
  
            // Handle map click events
            map.on('click', function(event) {
              const latlng = event.latlng;
              marker.setLatLng(latlng);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'location',
                latitude: latlng.lat,
                longitude: latlng.lng
              }));
            });
  
            // Fit map to zones bounds
map.on('load', function() {
            map.fitBounds(zoneLayer.getBounds());
          });          </script>
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

  // Add this section in your return statement after the Image Section
  const VideoSection = () => (
    <View style={styles.section}>
      <Text style={styles.label}>
        Video (Optional)
      </Text>
      <View style={styles.imageButtons}>
        <CustomButton
          icon="videocam-outline"
          title="Record Video"
          onPress={() => handleVideoPicker('camera')}
          style={{ marginRight: 10 }}
        />
      </View>
      
      {video && (
        <View style={styles.videoPreviewContainer}>
          <VideoPlayer
            video={{ uri: video.uri }}
            videoWidth={1280}
            videoHeight={720}
            thumbnail={{ uri: video.thumbnail }}
          />
          <TouchableOpacity
            style={styles.removeVideoButton}
            onPress={() => setVideo(null)}
          >
            <Ionicons name="close-circle" size={24} color={colors.error} />
          </TouchableOpacity>
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

      <VideoSection />


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
  videoPreviewContainer: {
    marginTop: 10,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  removeVideoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 12,
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
    marginTop: 20,
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