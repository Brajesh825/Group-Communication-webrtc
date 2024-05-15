import helpers from '../helpers.js';

// Function to create the room creation component
function createRoom() {
    // Create the main container element
    const container = document.createElement('div');
    container.classList.add('room-container');

    // Create the "Create Room" header
    const header = document.createElement('div');
    header.classList.add('room-header');
    const headerText = document.createElement('h2');
    headerText.textContent = 'Create Room';
    header.appendChild(headerText);
    container.appendChild(header);

    // Create error message section
    const errorMessage = document.createElement('div');
    errorMessage.classList.add('error-message');
    const errorText = document.createElement('span');
    errorText.classList.add('error-text');
    errorMessage.appendChild(errorText);
    container.appendChild(errorMessage);

    // Create input fields for room name and user name
    const roomNameInput = createInputField('room-name', 'Room Name');
    const yourNameInput = createInputField('your-name', 'Your Name');
    container.appendChild(roomNameInput);
    container.appendChild(yourNameInput);

    // Create the "Create Room" button
    const createButton = document.createElement('button');
    createButton.classList.add('create-button');
    createButton.textContent = 'Create Room';
    container.appendChild(createButton);

    // Create room created message section
    const roomCreatedMessage = document.createElement('div');
    roomCreatedMessage.classList.add('room-created-message');
    container.appendChild(roomCreatedMessage);

    // Function to create input field
    function createInputField(id, label) {
        const div = document.createElement('div');
        div.classList.add('input-container');

        const inputLabel = document.createElement('label');
        inputLabel.textContent = label;

        const input = document.createElement('input');
        input.type = 'text';
        input.id = id;
        input.classList.add('text-input');
        input.placeholder = label;

        div.appendChild(inputLabel);
        div.appendChild(input);

        return div;
    }

    // Event listener for the "Create Room" button
    createButton.addEventListener('click', function (e) {
        e.preventDefault();

        let roomName = document.getElementById('room-name').value;
        let yourName = document.getElementById('your-name').value;

        if (roomName && yourName) {
            // Remove error message, if any
            errorText.textContent = '';

            // Save the user's name in sessionStorage
            sessionStorage.setItem('username', yourName);

            // Create room link
            let roomLink = `${location.origin}?room=${roomName.trim().replace(' ', '_')}_${helpers.generateRandomString()}`;

            // Show message with link to room
            roomCreatedMessage.innerHTML = `Room successfully created. Click <a href='${roomLink}'>here</a> to enter room. 
                Share the room link with your partners.`;

            // Empty the values
            document.getElementById('room-name').value = '';
            document.getElementById('your-name').value = '';
        } else {
            errorText.textContent = 'All fields are required';
        }
    });

    // Return the created room component container
    return container;
}

export default createRoom;
