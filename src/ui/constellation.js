// Constellation Star Calendar Renderer
import { profileState } from '../controllers/storageAdapter.js';

const milestoneCalendar = {
    "02-21": { type: "darshan", title: "The Mother's Birthday", desc: "Celebration of the birth of the Mother in Paris in 1878.", quote: "Sincerity is the key of the divine doors; it is the condition of all progress." },
    "04-24": { type: "darshan", title: "The Mother's Final Arrival", desc: "Marks the Mother's return to Pondicherry in 1920 to settle permanently.", quote: "Purity is the best shield against all vital storms." },
    "08-15": { type: "darshan", title: "Sri Aurobindo's Birthday", desc: "Celebration of the birth of Sri Aurobindo in Calcutta in 1872.", quote: "The Grace is always there, open yourself to it in quiet faith." },
    "11-24": { type: "darshan", title: "Siddhi Day (Victory Day)", desc: "Victory of the descent of Krishna Consciousness into the physical nature in 1926.", quote: "A silent mind is the first step toward spiritual realization." },
    "12-05": { type: "milestone", title: "Sri Aurobindo's Mahasamadhi", desc: "Commemoration of Sri Aurobindo withdrawing from his physical body in 1950.", quote: "The soul is here to manifest the Divine Light." }
};

export function renderConstellationCalendar(gridId, svgId) {
    const grid = document.getElementById(gridId);
    const svg = document.getElementById(svgId);
    if (!grid || !svg) return;
    
    grid.innerHTML = '';
    svg.innerHTML = '';
    
    const w = svg.parentElement.clientWidth;
    const h = svg.parentElement.clientHeight;
    
    // Nodes coordinates mapping forming Mother's 12-petaled symbol
    const nodes = [
        { id: 1, x: 0.5, y: 0.5, name: "Hub" }
    ];
    
    // 4 Inner petals
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        nodes.push({ id: 2 + i, x: 0.5 + Math.cos(angle) * 0.18, y: 0.5 + Math.sin(angle) * 0.18, name: `Inner ${i+1}` });
    }
    
    // 12 Outer petals
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        nodes.push({ id: 6 + i, x: 0.5 + Math.cos(angle) * 0.38, y: 0.5 + Math.sin(angle) * 0.38, name: `Outer ${i+1}` });
    }
    
    // Render
    nodes.forEach((n, idx) => {
        const cx = n.x * w;
        const cy = n.y * h;
        
        const nodeDiv = document.createElement('div');
        nodeDiv.className = 'star-node';
        nodeDiv.style.left = `${cx}px`;
        nodeDiv.style.top = `${cy}px`;
        
        // Check if reflection is logged for this star index
        const active = profileState.reflections.length > idx;
        if (active) {
            nodeDiv.classList.add('active-star');
        }
        
        // Check milestone date triggers (indices 1, 3, 7 map to milestones)
        const isMilestone = idx === 1 || idx === 3 || idx === 7;
        if (isMilestone) {
            nodeDiv.classList.add('event-halo');
            nodeDiv.onclick = () => {
                if (window.showToastMessage) {
                    window.showToastMessage("✨ Ashram Milestone Day: Concentrating on the Divine Presence.", 3500);
                }
            };
        } else if (active) {
            nodeDiv.onclick = () => {
                const entry = profileState.reflections[idx];
                const dateStr = entry && entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : '';
                const text = entry && entry.input_text ? entry.input_text : '';
                if (window.showToastMessage) {
                    window.showToastMessage(`📜 Reflection (${dateStr}): "${text}"`, 4000);
                }
            };
        }
        
        grid.appendChild(nodeDiv);
        
        // Draw connector line
        if (idx > 0) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', String(w * 0.5));
            line.setAttribute('y1', String(h * 0.5));
            line.setAttribute('x2', String(cx));
            line.setAttribute('y2', String(cy));
            line.setAttribute('stroke', active ? 'rgba(197, 168, 128, 0.6)' : 'rgba(255, 255, 255, 0.05)');
            line.setAttribute('stroke-width', '1.5');
            svg.appendChild(line);
        }
    });
}
export { milestoneCalendar };
