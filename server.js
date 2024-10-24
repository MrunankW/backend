const express = require('express');
const cors = require('cors'); // Import the CORS package

const app = express();

// Use CORS middleware
app.use(cors());
const port = 3500;

// Define the 5 nodes with their respective traffic generation rates (packets per second)
let nodes = [
    { id: 'A', packets: 0, queue: [], trafficRate: 55 }, // 55 packets at 08:00
    { id: 'B', packets: 0, queue: [], trafficRate: 35 },
    { id: 'C', packets: 0, queue: [], trafficRate: 45 },
    { id: 'D', packets: 0, queue: [], trafficRate: 25 },
    { id: 'E', packets: 0, queue: [], trafficRate: 65 },
];

// Define the network links and their capacities (in packets per second)
let links = [
    { from: 'A', to: 'B', capacity: 100, load: 0 },
    { from: 'A', to: 'C', capacity: 80, load: 0 },
    { from: 'B', to: 'D', capacity: 70, load: 0 },
    { from: 'C', to: 'D', capacity: 90, load: 0 },
    { from: 'C', to: 'E', capacity: 100, load: 0 },
    { from: 'D', to: 'E', capacity: 60, load: 0 },
];

// Shortest path routing table
const routingTable = {
    'A': { 'B': ['A', 'B'], 'C': ['A', 'C'], 'D': ['A', 'B', 'D'], 'E': ['A', 'C', 'E'] },
    'B': { 'A': ['B', 'A'], 'C': ['B', 'A', 'C'], 'D': ['B', 'D'], 'E': ['B', 'D', 'E'] },
    'C': { 'A': ['C', 'A'], 'B': ['C', 'A', 'B'], 'D': ['C', 'D'], 'E': ['C', 'E'] },
    'D': { 'A': ['D', 'B', 'A'], 'B': ['D', 'B'], 'C': ['D', 'C'], 'E': ['D', 'E'] },
    'E': { 'A': ['E', 'C', 'A'], 'B': ['E', 'D', 'B'], 'C': ['E', 'C'], 'D': ['E', 'D'] },
};

// Maximum queue size at each node
const maxQueueSize = 50;

// Function to simulate traffic generation at each node
function generateTraffic() {
    nodes.forEach(node => {
        const newPacket = { id: Math.random(), destination: getRandomDestination(node.id) };
        if (node.queue.length < maxQueueSize) {
            node.queue.push(newPacket); // Add packet to the queue
            node.packets += 1;
        } else {
            console.log(`Queue full at node ${node.id}. Dropping packet.`);
        }
    });
}

// Helper function to get a random destination for the packets (excluding the source)
function getRandomDestination(sourceNodeId) {
    const otherNodes = nodes.filter(n => n.id !== sourceNodeId);
    const randomIndex = Math.floor(Math.random() * otherNodes.length);
    return otherNodes[randomIndex].id;
}

// Function to simulate packet routing with shortest path and capacity checking
function routePackets() {
    nodes.forEach(node => {
        if (node.queue.length > 0) {
            const packet = node.queue[0]; // Get the first packet in queue
            const route = routingTable[node.id][packet.destination]; // Get the route to destination
            const nextNode = route[1]; // Get the next node in the path

            // Find the link between the current node and the next node
            const link = links.find(l => l.from === node.id && l.to === nextNode);
            if (link && link.load < link.capacity) {
                node.queue.shift(); // Remove packet from the node queue
                link.load += 1; // Increment link load
                console.log(`Packet routed from ${node.id} to ${nextNode}.`);
            } else {
                console.log(`Link from ${node.id} to ${nextNode} is at capacity. Packet queued.`);
            }
        }
    });
}

// Function to reset the link loads every time step
function resetLinkLoads() {
    links.forEach(link => link.load = 0);
}

// API to get current network stats
app.get('/network-stats', (req, res) => {
    res.json({
        nodes: nodes.map(node => ({
            id: node.id,
            packetsGenerated: node.packets,
            queueLength: node.queue.length
        })),
        links: links.map(link => ({
            from: link.from,
            to: link.to,
            load: link.load,
            capacity: link.capacity
        }))
    });
});

// Simulate traffic generation, packet routing, and link load reset every second
setInterval(() => {
    resetLinkLoads();
    generateTraffic();
    routePackets();
}, 1000);

// Serve frontend (React app) from 'public' directory
app.use(express.static('public'));

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
