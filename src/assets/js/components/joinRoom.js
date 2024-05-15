function joinRoom() {
    // Create the main container element
    const container = document.createElement('div');
    container.id = 'username-set';

    // Create the "Your Name" header
    const header = document.createElement('div');
    header.classList.add('header');
    header.textContent = 'Your Name';
    container.appendChild(header);

    // Create error message section
    const errorMessage = document.createElement('div');
    errorMessage.id = 'err-msg-username';
    errorMessage.textContent = 'Please enter your name';
    container.appendChild(errorMessage);

    // Create input field for username
    const usernameInput = document.createElement('input');
    usernameInput.setAttribute('type', 'text');
    usernameInput.id = 'username';
    usernameInput.setAttribute('placeholder', 'Your Name');
    container.appendChild(usernameInput);

    // Create "Enter Room" button
    const enterRoomBtn = document.createElement('button');
    enterRoomBtn.setAttribute('type', 'button');
    enterRoomBtn.id = 'enter-room';
    enterRoomBtn.textContent = 'Enter Room';
    container.appendChild(enterRoomBtn);

    // Event listener for the "Enter Room" button click
    enterRoomBtn.addEventListener('click', function() {
        const name = usernameInput.value.trim();

        if (name) {
            // Remove error message, if any
            errorMessage.textContent = '';

            // Save the user's name in sessionStorage
            sessionStorage.setItem('username', name);

            // Reload room (for demonstration, you can replace with actual logic)
            location.reload();
        } else {
            errorMessage.textContent = 'Please input your name';
        }
    });

    // Return the container element (component)
    return container;
}

export default joinRoom