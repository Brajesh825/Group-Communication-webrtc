import h from './helpers.js';
import createRoom from './components/createRoom.js';
import joinRoom from './components/joinRoom.js';
import ConferenceComponent from './components/conference.js';
import Navbar from './components/navbar.js';
import { MediaPipe,startHandDetection } from './utils/mediaPipe.js';

class Room {
    constructor() {
        this.pc = [];
        this.socket = io('/stream');
        this.socketId = '';
        this.randomNumber = `__${h.generateRandomString()}__${h.generateRandomString()}__`;
        this.myStream = '';
        this.screen = '';

        this.room = h.getQString(location.href, 'room');
        this.username = sessionStorage.getItem('username');

        this.init();
    }

    async init() {
         this.addNavbar();

        if (!this.room) {
            this.addRoomComponent();
        } else if (!this.username) {
            this.addJoinRoomComponent();
        } else {
            this.addConferenceComponent();
            this.setupSocketEvents();
            this.getAndSetUserStream();
            this.setupUIEvents();
            MediaPipe()

        }
    }

    addNavbar() {
        const navbar = Navbar();
        document.getElementById('root').appendChild(navbar);
    }

    addRoomComponent() {
        const roomComponent = createRoom();
        document.getElementById('root').appendChild(roomComponent);
    }

    addJoinRoomComponent() {
        const enterRoomComponent = joinRoom();
        document.getElementById('root').appendChild(enterRoomComponent);
    }

    addConferenceComponent() {
        const conferenceComponent = ConferenceComponent();
        document.getElementById('root').appendChild(conferenceComponent);

        let commElem = document.getElementsByClassName('room-comm');

        for (let i = 0; i < commElem.length; i++) {
            commElem[i].attributes.removeNamedItem('hidden');
        }
    }

    setupSocketEvents() {
        this.socket.on('connect', () => {
            this.socketId = this.socket.io.engine.id;
            document.getElementById('randomNumber').innerText = this.randomNumber;

            this.socket.emit('subscribe', {
                room: this.room,
                socketId: this.socketId,
                username: this.username
            });

            this.socket.on('new user', (data) => {
                this.socket.emit('newUserStart', { to: data.socketId, sender: this.socketId, username: this.username });
                this.pc.push(data.socketId);
                this.initConnection(true, data.socketId,data.username);
            });

            this.socket.on('newUserStart', (data) => {
                this.pc.push(data.sender);
                this.initConnection(false, data.sender, data.username);
            });

            this.socket.on('ice candidates', async (data) => {
                if (data.candidate) {
                    await this.pc[data.sender].addIceCandidate(new RTCIceCandidate(data.candidate));
                }
            });

            this.socket.on('sdp', async (data) => {
                if (data.description.type === 'offer') {
                    if (data.description) {
                        await this.pc[data.sender].setRemoteDescription(new RTCSessionDescription(data.description));
                    }

                    h.getUserFullMedia().then(async (stream) => {
                        if (!document.getElementById('local').srcObject) {
                            h.setLocalStream(stream);
                        }

                        this.myStream = stream;

                        stream.getTracks().forEach((track) => {
                            this.pc[data.sender].addTrack(track, stream);
                        });

                        let answer = await this.pc[data.sender].createAnswer();

                        await this.pc[data.sender].setLocalDescription(answer);

                        this.socket.emit('sdp', { description: this.pc[data.sender].localDescription, to: data.sender, sender: this.socketId });

                    }).catch((e) => {
                        console.error(e);
                    });
                } else if (data.description.type === 'answer') {
                    await this.pc[data.sender].setRemoteDescription(new RTCSessionDescription(data.description));
                }
            });

            this.socket.on('chat', (data) => {
                h.addChat(data, 'remote');
            });
        });
    }

