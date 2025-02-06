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
  Linking
} from 'react-native';
import { WebView } from 'react-native-webview';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import zoneData from './zone.json';
import { launchCamera } from 'react-native-image-picker';


const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [unviewedReportsCount, setUnviewedReportsCount] = useState(0);
  const [unviewedReportsModal, setUnviewedReportsModal] = useState(false);
  const [userType, setUserType] = useState('');
  const [workerZone, setWorkerZone] = useState(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const webViewRef = useRef(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const routeParams = navigation.getState()?.routes?.find(route => route.name === 'Home')?.params;

  const slideAnim = useRef(new Animated.Value(height)).current;
  const [userId, setUserId] = useState(null);

useEffect(() => {
  const checkUserDetails = async () => {
    const storedUserId = await AsyncStorage.getItem('userId');
    setUserId(storedUserId ? parseInt(storedUserId) : null);
  };
  checkUserDetails();
}, []);
  


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


  useEffect(() => {
    const checkUserType = async () => {
      const type = await AsyncStorage.getItem('userType');
      console.log(type)
      const zone = await AsyncStorage.getItem('workerZone');
      console.log(zone)
      setUserType(type);
      setWorkerZone(zone ? parseInt(zone) : null);
      
      if (type === 'worker') {
        fetchUnviewedReports();
      }
    };
    checkUserType();
  }, []);

  const fetchUnviewedReports = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get('http://192.168.227.240:8000/api/unviewed-reports/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnviewedReportsCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unviewed reports:', error);
    }
  };

  const updateReportStatus = async (reportId, status, completionImage = null) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const formData = new FormData();
      formData.append('status', status);
      
      if (completionImage) {
        formData.append('completion_image', {
          uri: completionImage.uri,
          type: completionImage.type,
          name: completionImage.fileName
        });
      }

      const response = await axios.post(
        `http://192.168.227.240:8000/api/reports/${reportId}/update_status/`, 
        formData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Refresh reports after status update
      fetchReports();
      setModalVisible(false);
    } catch (error) {
      console.error('Error updating report status:', error);
      Alert.alert('Error', 'Failed to update report status');
    }
  };

  const closeReport = async (reportId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.post(
        `http://192.168.227.240:8000/api/reports/${reportId}/close_report/`, 
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Refresh reports after closing
      fetchReports();
      setModalVisible(false);
    } catch (error) {
      console.error('Error closing report:', error);
      Alert.alert('Error', 'Failed to close report');
    }
  };

  const handlePickCompletionImage = async (reportId) => {
    try {

      const options = {
        mediaType: 'photo',
        quality: 1,
        maxWidth: 1280,
        maxHeight: 1280,
        saveToPhotos: false, // Don't save to device gallery
      };


      // const result = await ImagePicker.launchImageLibrary({
      //   mediaType: 'photo',
      //   quality: 0.7
      // });

      const result = await launchCamera(options);

  //     if (!result.didCancel) {
  //       const image = result.assets[0];
  //       updateReportStatus(reportId, 'COMPLETED', image);
  //     }
  //   } catch (error) {
  //     console.error('Image picker error:', error);
  //   }
  // };
  if (result.assets && result.assets[0]) {
    const image = result.assets[0];
    // Update report status with the captured image
    updateReportStatus(reportId, 'COMPLETED', image);
  }
} catch (error) {
  console.error('Camera error:', error);
  Alert.alert('Error', 'Failed to capture image. Please try again.');
}
};

  const renderStatusUpdateOptions = () => {
    if (userType !== 'worker' || !selectedReport) return null;

    const workerStatusOptions = [
      { 
        status: 'RECEIVED', 
        label: 'Mark as Received', 
        icon: 'checkmark-circle-outline' 
      },
      { 
        status: 'IN_PROGRESS', 
        label: 'Mark as In Progress', 
        icon: 'hammer-outline' 
      },
      { 
        status: 'COMPLETED', 
        label: 'Take Completion Photo', 
        icon: 'camera-outline' 
      }
    ];

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.workerActionsScrollView}
      >
        <View style={styles.workerActionsContainer}>
          {workerStatusOptions.map((option) => (
            <TouchableOpacity
              key={option.status}
              style={styles.workerActionButton}
              onPress={() => {
                if (option.status === 'COMPLETED') {
                  handlePickCompletionImage(selectedReport.id);
                } else {
                  updateReportStatus(selectedReport.id, option.status);
                }
              }}
            >
              <Ionicons 
                name={option.icon} 
                size={20} 
                color="#2196F3" 
              />
              <Text style={styles.workerActionText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderUnviewedReportsModal = () => {
    // Filter reports for the worker's specific zone
    const zoneReports = reports.filter(report => 
      userType === 'worker' && 
      report.zone === `Zone ${workerZone}`
    );

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={unviewedReportsModal}
        onRequestClose={() => setUnviewedReportsModal(false)}
      >
        <View style={styles.unviewedModalContainer}>
          <View style={styles.unviewedModalContent}>
            <View style={styles.unviewedModalHeader}>
              <Text style={styles.unviewedModalTitle}>
                Unviewed Reports - Zone {workerZone}
              </Text>
              <TouchableOpacity 
                onPress={() => setUnviewedReportsModal(false)}
                style={styles.closeModalButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {zoneReports.map(report => (
                <TouchableOpacity
                  key={report.id}
                  style={styles.unviewedReportItem}
                  onPress={() => {
                    setSelectedReport(report);
                    setModalVisible(true);
                    setUnviewedReportsModal(false);
                  }}
                >
                  <View style={styles.unviewedReportItemContent}>
                    <Text style={styles.unviewedReportTitle}>
                      Report #{report.id}
                    </Text>
                    <Text style={styles.unviewedReportDescription} numberOfLines={2}>
                      {report.description}
                    </Text>
                    <Text style={styles.unviewedReportDate}>
                      {formatDate(report.reported_at)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const openDirections = (latitude, longitude) => {
    const scheme = Platform.select({ ios: 'maps:', android: 'geo:' });
    const url = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}`,
      android: `google.navigation:q=${latitude},${longitude}`
    });

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback to browser if native maps app not available
        const browserUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        Linking.openURL(browserUrl);
      }
    });
  };

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
      //console.log('tokennnnnnnnnnnnnnn',token)
      const response = await axios.get('http://192.168.227.240:8000/api/reports/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      // console.log(response.data)
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
      console.log(report)
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
        width: 8px;
        height: 8px;
        background: #ff4444;
        border-radius: 50%;
      }
      .zone-popup {
        font-size: 14px;
        line-height: 1.4;
      }
      .leaflet-bottom {
    z-index: -1 !important;
  }
  .leaflet-control {
    z-index: -1 !important;
  }
  .legend {
    padding: 8px;
    background: white;
    border-radius: 4px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
    max-height: 300px;
    overflow-y: auto;
    z-index: -1 !important;
  }
  .legend-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin-top: 8px;
  }
  .legend-item {
    display: flex;
    align-items: center;
    padding: 4px;
  }
  .legend-color {
    width: 20px;
    height: 20px;
    margin-right: 8px;
    border-radius: 3px;
    opacity: 0.7;
  }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      let map;
      let markers = [];
      let zoneLayer;
      let legend;

      // Store the zone data globally
      const zones = ${JSON.stringify(zoneData)};

      document.addEventListener('DOMContentLoaded', () => {
        initMap();
      });

      function initMap() {
        const iitBombayPosition = [19.1334, 72.9133];
        map = L.map('map', {
          zoomControl: false,
          attributionControl: true,
          
        }).setView(iitBombayPosition, 15);          
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Add GeoJSON zones
        addZones();
        
        // Add legend
        addLegend();

        // Notify React Native that the map is ready
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'MAP_READY'
        }));
      }

      function getZoneColor(zoneNumber) {
        const colors = [
          '#2196F3', '#4CAF50', '#FFC107', '#9C27B0', '#FF5722',
          '#00BCD4', '#3F51B5', '#E91E63', '#8BC34A', '#FF9800',
          '#009688', '#673AB7', '#795548', '#607D8B', '#F44336', 'grey'
        ];
        return colors[(zoneNumber - 1) % colors.length];
      }

      function addZones() {
        if (zoneLayer) {
          zoneLayer.remove();
        }

        zoneLayer = L.geoJSON(zones, {
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

        // Fit map bounds to GeoJSON layer
        map.fitBounds(zoneLayer.getBounds());
      }

      function addLegend() {
        legend = L.control({ position: 'bottomleft' });
        legend.onAdd = function(map) {
          const div = L.DomUtil.create('div', 'legend');
          let legendContent = '<strong>Zones</strong><br>';
          
          zones.features.forEach(zone => {
            const color = getZoneColor(zone.properties.Zone_No);
            legendContent += \`
              <div class="legend-item">
                <div class="legend-color" style="background: \${color}"></div>
                <div>Zone \${zone.properties.Zone_No}</div>
              </div>
            \`;
          });
          
          div.innerHTML = legendContent;
          return div;
        };
        legend.addTo(map);
      }

      function updateMarkers(reports) {
          // Clear existing markers
          markers.forEach(marker => marker.remove());
          markers = [];

          const customIcon = L.divIcon({
            className: 'custom-marker',
            html: '<div class="marker-inner"></div>',
            iconSize: [20, 20],
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

  const formatStatus = (status) => {
    const statusMap = {
      'SENT': 'Sent',
      'RECEIVED': 'Received',
      'IN_PROGRESS': 'In Progress',
      'COMPLETED': 'Completed'
    };
    return statusMap[status] || status;
  };
  
  const getStatusStyle = (status) => {
    const statusColors = {
      'SENT': { backgroundColor: '#FFA726' },
      'RECEIVED': { backgroundColor: '#42A5F5' },
      'IN_PROGRESS': { backgroundColor: '#66BB6A' },
      'COMPLETED': { backgroundColor: '#4CAF50' }
    };
    return statusColors[status] || { backgroundColor: '#757575' };
  };


  return (
    <View style={styles.container}>
      {/* Transparent status bar to allow map to show through */}
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
  
      {/* Unviewed Reports Indicator for Workers */}
      {userType === 'worker' && (
        <TouchableOpacity 
          style={styles.unviewedReportsIndicator}
          onPress={() => setUnviewedReportsModal(true)}
        >
          <Ionicons name="notifications" size={24} color="#FFFFFF" />
          {unviewedReportsCount > 0 && (
            <View style={styles.unviewedReportsCountBadge}>
              <Text style={styles.unviewedReportsCountText}>
                {unviewedReportsCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}
      
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
            <Text style={styles.headerTitle}>Clean & Green Campus</Text>
            <Text style={styles.headerSubtitle}>Report issue around IIT Bombay</Text>
          </View>
          <View style={styles.headerActions}>
            {userType === 'worker' && (
              <TouchableOpacity 
                style={styles.unviewedButton}
                onPress={() => setUnviewedReportsModal(true)}
              >
                <Ionicons name="notifications-outline" size={24} color="#2196F3" />
                {unviewedReportsCount > 0 && (
                  <View style={styles.unviewedBadge}>
                    <Text style={styles.unviewedBadgeText}>
                      {unviewedReportsCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={24} color="#FF4444" />
            </TouchableOpacity>
          </View>
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
                        <View style={styles.ticketRow}>
                          <Text style={styles.ticketNumber}>Ticket Number #{selectedReport.id}</Text>
                        </View>
                        <Text style={styles.reporterName}>{selectedReport.username}</Text>
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

                  {selectedReport?.completion_image && selectedReport.status === 'COMPLETED' && (
          <View style={styles.completionImageContainer}>
            <View style={styles.completionImageHeader}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.completionImageTitle}>Completion Evidence</Text>
              <Text style={styles.completionTimestamp}>
                {formatDate(selectedReport.completed_at)}
              </Text>
            </View>
            <Image
              source={{ uri: selectedReport.completion_image }}
              style={styles.completionImage}
              resizeMode="cover"
            />
            {selectedReport.worker_notes && (
              <View style={styles.workerNotesContainer}>
                <Text style={styles.workerNotesLabel}>Worker Notes:</Text>
                <Text style={styles.workerNotes}>{selectedReport.worker_notes}</Text>
              </View>
            )}
          </View>
        )}
  
                  <TouchableOpacity
                    style={styles.directionsButton}
                    onPress={() => openDirections(selectedReport.latitude, selectedReport.longitude)}
                  >
                    <Ionicons name="navigate-circle-outline" size={24} color="#FFFFFF" />
                    <Text style={styles.directionsButtonText}>Get Directions</Text>
                  </TouchableOpacity>
  
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionTitle}>Description</Text>
                    <Text style={styles.description}>
                      {selectedReport.description}
                    </Text>
                    
                    <View style={styles.statusContainer}>
                      <View style={styles.statusSection}>
                        <Text style={styles.statusLabel}>Zone</Text>
                        <View style={styles.zoneTag}>
                          <Ionicons name="map-outline" size={16} color="#2196F3" />
                          <Text style={styles.zoneText}>{selectedReport.zone || 'Unknown Zone'}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.statusSection}>
                        <Text style={styles.statusLabel}>Status</Text>
                        <View style={[styles.statusTag, getStatusStyle(selectedReport.status)]}>
                          <Ionicons name="time-outline" size={16} color="#FFFFFF" />
                          <Text style={styles.statusText}>{formatStatus(selectedReport.status)}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
  
                  {/* Worker Status Update Options */}
                  {renderStatusUpdateOptions()}
  
                  {/* User-specific close report option */}
                  {selectedReport && selectedReport.user === userId && (
                    <TouchableOpacity
                      style={styles.closeReportButton}
                      onPress={() => closeReport(selectedReport.id)}
                    >
                      <Text style={styles.closeReportButtonText}>Close Report</Text>
                    </TouchableOpacity>
                  )}
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
          <Text style={styles.reportButtonText}>Report</Text>
        </TouchableOpacity>
      </SafeAreaView>
  
      {/* Unviewed Reports Modal */}
      {renderUnviewedReportsModal()}
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
    ticketRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    completionImageContainer: {
      marginTop: 2,
      marginBottom: 12,
      backgroundColor: 'none',
      borderRadius: 16,
      padding: 0,
      marginHorizontal: 0,
    },
    completionImageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    completionImageTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#4CAF50',
      marginLeft: 8,
      flex: 1,
    },
    completionTimestamp: {
      fontSize: 12,
      color: '#95A5A6',
    },
    completionImage: {
      width: '100%',
      height: 280,
      borderRadius: 16,
    },
    workerNotesContainer: {
      marginTop: 12,
      padding: 12,
      backgroundColor: '#FFFFFF',
      borderRadius: 8,
    },
    workerNotesLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: '#2C3E50',
      marginBottom: 4,
    },
    workerNotes: {
      fontSize: 14,
      color: '#34495E',
      lineHeight: 20,
    },
    unviewedReportsIndicator: {
      position: 'absolute',
      top: 50,
      right: 20,
      backgroundColor: '#2196F3',
      borderRadius: 50,
      width: 50,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
    },
    unviewedReportsCountBadge: {
      position: 'absolute',
      top: -5,
      right: -5,
      backgroundColor: 'red',
      borderRadius: 10,
      width: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    unviewedReportsCountText: {
      color: 'white',
      fontSize: 12,
      fontWeight: 'bold',
    },
    workerActionsScrollView: {
      marginVertical: 8,
    },
    workerActionsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      gap: 12,
      marginBottom: 34
    },
    workerActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#E3F2FD',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      minWidth: 160,
    },
    workerActionText: {
      marginLeft: 8,
      color: '#2196F3',
      fontSize: 14,
      fontWeight: '500',
    },
    closeReportButton: {
      backgroundColor: '#FF4444',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 4,
      marginBottom: 36,
    },
    closeReportButtonText: {
      color: 'white',
      fontWeight: 'bold',
      
    },
    // Unviewed Reports Modal Styles
    unviewedModalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    unviewedModalContent: {
      width: '90%',
      backgroundColor: 'white',
      borderRadius: 16,
      maxHeight: '80%',
    },
    unviewedModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
    },
    unviewedModalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#2C3E50',
    },
    unviewedReportItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
    },
    unviewedReportItemContent: {
      flexDirection: 'column',
    },
    unviewedReportTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#2196F3',
      marginBottom: 4,
    },
    unviewedReportDescription: {
      fontSize: 14,
      color: '#34495E',
      marginBottom: 8,
    },
    unviewedReportDate: {
      fontSize: 12,
      color: '#7F8C8D',
    },
    ticketNumber: {
      fontSize: 14,
      color: '#2196F3',
      fontWeight: '600',
    },
    directionsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#2196F3',
      padding: 12,
      borderRadius: 8,
      marginBottom: 20,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
    directionsButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    reporterName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333333',
      marginBottom: 2,
    },
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
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    unviewedButton: {
      padding: 8,
      marginRight: 8,
      position: 'relative',
    },
    unviewedBadge: {
      position: 'absolute',
      top: 4,
      right: 4,
      backgroundColor: '#FF4444',
      borderRadius: 10,
      minWidth: 18,
      height: 18,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    unviewedBadgeText: {
      color: 'white',
      fontSize: 10,
      fontWeight: 'bold',
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
    statusContainer: {
      marginTop: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    statusSection: {
      flex: 1,
      marginRight: 8,
    },
    statusLabel: {
      fontSize: 14,
      color: '#666666',
      marginBottom: 4,
    },
    zoneTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#E3F2FD',
      padding: 8,
      borderRadius: 8,
    },
    zoneText: {
      marginLeft: 4,
      color: '#2196F3',
      fontWeight: '500',
    },
    statusTag: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
      borderRadius: 8,
    },
    statusText: {
      marginLeft: 4,
      color: '#FFFFFF',
      fontWeight: '500',
    },
  });

export default HomeScreen;