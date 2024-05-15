function Navbar() {
    // Create main container element (nav)
    const navbar = document.createElement('nav');
    navbar.classList.add('navbar', 'fixed-top', 'custom-navbar');

    // Navbar controls container
    const controlsContainer = document.createElement('div');
    controlsContainer.classList.add('navbar-controls');
    navbar.appendChild(controlsContainer);

    // Unique Identifier display
    const uniqueIdentifier = document.createElement('span');
    uniqueIdentifier.classList.add('text-white', 'mr-3');
    uniqueIdentifier.textContent = 'Unique Identifier:';
    controlsContainer.appendChild(uniqueIdentifier);

    const randomNumber = document.createElement('span');
    randomNumber.id = 'randomNumber';
    uniqueIdentifier.appendChild(randomNumber);

    // Array of button data (icon class, title, ID)
    const buttonsData = [
        { iconClass: 'fa-video', title: 'Hide Video', id: 'toggle-video' },
        { iconClass: 'fa-microphone-alt', title: 'Mute', id: 'toggle-mute' },
        // { iconClass: 'fa-desktop', title: 'Share Screen', id: 'share-screen' },
        // { iconClass: 'fa-circle', title: 'Record', id: 'record' },
        // { iconClass: 'fa-comment', title: 'Toggle Chat', id: 'toggle-chat-pane' },
    ];

    // Create buttons dynamically
    buttonsData.forEach(buttonData => {
        const button = document.createElement('button');
        button.classList.add('navbar-button');
        button.title = buttonData.title;
        button.id = buttonData.id

        const icon = document.createElement('i');
        icon.classList.add('fa', buttonData.iconClass, 'text-white'); // Apply Font Awesome class
        button.appendChild(icon);

        controlsContainer.appendChild(button);
    });

    // Create exit link
    const exitLink = document.createElement('a');
    exitLink.href = '/';
    exitLink.classList.add('navbar-exit-link', 'text-white');
    exitLink.title = 'Leave';

    const exitIcon = document.createElement('i');
    exitIcon.classList.add('fa', 'fa-sign-out-alt'); // Apply Font Awesome class
    exitLink.appendChild(exitIcon);

    controlsContainer.appendChild(exitLink);

    // Return the created navbar element
    return navbar;
}

export default Navbar;