    setupUIEvents() {
        document.getElementById('toggle-video').addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleVideo(e);
        });

        document.getElementById('toggle-mute').addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleMute(e);
        });

        document.getElementById('local').addEventListener('click', () => {
            this.togglePictureInPicture();
        });

        document.addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('expand-remote-video')) {
                h.maximiseStream(e);
            } else if (e.target && e.target.classList.contains('mute-remote-mic')) {
                h.singleStreamToggleMute(e);
            }
        });
    }

    getAndSetUserStream() {
        h.getUserFullMedia().then((stream) => {
            this.myStream = stream;
            console.log(this.myStream);
            h.setLocalStream(stream);
            startHandDetection(stream)
        }).catch((e) => {
            console.error(`stream error: ${e}`);
        });
    }

    initConnection(createOffer, partnerName , username) {
        this.pc[partnerName] = new RTCPeerConnection(h.getIceServer());

        if (this.screen && this.screen.getTracks().length) {
            this.screen.getTracks().forEach((track) => {
                this.pc[partnerName].addTrack(track, this.screen);
            });
        } else if (this.myStream) {
            this.myStream.getTracks().forEach((track) => {
                this.pc[partnerName].addTrack(track, this.myStream);
            });
        } else {
            h.getUserFullMedia().then((stream) => {
                this.myStream = stream;

                stream.getTracks().forEach((track) => {
                    this.pc[partnerName].addTrack(track, stream);
                });

                h.setLocalStream(stream);
            }).catch((e) => {
                console.error(`stream error: ${e}`);
            });
        }

        if (createOffer) {
            this.pc[partnerName].onnegotiationneeded = async () => {
                let offer = await this.pc[partnerName].createOffer();

                await this.pc[partnerName].setLocalDescription(offer);

                this.socket.emit('sdp', { description: this.pc[partnerName].localDescription, to: partnerName, sender: this.socketId });
            };
        }

        this.pc[partnerName].onicecandidate = ({ candidate }) => {
            this.socket.emit('ice candidates', { candidate: candidate, to: partnerName, sender: this.socketId });
        };

        this.pc[partnerName].ontrack = (e) => {
            this.handleOnTrack(e, partnerName, username);
        };

        this.pc[partnerName].onconnectionstatechange = () => {
            this.handleConnectionStateChange(partnerName);
        };

        this.pc[partnerName].onsignalingstatechange = () => {
            this.handleSignalingStateChange(partnerName);
        };
    }

    handleOnTrack(e, partnerName , username) {
        console.log(username)
        let str = e.streams[0];
        if (document.getElementById(`${partnerName}-video`)) {
            document.getElementById(`${partnerName}-video`).srcObject = str;
        } else {
            let newVid = document.createElement('video');
            newVid.id = `${partnerName}-video`;
            newVid.srcObject = str;
            newVid.autoplay = true;
            newVid.className = 'remote-video';

            let controlDiv = document.createElement('div');
            controlDiv.className = 'remote-video-controls';
            controlDiv.innerHTML = ` <span> ${username}</span> <span> <i class="fa fa-microphone text-white pr-3 mute-remote-mic" title="Mute"></i>
                <i class="fa fa-expand text-white expand-remote-video" title="Expand"></i></span>`;

            let cardDiv = document.createElement('div');
            cardDiv.className = 'remote-video-container';
            cardDiv.id = partnerName;
            cardDiv.appendChild(newVid);
            cardDiv.appendChild(controlDiv);

            document.getElementById('videos').appendChild(cardDiv);

            h.adjustVideoElemSize();
        }
    }

    handleConnectionStateChange(partnerName) {
        switch (this.pc[partnerName].iceConnectionState) {
            case 'disconnected':
            case 'failed':
            case 'closed':
                h.closeVideo(partnerName);
                break;
        }
    }

    handleSignalingStateChange(partnerName) {
        if (this.pc[partnerName].signalingState === 'closed') {
            console.log("Signalling state is 'closed'");
            h.closeVideo(partnerName);
        }
    }

    broadcastNewTracks(stream, type, mirrorMode = true) {
        h.setLocalStream(stream, mirrorMode);

        let track = type == 'audio' ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];

        for (let p in this.pc) {
            let pName = this.pc[p];

            if (typeof this.pc[pName] == 'object') {
                h.replaceTrack(track, this.pc[pName]);
            }
        }
    }

    toggleVideo(e) {
        let elem = document.getElementById('toggle-video');

        if (this.myStream.getVideoTracks()[0].enabled) {
            e.target.classList.remove('fa-video');
            e.target.classList.add('fa-video-slash');
            elem.setAttribute('title', 'Show Video');

            this.myStream.getVideoTracks()[0].enabled = false;
        } else {
            e.target.classList.remove('fa-video-slash');
            e.target.classList.add('fa-video');
            elem.setAttribute('title', 'Hide Video');

            this.myStream.getVideoTracks()[0].enabled = true;
        }

        this.broadcastNewTracks(this.myStream, 'video');
    }

    toggleMute(e) {
        let elem = document.getElementById('toggle-mute');

        if (this.myStream.getAudioTracks()[0].enabled) {
            e.target.classList.remove('fa-microphone-alt');
            e.target.classList.add('fa-microphone-alt-slash');
            elem.setAttribute('title', 'Unmute');

            this.myStream.getAudioTracks()[0].enabled = false;
        } else {
            e.target.classList.remove('fa-microphone-alt-slash');
            e.target.classList.add('fa-microphone-alt');
            elem.setAttribute('title', 'Mute');

            this.myStream.getAudioTracks()[0].enabled = true;
        }

        this.broadcastNewTracks(this.myStream, 'audio');
    }

    togglePictureInPicture() {
        if (!document.pictureInPictureElement) {
            document.getElementById('local').requestPictureInPicture()
                .catch(error => {
                    console.error(error);
                });
        } else {
            document.exitPictureInPicture()
                .catch(error => {
                    console.error(error);
                });
        }
    }
}

export default Room;
