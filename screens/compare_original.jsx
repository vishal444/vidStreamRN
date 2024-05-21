const createPeerConnection = async (socket, email, recipientEmail) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice_candidate', { candidate: event.candidate, email: email, target: recipientEmail });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`ICE Connection State: ${pc.iceConnectionState}`);
    };

    pc.onaddstream = (event) => {
      setRemoteStream(event.stream);
    };

    // Capture local media stream
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setLocalStream(stream);
      pc.addStream(stream);
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }

    return pc;
  };