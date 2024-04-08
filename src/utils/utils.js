function createContainer() {
    const container = document.createElement('div');
    container.id = 'container';
    return container;
}

function clearContent() {
    const container = document.getElementById('container');
    container.innerHTML = '';
    return container;
}


export { createContainer, clearContent }