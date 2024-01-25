// This could be set dynamically based on the device's role
// Initial state of isRobot
let isRobot = true; 

// Function to toggle the isRobot value
function toggleIsRobot() {
    isRobot = !isRobot;
    console.log("isRobot is now: " + isRobot);
}
// Add a button for toggling in your HTML

// Add an event listener to the button
const { nowInSec, SkyWayAuthToken, SkyWayContext, SkyWayRoom, SkyWayStreamFactory, uuidV4 } = skyway_room;
const buttonArea = document.getElementById('button-area');
buttonArea.innerHTML += '<button id="toggle-button">Toggle Robot Mode</button>';
document.getElementById('toggle-button').addEventListener('click', toggleIsRobot);
const remoteMediaArea = document.getElementById('remote-media-area');
const roomNameInput = document.getElementById('room-name');
const myId = document.getElementById('my-id');
const joinButton = document.getElementById('join');


const token = new SkyWayAuthToken({
    jti: uuidV4(),
    iat: nowInSec(),
    exp: nowInSec() + 60 * 60 * 24,
    scope: {
      app: {
        id: 'b50941bc-9336-4580-93ff-e39814249fd7',
        turn: true,
        actions: ['read'],
        channels: [
          {
            id: '*',
            name: '*',
            actions: ['write'],
            members: [
              {
                id: '*',
                name: '*',
                actions: ['write'],
                publication: {
                  actions: ['write'],
                },
                subscription: {
                  actions: ['write'],
                },
              },
            ],
            sfuBots: [
              {
                actions: ['write'],
                forwardings: [
                  {
                    actions: ['write'],
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  }).encode('DoH5pPxJiSUPn2m7r29+9KsDnz3jcoQYhF3wjotvcs8=');

  (async () => {
    const localVideo = document.getElementById('local-video');
    const buttonArea = document.getElementById('button-area');
    const remoteMediaArea = document.getElementById('remote-media-area');
    const roomNameInput = document.getElementById('room-name');
  
    const myId = document.getElementById('my-id');
    const joinButton = document.getElementById('join');
  
    const { audio, video } =
      await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream();
    // Attach and play local video only if it's the robot
    if (isRobot) {
      video.attach(localVideo);
      await localVideo.play();
    }
    await localVideo.play();
  
    joinButton.onclick = async () => {
      if (roomNameInput.value === '') return;
  
      const context = await SkyWayContext.Create(token);
      const room = await SkyWayRoom.FindOrCreate(context, {
        type: 'p2p',
        name: roomNameInput.value,
      });
      const me = await room.join();

      // Publish streams based on the role
      myId.textContent = me.id;
      await me.publish(audio);
      if (isRobot) {
          await me.publish(video);
      }
  
  
      // await me.publish(audio);
      // await me.publish(video);
  
      const subscribeAndAttach = (publication) => {
        if (publication.publisher.id === me.id) return;
    
        // For the robot, skip subscribing to video streams
        if (isRobot && publication.contentType === 'video') return;
    
        const subscribeButton = document.createElement('button');
        subscribeButton.textContent = `${publication.publisher.id}: ${publication.contentType}`;
        buttonArea.appendChild(subscribeButton);
    
        subscribeButton.onclick = async () => {
            const { stream } = await me.subscribe(publication.id);
    
            let newMedia;
            switch (stream.track.kind) {
                case 'video':
                    if (!isRobot) { // Only create video elements if it's the controller
                        newMedia = document.createElement('video');
                        newMedia.playsInline = true;
                        newMedia.autoplay = true;
                    }
                    break;
                case 'audio':
                    newMedia = document.createElement('audio');
                    newMedia.controls = true;
                    newMedia.autoplay = true;
                    break;
                default:
                    return;
            }
            if (newMedia) {
                stream.attach(newMedia);
                remoteMediaArea.appendChild(newMedia);
            }
        };
      };
  
      room.publications.forEach(subscribeAndAttach);
      room.onStreamPublished.add((e) => subscribeAndAttach(e.publication));
    };
  })();