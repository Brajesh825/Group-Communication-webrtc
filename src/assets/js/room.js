import h from './helpers.js';


class Room {
    constructor(socket, room, username) {
        this.socket = socket
        this.socketId = ''
        this.randomNumber = `__${h.generateRandomString()}__${h.generateRandomString()}__`;
        this.myStream = ''
        this.screen = ''
        this.recordedStream = []
        this.mediaRecorder = ''
        this.room = room;
        this.socketId = this.socket.io.engine.id;
        this.pc = []
        this.username = username
    }

    listen = () => {
        this.socket.on('connect', this.onConnect)

        document.getElementById('chat-input-btn').addEventListener('click', (e) => {
            console.log("here: ", document.getElementById('chat-input').value)
            if (document.getElementById('chat-input').value.trim()) {
                this.sendMsg(document.getElementById('chat-input').value);

                setTimeout(() => {
                    document.getElementById('chat-input').value = '';
                }, 50);
            }
        });

        //Chat textarea
        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.which === 13 && (e.target.value.trim())) {
                e.preventDefault();

                this.sendMsg(e.target.value);

                setTimeout(() => {
                    e.target.value = '';
                }, 50);
            }
        });


        //When the video icon is clicked
        document.getElementById('toggle-video').addEventListener('click', (e) => {
            e.preventDefault();

            let elem = document.getElementById('toggle-video');

            if (this.myStream.getVideoTracks()[0].enabled) {
                e.target.classList.remove('fa-video');
                e.target.classList.add('fa-video-slash');
                elem.setAttribute('title', 'Show Video');

                this.myStream.getVideoTracks()[0].enabled = false;
            }

            else {
                e.target.classList.remove('fa-video-slash');
                e.target.classList.add('fa-video');
                elem.setAttribute('title', 'Hide Video');

                this.myStream.getVideoTracks()[0].enabled = true;
            }

            this.broadcastNewTracks(this.myStream, 'video');
        });


        //When the mute icon is clicked
        document.getElementById('toggle-mute').addEventListener('click', (e) => {
            e.preventDefault();

            let elem = document.getElementById('toggle-mute');

            if (this.myStream.getAudioTracks()[0].enabled) {
                e.target.classList.remove('fa-microphone-alt');
                e.target.classList.add('fa-microphone-alt-slash');
                elem.setAttribute('title', 'Unmute');

                this.myStream.getAudioTracks()[0].enabled = false;
            }

            else {
                e.target.classList.remove('fa-microphone-alt-slash');
                e.target.classList.add('fa-microphone-alt');
                elem.setAttribute('title', 'Mute');

                this.myStream.getAudioTracks()[0].enabled = true;
            }

            this.broadcastNewTracks(this.myStream, 'audio');
        });


        //When user clicks the 'Share screen' button
        document.getElementById('share-screen').addEventListener('click', (e) => {
            e.preventDefault();

            if (this.screen && this.screen.getVideoTracks().length && this.screen.getVideoTracks()[0].readyState != 'ended') {
                this.stopSharingScreen();
            }

            else {
                this.shareScreen();
            }
        });


        //When record button is clicked
        document.getElementById('record').addEventListener('click', (e) => {
            /**
             * Ask user what they want to record.
             * Get the stream based on selection and start recording
             */
            if (!mediaRecorder || mediaRecorder.state == 'inactive') {
                h.toggleModal('recording-options-modal', true);
            }

            else if (mediaRecorder.state == 'paused') {
                mediaRecorder.resume();
            }

            else if (mediaRecorder.state == 'recording') {
                mediaRecorder.stop();
            }
        });


        //When user choose to record screen
        document.getElementById('record-screen').addEventListener('click', () => {
            h.toggleModal('recording-options-modal', false);

            if (this.screen && this.screen.getVideoTracks().length) {
                startRecording(this.screen);
            }

            else {
                h.shareScreen().then((screenStream) => {
                    startRecording(screenStream);
                }).catch(() => { });
            }
        });


        //When user choose to record own video
        document.getElementById('record-video').addEventListener('click', () => {
            h.toggleModal('recording-options-modal', false);

            if (this.myStream && this.myStream.getTracks().length) {
                startRecording(this.myStream);
            }

            else {
                h.getUserFullMedia().then((videoStream) => {
                    startRecording(videoStream);
                }).catch(() => { });
            }
        });

    }

    // Event Listener
    onConnect = () => {
        document.getElementById('randomNumber').innerText = randomNumber;

        this.socket.emit('subscribe', {
            room: this.room,
            socketId: this.socketId
        })

        this.socket.on('new user', this.onNewUser)
        this.socket.on('newUserStart', this.onNewUserStart)
        this.socket.on('ice candidates', this.onIceCandidate)
        this.socket.on('sdp', this.onSDP)
        this.socket.on('chat', this.onChat)

    }

    onNewUser = (data) => {
        this.socket.emit('newUserStart', { to: data.socketId, sender: this.socketId });
        this.pc.push(data.socketId);
        this.init(true, data.socketId);
    }

    onNewUserStart = (data) => {
        this.pc.push(data.sender);
        this.init(false, data.sender);
    }

    onIceCandidate = async (data) => {
        console.log("Here");
        data.candidate ? await this.pc[data.sender].addIceCandidate(new RTCIceCandidate(data.candidate)) : '';
    }

    onSDP = async (data) => {
        if (data.description.type === 'offer') {
            data.description ? await this.pc[data.sender].setRemoteDescription(new RTCSessionDescription(data.description)) : '';

            h.getUserFullMedia().then(async (stream) => {
                if (!document.getElementById('local').srcObject) {
                    h.setLocalStream(stream);
                }

                //save my stream
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
        }

        else if (data.description.type === 'answer') {
            await this.pc[data.sender].setRemoteDescription(new RTCSessionDescription(data.description));
        }
    }

    onChat = (data) => {
        h.addChat(data, 'remote');
    }

    getAndSetUserStream = () => {
        h.getUserFullMedia().then((stream) => {
            //save my stream
            this.myStream = stream;

            h.setLocalStream(stream);
        }).catch((e) => {
            console.error(`stream error: ${e}`);
        });
    }

    init = (createOffer, partnerName) => {
        this.pc[partnerName] = new RTCPeerConnection(h.getIceServer());

        if (this.screen && this.screen.getTracks().length) {
            this.screen.getTracks().forEach((track) => {
                this.pc[partnerName].addTrack(track, this.screen);//should trigger negotiationneeded event
            });
        }

        else if (this.myStream) {
            this.myStream.getTracks().forEach((track) => {
                this.pc[partnerName].addTrack(track, this.myStream);//should trigger negotiationneeded event
            });
        }

        else {
            h.getUserFullMedia().then((stream) => {
                //save my stream
                this.myStream = stream;

                stream.getTracks().forEach((track) => {
                    this.pc[partnerName].addTrack(track, stream);//should trigger negotiationneeded event
                });

                h.setLocalStream(stream);
            }).catch((e) => {
                console.error(`stream error: ${e}`);
            });
        }



        //create offer
        if (createOffer) {
            this.pc[partnerName].onnegotiationneeded = async () => {
                let offer = await this.pc[partnerName].createOffer();

                await this.pc[partnerName].setLocalDescription(offer);

                this.socket.emit('sdp', { description: this.pc[partnerName].localDescription, to: partnerName, sender: this.socketId });
            };
        }



        //send ice candidate to partnerNames
        this.pc[partnerName].onicecandidate = ({ candidate }) => {
            this.socket.emit('ice candidates', { candidate: candidate, to: partnerName, sender: this.socketId });
        };



        //add
        this.pc[partnerName].ontrack = (e) => {
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
                cardDiv.className = 'card card-sm';
                cardDiv.id = partnerName;
                cardDiv.appendChild(newVid);
                cardDiv.appendChild(controlDiv);

                //put div in main-section elem
                document.getElementById('videos').appendChild(cardDiv);

                h.adjustVideoElemSize();
            }
        };



        this.pc[partnerName].onconnectionstatechange = (d) => {
            switch (this.pc[partnerName].iceConnectionState) {
                case 'disconnected':
                case 'failed':
                    h.closeVideo(partnerName);
                    break;

                case 'closed':
                    h.closeVideo(partnerName);
                    break;
            }
        };



        this.pc[partnerName].onsignalingstatechange = (d) => {
            switch (this.pc[partnerName].signalingState) {
                case 'closed':
                    console.log("Signalling state is 'closed'");
                    h.closeVideo(partnerName);
                    break;
            }
        };
    }

    sendMsg = (msg) => {
        let data = {
            room: this.room,
            msg: msg,
            sender: `${this.username} (${this.randomNumber})`
        };

        //emit chat message
        this.socket.emit('chat', data);

        //add localchat
        h.addChat(data, 'local');
    }

    shareScreen = () => {
        h.shareScreen().then((stream) => {
            h.toggleShareIcons(true);

            //disable the video toggle btns while sharing screen. This is to ensure clicking on the btn does not interfere with the screen sharing
            //It will be enabled was user stopped sharing screen
            h.toggleVideoBtnDisabled(true);

            //save my screen stream
            this.screen = stream;

            //share the new stream with all partners
            this.broadcastNewTracks(stream, 'video', false);

            //When the stop sharing button shown by the browser is clicked
            this.screen.getVideoTracks()[0].addEventListener('ended', () => {
                stopSharingScreen();
            });
        }).catch((e) => {
            console.error(e);
        });
    }

    stopSharingScreen = () => {
        //enable video toggle btn
        h.toggleVideoBtnDisabled(false);

        return new Promise((res, rej) => {
            this.screen.getTracks().length ? this.screen.getTracks().forEach(track => track.stop()) : '';

            res();
        }).then(() => {
            h.toggleShareIcons(false);
            this.broadcastNewTracks(this.myStream, 'video');
        }).catch((e) => {
            console.error(e);
        });
    }

    broadcastNewTracks = (stream, type, mirrorMode = true) => {
        h.setLocalStream(stream, mirrorMode);

        let track = type == 'audio' ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];

        for (let p in this.pc) {
            let pName = this.pc[p];

            if (typeof this.pc[pName] == 'object') {
                h.replaceTrack(track, this.pc[pName]);
            }
        }
    }

    toggleRecordingIcons = (isRecording) => {
        let e = document.getElementById('record');

        if (isRecording) {
            e.setAttribute('title', 'Stop recording');
            e.children[0].classList.add('text-danger');
            e.children[0].classList.remove('text-white');
        }

        else {
            e.setAttribute('title', 'Record');
            e.children[0].classList.add('text-white');
            e.children[0].classList.remove('text-danger');
        }
    }


    startRecording = (stream) => {
        mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9'
        });

        mediaRecorder.start(1000);
        toggleRecordingIcons(true);

        mediaRecorder.ondataavailable = function (e) {
            recordedStream.push(e.data);
        };

        mediaRecorder.onstop = function () {
            toggleRecordingIcons(false);

            h.saveRecordedStream(recordedStream, username);

            setTimeout(() => {
                recordedStream = [];
            }, 3000);
        };

        mediaRecorder.onerror = function (e) {
            console.error(e);
        };
    }


}

export default Room