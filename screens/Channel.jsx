import React, {useState, useContext} from 'react';
import {useRoute} from '@react-navigation/native';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  Appearance,
} from 'react-native';
import {AppContext} from '../App';

const Channel = () => {
  const {socket, setSocket,  initiateCall,} = useContext(AppContext);
  // console.log('socket in chanel ?',socket)
  const route = useRoute(); // Get the route object
  const [userId] = useState(route.params?.userId || ''); // Set initial state
  const [recipientId] = useState(route.params?.recipientId || ''); // Set initial state
  const [recipientEmail] = useState(route.params?.recipientEmail || ''); // Set initial state
  const [recipientName] = useState(route.params?.recipientName || ''); // Set initial state

  const handleCallPress = () => {
    // Now you have access to recipientId and userId props
    initiateCall(recipientId, userId, recipientEmail, recipientName); // Pass them to initiateCall
  };
  const colorScheme = Appearance.getColorScheme();
  const styles = StyleSheet.create({
    container: {
      justifyContent: 'space-between', // Align content vertically with space between
      alignItems: 'center', // Align content horizontally in the center
      padding: 20, // Add some padding for aesthetics
    },
    content: {
      color: colorScheme === 'light' ? 'white' : 'black',
      alignItems: 'center', // Align content within the content area
    },
    title: {
      color: colorScheme === 'light' ? 'white' : 'black',
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    infoText: {
      color: colorScheme === 'light' ? 'white' : 'black',
      fontSize: 16,
      marginBottom: 5,
    },
    callButton: {
      backgroundColor: '#4CAF50', // Green color for the button
      padding: 15,
      borderRadius: 10, // Rounded corners for aesthetics
      paddingVertical: 20,
    },
    callButtonText: {
      color: colorScheme === 'light' ? 'white' : 'black',
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
    },
  });
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Channel</Text>
        <Text style={styles.infoText}>Recipient ID: {recipientId}</Text>
        <Text style={styles.infoText}>User ID: {userId}</Text>
      </View>
      <View style={{paddingVertical: 100}}>
        <TouchableOpacity style={styles.callButton} onPress={handleCallPress}>
          <Text style={styles.callButtonText}>Make Call</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Channel;
