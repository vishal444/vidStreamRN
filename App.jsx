import React, {useState, useEffect, useRef, createContext} from 'react';
import {View, Alert, StyleSheet} from 'react-native';
import {
  MediaStream,
  mediaDevices,
  RTCPeerConnection,
  RTCView,
  RTCSessionDescription,
  RTCIceCandidate,
} from 'react-native-webrtc';
import SocketIOClient from 'socket.io-client';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginRegistration from './screens/LoginRegistration';
import Home from './screens/Home';
import Channel from './screens/Channel';

const Stack = createStackNavigator();
export const AppContext = createContext();

const App = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [emailValue, setEmailValue] = useState(null);
  const [socket, setSocket] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const peerConnectionRef = useRef(null); // Use ref to hold the peerConnection object

  const initiateCall = async (
    recipientId,
    userId,
    recipientEmail,
    recipientName,
  ) => {
    if (recipientId) {
      const email = await AsyncStorage.getItem('may');
      // console.log('offer recipientEmail:', recipientEmail);
      const pc = await createPeerConnection(socket, email, recipientEmail);
      peerConnectionRef.current = pc; // Store the peer connection in the ref
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const offerData = {
        callersId: userId,
        recipientId: recipientId,
        offer: offer.sdp,
      };
      socket.emit('call_initiation', offerData);
    } else {
      console.warn('Please enter recipient ID');
    }
  };

  useEffect(() => {
    const setEmailFromAsyncStorage = async () => {
      try {
        const email = await AsyncStorage.getItem('may');
        setEmailValue(email);
        if (email !== null) {
          const wsUri = `ws://13.202.36.93:8080?email=${email}`;
          const newSocket = SocketIOClient(wsUri);
          setSocket(newSocket);

          newSocket.on('connect', () => {
            setIsConnected(true);
            console.log('Connected to server');
          });

          newSocket.on('disconnect', () => {
            setIsConnected(false);
            console.log('Disconnected from server');
          });

          newSocket.on('message', data => {
            console.log('Received message:', data);
          });

          newSocket.on('incoming_call', async data => {
            const {offer, callersId, recipientEmail} = data;
            // console.log('recipientEMial:', recipientEmail);
            Alert.alert(
              'Incoming Call',
              `Incoming call from ${recipientEmail}`,
              [
                {
                  text: 'Reject',
                  onPress: () => {
                    newSocket.emit('reject_call', {email});
                  },
                  style: 'cancel',
                },
                {
                  text: 'Answer',
                  onPress: async () => {
                    try {
                      // set offer as RemoteDescription and create answer and set it as local description
                      const pc = await createPeerConnection(
                        newSocket,
                        email,
                        recipientEmail,
                      );
                      peerConnectionRef.current = pc;
                      const offerDescription = new RTCSessionDescription({
                        type: 'offer',
                        sdp: offer,
                      });
                      await pc.setRemoteDescription(offerDescription);
                      const answer = await pc.createAnswer();
                      await pc.setLocalDescription(answer);
                      newSocket.emit('answer_sent', {
                        answer: answer.sdp,
                        callersId,
                      });
                    } catch (error) {
                      console.error('Error in incoming call:', error);
                      Alert.alert('Error in incoming call:', error.message);
                    }
                  },
                },
              ],
              {cancelable: false},
            );
          });

          newSocket.on('answer_response', async data => {
            const {answer} = data;
            // console.log('in anwer response');
            try {
              // Set the remote description with the answer
              const answerDescription = new RTCSessionDescription({
                type: 'answer',
                sdp: answer,
              });
              await peerConnectionRef.current.setRemoteDescription(
                answerDescription,
              );
            } catch (error) {
              console.error('Error handling received answer:', error);
              Alert.alert('Error', error.message);
            }
          });

          // Handling ICE candidates
          socket.on('ice_candidate', async data => {
            const {candidate} = data;
            try {
              if (peerConnectionRef.current) {
                await peerConnectionRef.current.addIceCandidate(
                  new RTCIceCandidate(candidate),
                );
              } else {
                console.error('Peer connection is not initialized.');
              }
            } catch (error) {
              console.error('Error adding received ICE candidate:', error);
              Alert.alert('error adding received ICE candidate', error.message);
            }
          });

          // Clean up by disconnecting the socket when the component unmounts
          return () => {
            newSocket.emit('disconnecting', {email});
            newSocket.disconnect();

            // Clean up event listeners and peer connection
            if (peerConnectionRef.current) {
              peerConnectionRef.current.close();
            }
          };
        }
      } catch (error) {
        console.error('Error fetching email from AsyncStorage:', error);
      }
    };

    setEmailFromAsyncStorage();
  }, []);

  const createPeerConnection = async (socket, email, recipientEmail) => {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [{urls: 'stun:stun.l.google.com:19302'}],
      });

      pc.onicecandidate = event => {
        if (event.candidate) {
          socket.emit('ice_candidate', {
            candidate: event.candidate,
            email: email,
            target: recipientEmail,
          });
          // console.log('Emitted ICE candidate:', event.candidate);
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log(`ICE Connection State: ${pc.iceConnectionState}`);
        if (pc.iceConnectionState === 'connected') {
          console.log('Peer connection established');
        }
      };
      

      pc.ontrack = event => {
        console.log('Remote track added:', event.track);
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
          console.log('Remote stream set from event.streams[0]');
        } else {
          setRemoteStream(prev => {
            if (prev) {
              prev.addTrack(event.track);
              console.log('Added track to existing stream:', prev);
              return prev;
            } else {
              const newStream = new MediaStream();
              newStream.addTrack(event.track);
              console.log('Created new remote stream:', newStream);
              return newStream;
            }
          });
        }
      };
      

      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setLocalStream(stream);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      console.log('Local stream set and tracks added to peer connection');

      return pc;
    } catch (error) {
      console.error('Error creating peer connection:', error);
      throw error; // Re-throw error to handle it in calling functions
    }
  };

  return (
    <SafeAreaProvider>
      <AppContext.Provider
        value={{
          socket,
          setSocket,
          initiateCall,
        }}>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
              headerBackTitleVisible: false,
            }}>
            <Stack.Screen
              name="Login"
              component={LoginRegistration}
              options={{
                headerShown: false,
                headerLeft: () => null,
                headerTitle: () => null,
              }}
            />
            <Stack.Screen
              name="Landing"
              component={Home}
              options={{
                headerShown: false,
                headerLeft: () => null,
                headerTitle: () => null,
              }}
            />
            <Stack.Screen
              name="Channel"
              component={Channel}
              options={{
                headerShown: false,
                headerLeft: () => null,
                headerTitle: () => null,
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </AppContext.Provider>
      {localStream && (
        <RTCView streamURL={localStream.toURL()} style={styles.localVideo} />
      )}
      {remoteStream && (
        <RTCView streamURL={remoteStream.toURL()} style={styles.remoteVideo} />
      )}
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  localVideo: {
    width: 100,
    height: 100,
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    zIndex: 0,
  },
});

export default App;
