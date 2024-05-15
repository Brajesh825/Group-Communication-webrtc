function ConferenceComponent() {
    // Create main container element
    const container = document.createElement('div');
    container.classList.add('room-comm');
    container.setAttribute('hidden', true);

    const conferenceContainer = document.createElement('div');
    conferenceContainer.classList.add('conference-container');

    // Row for video elements
    const videoRow = document.createElement('div');
    videoRow.classList.add('local-video-container');

    // Local video element (user's own video)
    const localVideo = document.createElement('video');
    localVideo.classList.add('local-video', 'mirror-mode');
    localVideo.id = 'local';
    localVideo.volume = 0;
    localVideo.autoplay = true;
    localVideo.muted = true;
    videoRow.appendChild(localVideo);

    // Row for main section (videos)
    const mainRow = document.createElement('div');
    mainRow.id = 'main-section';
    mainRow.classList.add('remote-videos-container');

    // Container for video display area
    const videosContainer = document.createElement('div');
    videosContainer.id = 'videos';
    videosContainer.classList.add('remote-videos');
    mainRow.appendChild(videosContainer);

    // Chat column
    const chatCol = document.createElement('div');
    chatCol.id = 'chat-pane';
    chatCol.setAttribute('hidden', true);

    // Chat header
    const chatHeader = document.createElement('div');
    chatHeader.classList.add('row');
    chatHeader.innerHTML = '<div">CHAT</div>';
    chatCol.appendChild(chatHeader);

    // Container for chat messages
    const chatMessages = document.createElement('div');
    chatMessages.id = 'chat-messages';
    chatCol.appendChild(chatMessages);

    // Form for chat input
    const chatForm = document.createElement('form');
    const inputGroup = document.createElement('div');
    const chatInput = document.createElement('textarea');
    chatInput.id = 'chat-input';
    chatInput.rows = 3;
    chatInput.placeholder = 'Type here...';
    inputGroup.appendChild(chatInput);

    // Button for sending chat messages
    const sendButton = document.createElement('button');
    sendButton.type = 'button';
    sendButton.textContent = 'Send';
    inputGroup.appendChild(sendButton);

    // Append input group to form
    chatForm.appendChild(inputGroup);
    chatCol.appendChild(chatForm);

    // Append rows and columns to container
    conferenceContainer.appendChild(videoRow);
    conferenceContainer.appendChild(mainRow);
    conferenceContainer.appendChild(chatCol);

    // Event listener for send button (dummy function)
    sendButton.addEventListener('click', function() {
        const message = chatInput.value.trim();
        if (message) {
            console.log('Sending message:', message);
            chatInput.value = ''; // Clear input after sending (replace with actual logic)
        }
    });

    container.appendChild(conferenceContainer)

    // Return the container element (component)
    return container;
}

export default ConferenceComponent;
