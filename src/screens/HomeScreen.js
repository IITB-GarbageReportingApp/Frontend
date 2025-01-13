import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  Modal,
  Image,
  Dimensions,
  ScrollView,
  Alert,
  StatusBar,
  Animated,
  Platform,
  BlurView
} from 'react-native';
import { WebView } from 'react-native-webview';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const webViewRef = useRef(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const routeParams = navigation.getState()?.routes?.find(route => route.name === 'Home')?.params;

  const slideAnim = useRef(new Animated.Value(height)).current;


  useEffect(() => {
    if (routeParams?.newReport && routeParams?.focusLocation) {
      const handleNewReport = async () => {
        await fetchReports();
        if (isMapReady) {
          const { latitude, longitude } = routeParams.focusLocation;
          zoomToLocation(latitude, longitude);
          const report = routeParams.newReport;
          setTimeout(() => {
            setSelectedReport(report);
            setModalVisible(true);
          }, 1500);
        }
      };
      handleNewReport();
    } else {
      fetchReports();
    }
  }, [routeParams?.newReport, isMapReady]);

  const zoomToLocation = (latitude, longitude) => {
    const zoomLevel = 18;
    webViewRef.current?.injectJavaScript(`
      if (typeof map !== 'undefined') {
        map.flyTo([${latitude}, ${longitude}], ${zoomLevel}, {
          duration: 1.5,
          easeLinearity: 0.25
        });
      }
      true;
    `);
  };


  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (isMapReady && reports.length > 0) {
      updateMapMarkers();
    }
  }, [isMapReady, reports]);

  const updateMapMarkers = () => {
    const markersData = JSON.stringify(reports);
    webViewRef.current?.injectJavaScript(`
      if (typeof updateMarkers === 'function') {
        updateMarkers(${markersData});
      }
      true;
    `);
  };

  const fetchReports = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get('http://192.168.1.111:8000/api/reports/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(response.data)
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const handleMapReady = () => {
    setIsMapReady(true);
  };

  const handleMarkerClick = (event) => {
    try {
      const reportId = JSON.parse(event.nativeEvent.data).reportId;
      const report = reports.find(r => r.id === reportId);
      if (report) {
        setSelectedReport(report);
        setModalVisible(true);
      }
    } catch (error) {
      console.error('Error handling marker click:', error);
    }
  };

  useEffect(() => {
    if (modalVisible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
  }, [modalVisible]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const hours = Math.floor(diffTime / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diffTime / (1000 * 60));
        return `${minutes} minutes ago`;
      }
      return `${hours} hours ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              navigation.replace('Login');
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  const htmlContent = `
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
          width: 16px;
          height: 16px;
          background: #ff4444;
          border-radius: 50%;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        let map;
        let markers = [];

        document.addEventListener('DOMContentLoaded', () => {
          initMap();
        });

        function initMap() {
          const iitBombayPosition = [19.1334, 72.9133];
 map = L.map('map', {
            zoomControl: false,
            attributionControl: true
          }).setView(iitBombayPosition, 15);          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          // Notify React Native that the map is ready
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'MAP_READY'
          }));
        }

        function updateMarkers(reports) {
          // Clear existing markers
          markers.forEach(marker => marker.remove());
          markers = [];

          const customIcon = L.divIcon({
            className: 'custom-marker',
            html: '<div class="marker-inner"></div>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          });

          // Add new markers
          reports.forEach(report => {
            const marker = L.marker(
              [report.latitude, report.longitude],
              { icon: customIcon }
            ).addTo(map);
            
            marker.on('click', () => {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'MARKER_CLICK',
                reportId: report.id
              }));
            });
            
            markers.push(marker);
          });
        }
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MAP_READY') {
        handleMapReady();
      } else if (data.type === 'MARKER_CLICK') {
        handleMarkerClick(event);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Transparent status bar to allow map to show through */}
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      
      {/* Map container covering the entire screen */}
      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          style={styles.map}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          mixedContentMode="always"
        />
      </View>
  
      {/* Semi-transparent header overlay with safe area handling */}
      <SafeAreaView style={styles.headerOverlay}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Campus Clean</Text>
            <Text style={styles.headerSubtitle}>Report garbage around IIT Bombay</Text>
          </View>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color="#FF4444" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
  
      {/* Report details modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Animated.View 
            style={[
              styles.modalContainer,
              {
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {selectedReport && (
              <>
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color="#666666" />
                  </TouchableOpacity>
                </View>
  
                <ScrollView 
                  style={styles.modalContent}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.reportHeader}>
                    <View style={styles.reporterInfo}>
                      <Ionicons name="person-circle-outline" size={40} color="#2196F3" />
                      <View style={styles.reporterDetails}>
                        <Text style={styles.reporterName}>{selectedReport.user}</Text>
                        <Text style={styles.timestamp}>
                          <Ionicons name="time-outline" size={14} color="#95A5A6" />
                          {" "}{formatDate(selectedReport.reported_at)}
                        </Text>
                      </View>
                    </View>
                  </View>
  
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: selectedReport.image }}
                      style={styles.reportImage}
                      resizeMode="cover"
                    />
                    <View style={styles.locationTag}>
                      <Ionicons name="location" size={16} color="#FFFFFF" />
                      <Text style={styles.locationText}>
                        {selectedReport.latitude.toFixed(4)}, {selectedReport.longitude.toFixed(4)}
                      </Text>
                    </View>
                  </View>
  
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionTitle}>Description</Text>
                    <Text style={styles.description}>
                      {selectedReport.description}
                    </Text>
                  </View>
                </ScrollView>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
  
      {/* Semi-transparent footer overlay with report button */}
      <SafeAreaView style={styles.footerOverlay}>
        <TouchableOpacity 
          style={styles.reportButton}
          onPress={() => navigation.navigate('Report')}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
          <Text style={styles.reportButtonText}>Report Garbage</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
    // Main container styles
    container: {
      flex: 1,
    },
    mapContainer: {
      ...StyleSheet.absoluteFillObject, // Makes map cover entire screen
    },
    map: {
      ...StyleSheet.absoluteFillObject,
    },
  
    // Header styles
    headerOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(255,255, 255, 0.5)',
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#2196F3',
    },
    headerSubtitle: {
      fontSize: 14,
      color: '#666666',
      marginTop: 4,
    },
    logoutButton: {
      padding: 8,
    },
  
    // Footer styles
    footerOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0)',
      padding: 16,
    },
    reportButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#2196F3',
      padding: 16,
      borderRadius: 12,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    reportButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '600',
      marginLeft: 8,
    },
  
    // Modal styles
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: height * 0.9,
      paddingTop: 8,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    closeButton: {
      padding: 8,
    },
    modalContent: {
      padding: 16,
    },
  
    // Report details styles
    reportHeader: {
      marginBottom: 20,
    },
    reporterInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    reporterDetails: {
      marginLeft: 12,
    },
    reporterName: {
      fontSize: 18,
      fontWeight: '600',
      color: '#333333',
    },
    timestamp: {
      fontSize: 14,
      color: '#95A5A6',
      marginTop: 4,
    },
    imageContainer: {
      position: 'relative',
      marginBottom: 20,
      borderRadius: 12,
      overflow: 'hidden',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    reportImage: {
      width: '100%',
      height: 250,
      borderRadius: 12,
    },
    locationTag: {
      position: 'absolute',
      bottom: 12,
      left: 12,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
    },
    locationText: {
      color: '#FFFFFF',
      fontSize: 12,
      marginLeft: 4,
    },
    descriptionContainer: {
      padding: 16,
      backgroundColor: '#F8F9FA',
      borderRadius: 12,
      marginBottom: 20,
    },
    descriptionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#2C3E50',
      marginBottom: 8,
    },
    description: {
      fontSize: 16,
      color: '#34495E',
      lineHeight: 24,
    },
  });

export default HomeScreen;