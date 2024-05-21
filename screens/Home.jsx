import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, StyleSheet, TouchableOpacity, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const Home = () => {
  const navigation = useNavigation();
  const [userId, setUserId] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    const retrieveUserId = async () => {
      // Fetch user ID from backend
      const userCred = new FormData();
      userCred.append('email', await AsyncStorage.getItem('may'));
      try {
        const response = await fetch('http://13.202.36.93:8080/getUserId', {
          method: 'POST',
          body: userCred,
          headers: {
            'Content-Type': 'multipart/form-data' // Important for Node.js to parse correctly
          },
        });
        const userData = await response.json();
        setUserId(userData.user_id);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    retrieveUserId();
  }, []);

  useEffect(() => {
    const getOnlineUsers = async () => {
      // Fetch online users from backend
      const formData = new FormData();
      formData.append('email', await AsyncStorage.getItem('may'));
      try {
        const response = await fetch('http://13.202.36.93:8080/getOnlineUsers', {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data' // Important for Node.js to parse correctly
          },
        });
        const userData = await response.json();
        setOnlineUsers(userData.online_users);
      } catch (error) {
        console.error('Error fetching online users:', error);
      }
    };

    // Call getOnlineUsers immediately
    getOnlineUsers();

    // Then set up the interval to call getOnlineUsers every 10 seconds
    const intervalId = setInterval(getOnlineUsers, 10000);

    // Clear interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const goToChannel = (recipientId, recipientEmail, recipientName) => {
    navigation.navigate('Channel', {
      recipientId,
      userId,
      recipientEmail,
      recipientName
    });
  };
  const colorScheme = Appearance.getColorScheme();
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
    },
    header: {
      color: colorScheme === 'light' ? 'white' : 'black',
      marginBottom: 20,
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
    },
    onlineUsersText: {
      color: colorScheme === 'light' ? 'white' : 'black',
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    userContainer: {
      flexWrap: 'wrap', // Enable wrapping of user blobs onto next line
      flexDirection: 'row', // Maintain horizontal layout for users
    },
    userBlob: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'lightblue',
      justifyContent: 'center', 
    },
    userNameText: {
      color: colorScheme === 'light' ? 'white' : 'black',
      fontSize: 18,
      fontWeight: 'bold',
      alignSelf:'center'
    },
  });
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Home sweet home</Text>
        <Text style={styles.infoText}>User ID: {userId}</Text>
      </View>
      <Text style={styles.onlineUsersText}>Online Users:</Text>
      <View style={styles.userContainer}>
        {onlineUsers && onlineUsers.map((user) => (
          <View key={user.id} style={styles.userBlob}>
            <TouchableOpacity onPress={() => goToChannel(user.id, user.email, user.name)}>
              <Text style={styles.userNameText}>{user.name}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
};


export default Home;