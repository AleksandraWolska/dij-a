"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dijkstraTime = exports.dijkstra = void 0;
const fastpriorityqueue_1 = __importDefault(require("fastpriorityqueue"));
function dijkstra(graph, sourceNode, destinationNode, momentZero) {
    const [costs, edgesUsed] = dijkstraTime(graph, sourceNode, momentZero);
    const path = [];
    let currentNode = destinationNode;
    while (currentNode !== sourceNode) {
        path.push(edgesUsed[currentNode]);
        currentNode = edgesUsed[currentNode].start;
    }
    path.reverse();
    return [costs[destinationNode], path];
}
exports.dijkstra = dijkstra;
function dijkstraTime(graph, sourceNode, momentZero) {
    var _a;
    const costs = {};
    const edgesUsed = {};
    const visitedNodes = new Set();
    for (const nodes of Object.values(graph.lines)) {
        for (const node in nodes) {
            costs[node] = Infinity;
            edgesUsed[node] = null;
        }
    }
    const pq = new fastpriorityqueue_1.default((a, b) => a[0] < b[0]);
    pq.add([0, sourceNode]);
    while (!pq.isEmpty()) {
        const [currentCost, currentNode] = pq.poll();
        if (!visitedNodes.has(currentNode)) {
            visitedNodes.add(currentNode);
        }
        const bestNewNodes = {};
        for (const [line, nodes] of Object.entries(graph.lines)) {
            if (currentNode in nodes) {
                for (const [neighbour, edges] of Object.entries(nodes[currentNode])) {
                    for (const edge of edges) {
                        if (edge.timeFromMomentZero < currentCost)
                            continue;
                        let waitingTime = edge.timeFromMomentZero - currentCost;
                        const changeTime = (edgesUsed[edge.start] && edge.line != ((_a = edgesUsed[edge.start]) === null || _a === void 0 ? void 0 : _a.line)) ? 1 : 0;
                        const newCost = currentCost + edge.rideCost + waitingTime + changeTime;
                        if (newCost < costs[edge.stop]) {
                            costs[edge.stop] = newCost;
                            edgesUsed[edge.stop] = edge;
                            bestNewNodes[edge.stop] = [newCost, edge];
                        }
                    }
                }
            }
        }
        for (const [node, [cost, edge]] of Object.entries(bestNewNodes)) {
            pq.add([cost, node]);
        }
    }
    return [costs, edgesUsed];
}
exports.dijkstraTime = dijkstraTime;
//# sourceMappingURL=dijkstra.js.map