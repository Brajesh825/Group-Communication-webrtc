import h from './helpers.js';

import createRoom from './components/createRoom.js';
import joinRoom from './components/joinRoom.js';
import ConferenceComponent from './components/conference.js';
import Navbar from './components/navbar.js';

const Room = () => {
    var pc = []
    let socket = io('/stream');
    var socketId = '';
    var randomNumber = `__${h.generateRandomString()}__${h.generateRandomString()}__`;
    var myStream = '';
    var screen = '';

    const room = h.getQString(location.href, 'room');
    const username = sessionStorage.getItem('username');

    // Events Handlers

    const navbar = Navbar()
    document.body.appendChild(navbar)


    if (!room) {
        const roomComponent = createRoom();
        document.body.appendChild(roomComponent);
    }

    else if (!username) {
        const enterRoomComponent = joinRoom();
        document.body.appendChild(enterRoomComponent);
    }

    else {

        const conferenceComponent = ConferenceComponent();
        document.body.appendChild(conferenceComponent);

        let commElem = document.getElementsByClassName('room-comm');

        for (let i = 0; i < commElem.length; i++) {
            commElem[i].attributes.removeNamedItem('hidden');
        }

        //Get user video by default
        getAndSetUserStream();


        socket.on('connect', () => {
            //set socketId
            socketId = socket.io.engine.id;
            document.getElementById('randomNumber').innerText = randomNumber;

            socket.emit('subscribe', {
                room: room,
                socketId: socketId
            });

            socket.on('new user', (data) => {
                socket.emit('newUserStart', { to: data.socketId, sender: socketId });
                pc.push(data.socketId);
                init(true, data.socketId);
            });

            socket.on('newUserStart', (data) => {
                pc.push(data.sender);
                init(false, data.sender);
            });

            socket.on('ice candidates', async (data) => {
                data.candidate ? await pc[data.sender].addIceCandidate(new RTCIceCandidate(data.candidate)) : '';
            });


            socket.on('sdp', async (data) => {
                if (data.description.type === 'offer') {
                    data.description ? await pc[data.sender].setRemoteDescription(new RTCSessionDescription(data.description)) : '';

                    h.getUserFullMedia().then(async (stream) => {
                        if (!document.getElementById('local').srcObject) {
                            h.setLocalStream(stream);
                        }

                        //save my stream
                        myStream = stream;

                        console.log("stream");

                        stream.getTracks().forEach((track) => {
                            pc[data.sender].addTrack(track, stream);
                        });

                        let answer = await pc[data.sender].createAnswer();

                        await pc[data.sender].setLocalDescription(answer);

                        socket.emit('sdp', { description: pc[data.sender].localDescription, to: data.sender, sender: socketId });

                    }).catch((e) => {
                        console.error(e);
                    });
                }

                else if (data.description.type === 'answer') {
                    await pc[data.sender].setRemoteDescription(new RTCSessionDescription(data.description));
                }
            });


            socket.on('chat', (data) => {
                h.addChat(data, 'remote');
            });
        });

        //When the video icon is clicked
        document.getElementById('toggle-video').addEventListener('click', (e) => {
            e.preventDefault();

            console.log("Toggle Video");

            let elem = document.getElementById('toggle-video');

            if (myStream.getVideoTracks()[0].enabled) {
                e.target.classList.remove('fa-video');
                e.target.classList.add('fa-video-slash');
                elem.setAttribute('title', 'Show Video');

                myStream.getVideoTracks()[0].enabled = false;
            }

            else {
                e.target.classList.remove('fa-video-slash');
                e.target.classList.add('fa-video');
                elem.setAttribute('title', 'Hide Video');

                myStream.getVideoTracks()[0].enabled = true;
            }

            broadcastNewTracks(myStream, 'video');
        });

        //When the mute icon is clicked
        document.getElementById('toggle-mute').addEventListener('click', (e) => {
            e.preventDefault();

            let elem = document.getElementById('toggle-mute');

            if (myStream.getAudioTracks()[0].enabled) {
                e.target.classList.remove('fa-microphone-alt');
                e.target.classList.add('fa-microphone-alt-slash');
                elem.setAttribute('title', 'Unmute');

                myStream.getAudioTracks()[0].enabled = false;
            }

            else {
                e.target.classList.remove('fa-microphone-alt-slash');
                e.target.classList.add('fa-microphone-alt');
                elem.setAttribute('title', 'Mute');

                myStream.getAudioTracks()[0].enabled = true;
            }

            broadcastNewTracks(myStream, 'audio');
        });

        document.getElementById( 'local' ).addEventListener( 'click', () => {
            if ( !document.pictureInPictureElement ) {
                document.getElementById( 'local' ).requestPictureInPicture()
                    .catch( error => {
                        // Video failed to enter Picture-in-Picture mode.
                        console.error( error );
                    } );
            }
    
            else {
                document.exitPictureInPicture()
                    .catch( error => {
                        // Video failed to leave Picture-in-Picture mode.
                        console.error( error );
                    } );
            }
        } );
    
        document.addEventListener( 'click', ( e ) => {
            if ( e.target && e.target.classList.contains( 'expand-remote-video' ) ) {
                helpers.maximiseStream( e );
            }
    
            else if ( e.target && e.target.classList.contains( 'mute-remote-mic' ) ) {
                helpers.singleStreamToggleMute( e );
            }
        } );

    }

    // IMPORTANT FUNCTIONS
    function getAndSetUserStream() {
        h.getUserFullMedia().then((stream) => {
            //save my stream
            myStream = stream;

            h.setLocalStream(stream);
        }).catch((e) => {
            console.error(`stream error: ${e}`);
        });
    }

    function init(createOffer, partnerName) {
        pc[partnerName] = new RTCPeerConnection(h.getIceServer());

        if (screen && screen.getTracks().length) {
            screen.getTracks().forEach((track) => {
                pc[partnerName].addTrack(track, screen);//should trigger negotiationneeded event
            });
        }

        else if (myStream) {
            myStream.getTracks().forEach((track) => {
                pc[partnerName].addTrack(track, myStream);//should trigger negotiationneeded event
            });
        }

        else {
            h.getUserFullMedia().then((stream) => {
                //save my stream
                myStream = stream;

                stream.getTracks().forEach((track) => {
                    pc[partnerName].addTrack(track, stream);//should trigger negotiationneeded event
                });

                h.setLocalStream(stream);
            }).catch((e) => {
                console.error(`stream error: ${e}`);
            });
        }



        //create offer
        if (createOffer) {
            pc[partnerName].onnegotiationneeded = async () => {
                let offer = await pc[partnerName].createOffer();

                await pc[partnerName].setLocalDescription(offer);

                socket.emit('sdp', { description: pc[partnerName].localDescription, to: partnerName, sender: socketId });
            };
        }



        //send ice candidate to partnerNames
        pc[partnerName].onicecandidate = ({ candidate }) => {
            socket.emit('ice candidates', { candidate: candidate, to: partnerName, sender: socketId });
        };



        //add
        pc[partnerName].ontrack = (e) => {
            let str = e.streams[0];
            if (document.getElementById(`${partnerName}-video`)) {
                document.getElementById(`${partnerName}-video`).srcObject = str;
            }

            else {
                //video elem
                let newVid = document.createElement('video');
                newVid.id = `${partnerName}-video`;
                newVid.srcObject = str;
                newVid.autoplay = true;
                newVid.className = 'remote-video';

                //video controls elements
                let controlDiv = document.createElement('div');
                controlDiv.className = 'remote-video-controls';
                controlDiv.innerHTML = `<i class="fa fa-microphone text-white pr-3 mute-remote-mic" title="Mute"></i>
                    <i class="fa fa-expand text-white expand-remote-video" title="Expand"></i>`;

                //create a new div for card
                let cardDiv = document.createElement('div');
                cardDiv.className = 'remote-video-container';
                cardDiv.id = partnerName;
                cardDiv.appendChild(newVid);
                cardDiv.appendChild(controlDiv);

                //put div in main-section elem
                document.getElementById('videos').appendChild(cardDiv);

                h.adjustVideoElemSize();
            }
        };



        pc[partnerName].onconnectionstatechange = (d) => {
            switch (pc[partnerName].iceConnectionState) {
                case 'disconnected':
                case 'failed':
                    h.closeVideo(partnerName);
                    break;

                case 'closed':
                    h.closeVideo(partnerName);
                    break;
            }
        };



        pc[partnerName].onsignalingstatechange = (d) => {
            switch (pc[partnerName].signalingState) {
                case 'closed':
                    console.log("Signalling state is 'closed'");
                    h.closeVideo(partnerName);
                    break;
            }
        };
    }

    function broadcastNewTracks(stream, type, mirrorMode = true) {
        h.setLocalStream(stream, mirrorMode);

        let track = type == 'audio' ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];

        for (let p in pc) {
            let pName = pc[p];

            if (typeof pc[pName] == 'object') {
                h.replaceTrack(track, pc[pName]);
            }
        }
    }





}


export default Room