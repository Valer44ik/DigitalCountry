const apiUrl = 'http://localhost:3000';

// Arrays to store map markers and connections
const nodeMarkers = [];
const nodeConnections = [];

// Initialize the map centered on the Pacific Ocean
const map = L.map('map').setView([0, -120], 5);

// Add tile layer to the map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap contributors',
}).addTo(map);

/**
 * Draw nodes and their connections on the map.
 */
function drawNodesAndConnections(nodes) {
    // Clear existing markers and connections
    nodeMarkers.forEach((marker) => map.removeLayer(marker));
    nodeConnections.forEach((line) => map.removeLayer(line));
    nodeMarkers.length = 0;
    nodeConnections.length = 0;

    // Add nodes to the map
    nodes.forEach((node) => {
        const coords = [parseFloat(node.latitude), parseFloat(node.longitude)];
        const marker = L.marker(coords)
            .addTo(map)
            .bindPopup(`<b>${node.name}</b>`);
        nodeMarkers.push(marker);
    });

    // Draw connections between nodes
    for (let i = 0; i < nodeMarkers.length; i++) {
        for (let j = i + 1; j < nodeMarkers.length; j++) {
            const polyline = L.polyline(
                [nodeMarkers[i].getLatLng(), nodeMarkers[j].getLatLng()],
                { color: 'blue' }
            ).addTo(map);
            nodeConnections.push(polyline);
        }
    }
}

/**
 * Fetch nodes from the backend and render them on the map.
 */
async function fetchNodes() {
    try {
        const response = await fetch(`${apiUrl}/nodes`);
        const nodes = await response.json();
        drawNodesAndConnections(nodes);

        // Populate the node dropdown dynamically
        const nodeSelect = document.getElementById('citizen-node');
        nodeSelect.innerHTML = ''; // Clear existing options
        nodes.forEach((node) => {
            const option = document.createElement('option');
            option.value = node.id;
            option.textContent = node.name;
            nodeSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching nodes:', error);
    }
}

/**
 * Add a new node to the map and backend.
 */
async function addNode(name, coords) {
    try {
        const response = await fetch(`${apiUrl}/nodes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, latitude: coords[0], longitude: coords[1] }),
        });

        if (!response.ok) {
            const error = await response.json();
            alert(error.message);
            return;
        }

        const data = await response.json();
        console.log('Node added:', data.node);
        fetchNodes(); // Refresh nodes after adding
    } catch (error) {
        console.error('Error adding node:', error);
        alert('Failed to add node.');
    }
}

/**
 * Delete a node by its ID.
 */
async function deleteNode(nodeId) {
    try {
        const response = await fetch(`${apiUrl}/nodes/${nodeId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const error = await response.json();
            alert(error.message);
            return;
        }

        console.log('Node deleted:', nodeId);
        fetchNodes(); // Refresh nodes after deletion
    } catch (error) {
        console.error('Error deleting node:', error);
        alert('Failed to delete node.');
    }
}

/**
 * Load citizens and display them in the citizen list.
 */
async function loadCitizens() {
    try {
        const response = await fetch(`${apiUrl}/citizens`);
        const citizens = await response.json();

        const list = document.getElementById('citizen-list');
        list.innerHTML = '';
        citizens.forEach((citizen) => {
            const li = document.createElement('li');
            li.textContent = `${citizen.name} (${citizen.email}) - Node ID: ${citizen.node_id}`;
            list.appendChild(li);
        });
    } catch (error) {
        console.error('Error loading citizens:', error);
    }
}

/**
 * Add a citizen via the form.
 */
document.getElementById('add-citizen-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('citizen-name').value;
    const email = document.getElementById('citizen-email').value;
    const node_id = parseInt(document.getElementById('citizen-node').value);

    try {
        await fetch(`${apiUrl}/citizens`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, node_id }),
        });
        loadCitizens(); // Refresh citizens list
    } catch (error) {
        console.error('Error adding citizen:', error);
    }
});

/**
 * Load polls and display them in the poll list.
 */
async function loadPolls() {
    try {
        const response = await fetch(`${apiUrl}/polls`);
        const polls = await response.json();

        const list = document.getElementById('poll-list');
        list.innerHTML = '';
        polls.forEach((poll) => {
            const li = document.createElement('li');
            li.textContent = `${poll.title} - Options: ${poll.options.join(', ')}`;
            list.appendChild(li);
        });
    } catch (error) {
        console.error('Error loading polls:', error);
    }
}

/**
 * Add a poll via the form.
 */
document.getElementById('add-poll-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('poll-title').value;
    const options = document.getElementById('poll-options').value.split(',');

    try {
        await fetch(`${apiUrl}/polls`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, options }),
        });
        loadPolls(); // Refresh polls list
    } catch (error) {
        console.error('Error adding poll:', error);
    }
})

document.getElementById('add-node-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('node-name').value;
    const lat = parseFloat(document.getElementById('node-lat').value);
    const lng = parseFloat(document.getElementById('node-lng').value);

    if (!name || isNaN(lat) || isNaN(lng)) {
        alert('Please provide valid inputs.');
        return;
    }

    await addNode(name, [lat, lng]); // Call the function
});

/**
 * Add search functionality to filter citizens dynamically.
 */
document.getElementById('search').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();

    const list = document.getElementById('citizen-list');
    const citizens = Array.from(list.children);

    citizens.forEach((citizen) => {
        if (citizen.textContent.toLowerCase().includes(query)) {
            citizen.style.display = '';
        } else {
            citizen.style.display = 'none';
        }
    });
});

// Fetch nodes, citizens, and polls on page load
fetchNodes();
loadCitizens();
loadPolls();

document.getElementById('fleeingButton').addEventListener('mouseover', function () {
    const button = this;
    const randomX = Math.random() * (window.innerWidth - button.offsetWidth);
    const randomY = Math.random() * (window.innerHeight - button.offsetHeight);
    button.style.position = 'absolute';
    button.style.left = `${randomX}px`;
    button.style.top = `${randomY}px`;
});

// Add shake effect to citizen list
document.getElementById('citizen-list').addEventListener('mouseover', function () {
    this.classList.add('shake');
    setTimeout(() => this.classList.remove('shake'), 500);
});

// Add a spinning effect to the map on load
window.addEventListener('load', function () {
    const mapContainer = document.getElementById('map');
    mapContainer.classList.add('spin');
    setTimeout(() => mapContainer.classList.remove('spin'), 2000);
});