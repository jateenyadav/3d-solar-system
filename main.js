// 3D Solar System Explorer
// Built with Three.js. Interactive scene with planets, moons, dwarf planets,
// asteroids, comets, spacecraft, Saturn's rings, sun glow, and a full control UI.

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// ---------------------------------------------------------------------------
// Scene-level state
// ---------------------------------------------------------------------------
let scene, camera, renderer, controls, composer;
let sun, sunGlow;
let planets = [];
let moons = [];
let asteroids = [];
let comets = [];
let spacecraft = [];
let orbitLines = [];

let raycaster, mouse;
let textureLoader;
let labels = [];

let isPaused = false;
let timeScale = 1; // global speed multiplier
let showOrbits = true;
let showLabels = true;

const clock = new THREE.Clock();

// FPS tracking
let frameCount = 0;
let fpsLastTime = performance.now();

const INITIAL_CAMERA_POSITION = { x: 0, y: 30, z: 70 };
const INITIAL_CAMERA_TARGET = { x: 0, y: 0, z: 0 };

// Reusable temp vector to avoid per-frame allocations in label projection
const tmpVec = new THREE.Vector3();

// ---------------------------------------------------------------------------
// Solar system data
// ---------------------------------------------------------------------------
const solarSystemData = {
    sun: {
        name: "Sun",
        radius: 5,
        description: "The Sun is the star at the center of the Solar System. It is a nearly perfect sphere of hot plasma, with internal convective motion that generates a magnetic field. Mass: 1.989 × 10³⁰ kg, Temperature: 5,778 K (surface), Age: 4.6 billion years.",
        texture: "textures/sun.jpg",
        color: 0xFFA500,
        facts: [
            "Contains 99.86% of the Solar System's mass",
            "Could fit 1.3 million Earths inside it",
            "Surface temperature: 5,778 K (5,505°C)",
            "Core temperature: 15 million°C"
        ]
    },
    planets: [
        {
            name: "Mercury", radius: 0.3, distance: 15, eccentricity: 0.2056, speed: 0.02,
            description: "Mercury is the smallest planet in our solar system and closest to the Sun. It has extreme temperature variations, from 427°C during the day to -173°C at night. Orbital period: 88 Earth days.",
            texture: "textures/mercury.jpg", color: 0x8C7853,
            facts: ["No atmosphere", "Heavily cratered surface", "One day = 59 Earth days", "No moons"]
        },
        {
            name: "Venus", radius: 0.5, distance: 20, eccentricity: 0.0067, speed: 0.015,
            description: "Venus is the second planet from the Sun and is similar in size to Earth. Known as Earth's twin, it has a thick, toxic atmosphere of carbon dioxide with sulfuric acid clouds. Surface temperature: 462°C.",
            texture: "textures/venus.jpg", color: 0xFFC649,
            facts: ["Hottest planet in solar system", "Rotates backwards", "Thick CO₂ atmosphere", "Surface pressure 90x Earth's"]
        },
        {
            name: "Earth", radius: 0.6, distance: 25, eccentricity: 0.0167, speed: 0.01,
            description: "Earth is the third planet from the Sun and the only known planet with life. It has liquid water, protective atmosphere, and moderate temperatures. Age: 4.54 billion years, Population: 8+ billion humans.",
            texture: "textures/earth.jpg", color: 0x6B93D6,
            facts: ["71% surface covered by water", "Only known planet with life", "1 natural satellite (Moon)", "Protective magnetic field"]
        },
        {
            name: "Mars", radius: 0.4, distance: 30, eccentricity: 0.0934, speed: 0.008,
            description: "Mars is the fourth planet from the Sun and is known as the Red Planet due to iron oxide on its surface. It has the largest volcano (Olympus Mons) and canyon (Valles Marineris) in the solar system.",
            texture: "textures/mars.jpg", color: 0xC1440E,
            facts: ["2 small moons: Phobos & Deimos", "Day length: 24h 37m", "Polar ice caps", "Evidence of ancient water"]
        },
        {
            name: "Jupiter", radius: 2.5, distance: 40, eccentricity: 0.0489, speed: 0.005,
            description: "Jupiter is the largest planet in our solar system and is a gas giant. It has a Great Red Spot (giant storm) and over 80 moons including the four Galilean moons. Acts as a cosmic vacuum cleaner.",
            texture: "textures/jupiter.jpg", color: 0xD8CA9D,
            facts: ["Great Red Spot storm", "95+ moons", "Mostly hydrogen & helium", "Could fit 1,300 Earths inside"]
        },
        {
            name: "Saturn", radius: 2.2, distance: 50, eccentricity: 0.0565, speed: 0.004,
            description: "Saturn is the sixth planet from the Sun and is famous for its prominent ring system made of ice and rock particles. It has 146 confirmed moons, including Titan with thick atmosphere.",
            texture: "textures/saturn.jpg", color: 0xFAD5A5, hasRings: true,
            facts: ["Prominent ring system", "146+ moons", "Less dense than water", "Hexagonal storm at north pole"]
        },
        {
            name: "Uranus", radius: 1.5, distance: 60, eccentricity: 0.0457, speed: 0.003,
            description: "Uranus is an ice giant that rotates on its side at 98° tilt. It has faint rings and 27 known moons. Discovered by William Herschel in 1781, it's the coldest planetary atmosphere in the solar system.",
            texture: "textures/uranus.jpg", color: 0x4FD0E3,
            facts: ["Rotates on its side (98° tilt)", "27 known moons", "Faint ring system", "Coldest atmosphere: -224°C"]
        },
        {
            name: "Neptune", radius: 1.4, distance: 70, eccentricity: 0.0113, speed: 0.002,
            description: "Neptune is the farthest planet from the Sun and is known for its strong winds reaching up to 2,100 km/h. It has 16 known moons, with Triton being the largest and orbiting backwards.",
            texture: "textures/neptune.jpg", color: 0x4B70DD,
            facts: ["Strongest winds: 2,100 km/h", "16 known moons", "Deep blue color from methane", "Takes 165 Earth years to orbit Sun"]
        }
    ],
    moons: [
        {
            name: "Moon", parent: "Earth", radius: 0.15, distance: 3, eccentricity: 0.0549, speed: 0.05,
            description: "The Moon is Earth's only natural satellite and the fifth-largest moon in the Solar System. Formed 4.5 billion years ago, it influences Earth's tides and stabilizes our planet's axial tilt.",
            texture: "textures/moon.jpg", color: 0x888888,
            facts: ["Influences Earth's tides", "Same side always faces Earth", "Apollo 11 first landing: 1969", "Diameter: 3,474 km"]
        }
    ],
    dwarfPlanets: [
        {
            name: "Pluto", radius: 0.2, distance: 80, eccentricity: 0.2488, speed: 0.001,
            description: "Pluto is a dwarf planet in the Kuiper belt. Discovered in 1930, reclassified as dwarf planet in 2006. It has 5 known moons with Charon being the largest, almost half Pluto's size.",
            texture: "textures/pluto.jpg", color: 0x8B4513,
            facts: ["Reclassified as dwarf planet in 2006", "5 known moons", "Made of rock and ice", "New Horizons flyby: 2015"]
        }
    ],
    spacecraft: [
        {
            name: "Chandrayaan-1", distance: 30, speed: 0.003, color: 0xFF6600,
            description: "India's first lunar probe launched by ISRO in 2008. Successfully confirmed water molecules on the Moon's surface. Mission cost: ₹386 crores. Operated for 312 days instead of planned 2 years.",
            facts: ["Discovered water on Moon", "Launched: October 22, 2008", "11 scientific instruments", "Lost contact in August 2009"]
        },
        {
            name: "Chandrayaan-2", distance: 32, speed: 0.0028, color: 0xFF4500,
            description: "India's second lunar exploration mission launched in 2019. Consisted of orbiter, lander (Vikram), and rover (Pragyan). Orbiter continues to study Moon despite lander's hard landing.",
            facts: ["Launched: July 22, 2019", "Orbiter still operational", "Vikram lander hard landing", "Pragyan rover: 27 kg"]
        },
        {
            name: "Chandrayaan-3", distance: 28, speed: 0.0032, color: 0xFF8C00,
            description: "India's third lunar mission launched in 2023. Successfully achieved soft landing near Moon's south pole, making India 4th country to land on Moon and 1st near south pole.",
            facts: ["Launched: July 14, 2023", "Soft landing: August 23, 2023", "South pole landing", "Cost: ₹615 crores"]
        },
        {
            name: "Mangalyaan (MOM)", distance: 35, speed: 0.0025, color: 0xDC143C,
            description: "India's Mars Orbiter Mission launched in 2013. Made India first country to reach Mars orbit in first attempt and first Asian country to reach Mars. Lowest cost Mars mission ever.",
            facts: ["First Mars mission success", "Cost: ₹450 crores", "Launched: November 5, 2013", "Mission life: 8+ years"]
        },
        {
            name: "Aditya-L1", distance: 45, speed: 0.002, color: 0xFFD700,
            description: "India's first solar observation mission launched in 2023. Positioned at Lagrange Point L1 to study Sun's corona, solar wind, and space weather. Seven scientific instruments onboard.",
            facts: ["First Indian solar mission", "Launched: September 2, 2023", "Lagrange Point L1 orbit", "7 scientific payloads"]
        },
        {
            name: "Voyager 1", distance: 90, speed: 0.0005, color: 0xC0C0C0,
            description: "NASA's space probe launched in 1977, now in interstellar space. Most distant human-made object from Earth. Carries Golden Record with sounds and images from Earth.",
            facts: ["In interstellar space", "Launched: September 5, 1977", "Carries Golden Record", "24+ billion km from Earth"]
        },
        {
            name: "PSLV-C37", distance: 55, speed: 0.0018, color: 0x4169E1,
            description: "ISRO's record-breaking mission that deployed 104 satellites in single launch (February 2017). Included main satellite Cartosat-2D and 103 co-passenger satellites from various countries.",
            facts: ["104 satellites in one launch", "World record holder", "February 15, 2017", "Multiple country satellites"]
        }
    ]
};

// ---------------------------------------------------------------------------
// Object registry (for selection / focus / labels)
// ---------------------------------------------------------------------------
// Every selectable object pushes an entry: { mesh, data, type }
let selectableObjects = [];
let selectedObject = null;
let focusTarget = null; // mesh the camera is following

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
function init() {
    const container = document.getElementById('container');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000008);

    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        2000
    );
    camera.position.set(
        INITIAL_CAMERA_POSITION.x,
        INITIAL_CAMERA_POSITION.y,
        INITIAL_CAMERA_POSITION.z
    );

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 8;
    controls.maxDistance = 600;
    controls.target.set(INITIAL_CAMERA_TARGET.x, INITIAL_CAMERA_TARGET.y, INITIAL_CAMERA_TARGET.z);

    textureLoader = new THREE.TextureLoader();
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    setupLighting();
    createStarfield();
    createSun();
    createPlanets();
    createMoons();
    createDwarfPlanets();
    createAsteroidBelt();
    createComet();
    createSpacecraft();
    setupPostProcessing();

    populateUI();
    setupEventListeners();

    animate();
}

// ---------------------------------------------------------------------------
// Lighting
// ---------------------------------------------------------------------------
function setupLighting() {
    // Sun is the main light source
    const sunLight = new THREE.PointLight(0xffffff, 3, 0, 0.6);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // Soft ambient fill so the dark sides aren't pure black
    const ambient = new THREE.AmbientLight(0x404050, 0.6);
    scene.add(ambient);

    // Subtle hemisphere light for nicer shading
    const hemi = new THREE.HemisphereLight(0x8899ff, 0x080820, 0.3);
    scene.add(hemi);
}

// ---------------------------------------------------------------------------
// Texture loader with graceful fallback color
// ---------------------------------------------------------------------------
function loadTextureWithFallback(material, url) {
    if (!url) return;
    textureLoader.load(
        url,
        (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            material.map = texture;
            material.needsUpdate = true;
        },
        undefined,
        () => {
            // Keep the fallback color already set on the material
        }
    );
}

// ---------------------------------------------------------------------------
// Starfield background
// ---------------------------------------------------------------------------
function createStarfield() {
    const starCount = 8000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
        const r = 400 + Math.random() * 600;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);

        const shade = 0.6 + Math.random() * 0.4;
        colors[i * 3] = shade;
        colors[i * 3 + 1] = shade;
        colors[i * 3 + 2] = shade + Math.random() * 0.1;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 1.2,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 0.9
    });

    const stars = new THREE.Points(geometry, material);
    stars.name = 'starfield';
    scene.add(stars);
}

// ---------------------------------------------------------------------------
// Orbit helpers
// ---------------------------------------------------------------------------
// Returns semi-major (a) and semi-minor (b) axes for a given mean distance
// and eccentricity, treating `distance` as the semi-major axis.
function ellipseAxes(distance, eccentricity = 0) {
    const a = distance;
    const b = a * Math.sqrt(1 - eccentricity * eccentricity);
    return { a, b };
}

// Position on an ellipse at parameter angle t, centered at origin with focus offset
function ellipsePosition(a, b, t) {
    const c = Math.sqrt(Math.max(a * a - b * b, 0)); // focal distance
    return {
        x: a * Math.cos(t) - c, // shift so the Sun sits at a focus
        z: b * Math.sin(t)
    };
}

function createOrbitLine(distance, eccentricity = 0, color = 0x335577) {
    const { a, b } = ellipseAxes(distance, eccentricity);
    const segments = 256;
    const points = [];
    for (let i = 0; i <= segments; i++) {
        const t = (i / segments) * Math.PI * 2;
        const { x, z } = ellipsePosition(a, b, t);
        points.push(new THREE.Vector3(x, 0, z));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.35
    });
    const line = new THREE.Line(geometry, material);
    line.visible = showOrbits;
    orbitLines.push(line);
    scene.add(line);
    return line;
}

// ---------------------------------------------------------------------------
// Sun
// ---------------------------------------------------------------------------
function createSun() {
    const data = solarSystemData.sun;
    const geometry = new THREE.SphereGeometry(data.radius, 64, 64);
    const material = new THREE.MeshBasicMaterial({ color: data.color });
    loadTextureWithFallback(material, data.texture);

    sun = new THREE.Mesh(geometry, material);
    sun.name = data.name;
    scene.add(sun);

    // Glow sprite around the sun
    const glowGeometry = new THREE.SphereGeometry(data.radius * 1.4, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffaa33,
        transparent: true,
        opacity: 0.25,
        side: THREE.BackSide
    });
    sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    sun.add(sunGlow);

    selectableObjects.push({ mesh: sun, data, type: 'star' });
}

// ---------------------------------------------------------------------------
// Planets
// ---------------------------------------------------------------------------
function createPlanets() {
    solarSystemData.planets.forEach((data) => {
        const geometry = new THREE.SphereGeometry(data.radius, 48, 48);
        const material = new THREE.MeshStandardMaterial({
            color: data.color,
            roughness: 0.85,
            metalness: 0.0
        });
        loadTextureWithFallback(material, data.texture);

        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = data.name;

        const pivot = new THREE.Object3D();
        scene.add(pivot);
        pivot.add(mesh);

        const { a, b } = ellipseAxes(data.distance, data.eccentricity);
        const start = ellipsePosition(a, b, Math.random() * Math.PI * 2);
        mesh.position.set(start.x, 0, start.z);

        createOrbitLine(data.distance, data.eccentricity);

        if (data.hasRings) addSaturnRings(mesh, data.radius);

        const planet = {
            mesh,
            pivot,
            data,
            angle: Math.random() * Math.PI * 2,
            a,
            b,
            rotationSpeed: 0.01 + Math.random() * 0.01
        };
        planets.push(planet);
        selectableObjects.push({ mesh, data, type: 'planet' });
    });
}

function addSaturnRings(planetMesh, planetRadius) {
    const inner = planetRadius * 1.3;
    const outer = planetRadius * 2.3;
    const geometry = new THREE.RingGeometry(inner, outer, 96);

    // Remap UVs so a radial gradient texture maps correctly
    const pos = geometry.attributes.position;
    const uv = geometry.attributes.uv;
    const v3 = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
        v3.fromBufferAttribute(pos, i);
        const dist = v3.length();
        uv.setXY(i, (dist - inner) / (outer - inner), 0.5);
    }

    const material = new THREE.MeshBasicMaterial({
        color: 0xcbb98c,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75
    });
    const rings = new THREE.Mesh(geometry, material);
    rings.rotation.x = Math.PI / 2.2;
    planetMesh.add(rings);
}

// ---------------------------------------------------------------------------
// Moons (orbit their parent planet)
// ---------------------------------------------------------------------------
function createMoons() {
    solarSystemData.moons.forEach((data) => {
        const parent = planets.find((p) => p.data.name === data.parent);
        if (!parent) return;

        const geometry = new THREE.SphereGeometry(data.radius, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: data.color,
            roughness: 0.95,
            metalness: 0.0
        });
        loadTextureWithFallback(material, data.texture);

        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = data.name;
        parent.mesh.add(mesh);

        const moon = {
            mesh,
            parent,
            data,
            angle: Math.random() * Math.PI * 2,
            distance: data.distance,
            speed: data.speed
        };
        moons.push(moon);
        selectableObjects.push({ mesh, data, type: 'moon' });
    });
}

// ---------------------------------------------------------------------------
// Dwarf planets (same as planets but tagged)
// ---------------------------------------------------------------------------
function createDwarfPlanets() {
    solarSystemData.dwarfPlanets.forEach((data) => {
        const geometry = new THREE.SphereGeometry(data.radius, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: data.color,
            roughness: 0.9,
            metalness: 0.0
        });
        loadTextureWithFallback(material, data.texture);

        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = data.name;
        scene.add(mesh);

        const { a, b } = ellipseAxes(data.distance, data.eccentricity);
        const start = ellipsePosition(a, b, Math.random() * Math.PI * 2);
        mesh.position.set(start.x, 0, start.z);

        createOrbitLine(data.distance, data.eccentricity, 0x553355);

        const dwarf = {
            mesh,
            data,
            angle: Math.random() * Math.PI * 2,
            a,
            b,
            rotationSpeed: 0.008
        };
        planets.push(dwarf); // animated with the same loop
        selectableObjects.push({ mesh, data, type: 'dwarf' });
    });
}

// ---------------------------------------------------------------------------
// Asteroid belt (between Mars and Jupiter)
// ---------------------------------------------------------------------------
function createAsteroidBelt() {
    const count = 1500;
    const innerR = 33;
    const outerR = 38;
    const geometry = new THREE.IcosahedronGeometry(0.08, 0);
    const material = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 1 });
    const mesh = new THREE.InstancedMesh(geometry, material, count);

    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
        const r = innerR + Math.random() * (outerR - innerR);
        const angle = Math.random() * Math.PI * 2;
        dummy.position.set(
            r * Math.cos(angle),
            (Math.random() - 0.5) * 1.5,
            r * Math.sin(angle)
        );
        const s = 0.5 + Math.random() * 1.5;
        dummy.scale.set(s, s, s);
        dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.name = 'asteroidBelt';
    scene.add(mesh);
    asteroids.push(mesh);
}

// ---------------------------------------------------------------------------
// Comet with a particle tail
// ---------------------------------------------------------------------------
function createComet() {
    const group = new THREE.Group();

    const nucleus = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xddeeff, emissive: 0x335577, emissiveIntensity: 0.4 })
    );
    group.add(nucleus);

    // Tail
    const tailCount = 300;
    const positions = new Float32Array(tailCount * 3);
    for (let i = 0; i < tailCount; i++) {
        positions[i * 3] = -(i / tailCount) * 4 + (Math.random() - 0.5) * 0.3;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    }
    const tailGeo = new THREE.BufferGeometry();
    tailGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const tailMat = new THREE.PointsMaterial({
        color: 0x88bbff,
        size: 0.15,
        transparent: true,
        opacity: 0.6
    });
    group.add(new THREE.Points(tailGeo, tailMat));

    scene.add(group);

    const { a, b } = ellipseAxes(95, 0.6);
    comets.push({ group, nucleus, a, b, angle: 0, speed: 0.0015 });
    createOrbitLine(95, 0.6, 0x224466);
}

// ---------------------------------------------------------------------------
// Spacecraft — built from real geometry, not boxes
// ---------------------------------------------------------------------------
function buildSpacecraftModel(color) {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color, metalness: 0.7, roughness: 0.35 });
    const panelMat = new THREE.MeshStandardMaterial({
        color: 0x1a2b6d,
        metalness: 0.4,
        roughness: 0.5,
        emissive: 0x0a1030,
        emissiveIntensity: 0.5
    });

    // Central body (cylinder)
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.7, 16), bodyMat);
    body.rotation.z = Math.PI / 2;
    group.add(body);

    // Nose cone
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.35, 16), bodyMat);
    nose.rotation.z = -Math.PI / 2;
    nose.position.x = 0.52;
    group.add(nose);

    // Solar panels
    const panelGeo = new THREE.BoxGeometry(0.5, 0.02, 0.3);
    const panelL = new THREE.Mesh(panelGeo, panelMat);
    panelL.position.set(0, 0, 0.4);
    group.add(panelL);
    const panelR = new THREE.Mesh(panelGeo, panelMat);
    panelR.position.set(0, 0, -0.4);
    group.add(panelR);

    // Dish antenna
    const dish = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.3, roughness: 0.6 })
    );
    dish.rotation.x = Math.PI;
    dish.position.x = -0.35;
    group.add(dish);

    return group;
}

function createSpacecraft() {
    solarSystemData.spacecraft.forEach((data) => {
        const model = buildSpacecraftModel(data.color);
        model.name = data.name;
        scene.add(model);

        const { a, b } = ellipseAxes(data.distance, 0.1);
        const start = ellipsePosition(a, b, Math.random() * Math.PI * 2);
        model.position.set(start.x, (Math.random() - 0.5) * 6, start.z);

        createOrbitLine(data.distance, 0.1, 0x444422);

        // Use an invisible hit sphere for easier raycast selection
        const hit = new THREE.Mesh(
            new THREE.SphereGeometry(0.8, 8, 8),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        model.add(hit);

        const craft = {
            model,
            hit,
            data,
            angle: Math.random() * Math.PI * 2,
            a,
            b,
            speed: data.speed
        };
        spacecraft.push(craft);
        selectableObjects.push({ mesh: hit, data, type: 'spacecraft', root: model });
    });
}

// ---------------------------------------------------------------------------
// Post-processing (bloom)
// ---------------------------------------------------------------------------
function setupPostProcessing() {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloom = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.8, // strength
        0.5, // radius
        0.85 // threshold
    );
    composer.addPass(bloom);
}

// ---------------------------------------------------------------------------
// Animation loop (single RAF, delta-timed)
// ---------------------------------------------------------------------------
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const step = isPaused ? 0 : delta * timeScale;

    // Planets & dwarf planets along their ellipses
    planets.forEach((p) => {
        p.angle += p.data.speed * step * 60;
        const { x, z } = ellipsePosition(p.a, p.b, p.angle);
        p.mesh.position.set(x, 0, z);
        p.mesh.rotation.y += p.rotationSpeed * step * 60;
    });

    // Moons around their parent
    moons.forEach((m) => {
        m.angle += m.speed * step * 60;
        m.mesh.position.set(
            Math.cos(m.angle) * m.distance,
            0,
            Math.sin(m.angle) * m.distance
        );
    });

    // Sun spin + glow pulse
    if (sun) {
        sun.rotation.y += 0.002 * step * 60;
        const pulse = 1 + Math.sin(clock.elapsedTime * 1.5) * 0.03;
        if (sunGlow) sunGlow.scale.setScalar(pulse);
    }

    // Asteroid belt slow rotation
    asteroids.forEach((a) => { a.rotation.y += 0.0005 * step * 60; });

    // Comets
    comets.forEach((c) => {
        c.angle += c.speed * step * 60;
        const { x, z } = ellipsePosition(c.a, c.b, c.angle);
        c.group.position.set(x, 0, z);
        // Point the tail away from the sun
        c.group.lookAt(0, 0, 0);
    });

    // Spacecraft
    spacecraft.forEach((s) => {
        s.angle += s.speed * step * 60;
        const { x, z } = ellipsePosition(s.a, s.b, s.angle);
        s.model.position.set(x, s.model.position.y, z);
        s.model.rotation.y += 0.01 * step * 60;
    });

    // Camera follow when focusing an object
    if (focusTarget) {
        focusTarget.getWorldPosition(tmpVec);
        controls.target.lerp(tmpVec, 0.08);
    }

    controls.update();
    updateLabels();
    updateFPS();

    if (composer) composer.render();
    else renderer.render(scene, camera);
}

function updateFPS() {
    frameCount++;
    const now = performance.now();
    if (now - fpsLastTime >= 500) {
        const fps = Math.round((frameCount * 1000) / (now - fpsLastTime));
        const el = document.getElementById('fpsValue');
        if (el) el.textContent = fps;
        frameCount = 0;
        fpsLastTime = now;
    }
}

// ---------------------------------------------------------------------------
// Floating labels (HTML overlays projected from 3D positions)
// ---------------------------------------------------------------------------
function ensureLabel(name) {
    let label = labels.find((l) => l.name === name);
    if (label) return label;
    const el = document.createElement('div');
    el.className = 'object-label';
    el.textContent = name;
    document.body.appendChild(el);
    label = { name, el };
    labels.push(label);
    return label;
}

function updateLabels() {
    if (!showLabels) {
        labels.forEach((l) => (l.el.style.display = 'none'));
        return;
    }
    selectableObjects.forEach((obj) => {
        const target = obj.root || obj.mesh;
        target.getWorldPosition(tmpVec);
        const distToCam = camera.position.distanceTo(tmpVec);
        const label = ensureLabel(obj.data.name);

        tmpVec.project(camera);
        const behind = tmpVec.z > 1;
        if (behind || distToCam > 400) {
            label.el.style.display = 'none';
            return;
        }
        const x = (tmpVec.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-tmpVec.y * 0.5 + 0.5) * window.innerHeight;
        label.el.style.display = 'block';
        label.el.style.left = `${x}px`;
        label.el.style.top = `${y}px`;
        label.el.classList.toggle('selected', selectedObject === obj);
    });
}

// ---------------------------------------------------------------------------
// UI population (menu lists, checklist)
// ---------------------------------------------------------------------------
function populateUI() {
    const planetsList = document.getElementById('planetsList');
    const moonsList = document.getElementById('moonsList');
    const spacecraftList = document.getElementById('spacecraftList');
    const othersList = document.getElementById('othersList');
    const checklistItems = document.getElementById('checklistItems');

    const makeItem = (obj, onClick) => {
        const li = document.createElement('li');
        li.textContent = obj.data.name;
        li.className = 'menu-item';
        li.addEventListener('click', onClick);
        return li;
    };

    selectableObjects.forEach((obj) => {
        const handler = () => selectObject(obj, true);
        if (obj.type === 'planet' && planetsList) planetsList.appendChild(makeItem(obj, handler));
        else if (obj.type === 'moon' && moonsList) moonsList.appendChild(makeItem(obj, handler));
        else if (obj.type === 'spacecraft' && spacecraftList) spacecraftList.appendChild(makeItem(obj, handler));
        else if (othersList && (obj.type === 'dwarf' || obj.type === 'comet' || obj.type === 'star')) {
            othersList.appendChild(makeItem(obj, handler));
        }
    });

    // Checklist: one tickable entry per object so users can track what they've explored
    if (checklistItems) {
        selectableObjects.forEach((obj) => {
            const li = document.createElement('li');
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.id = `chk-${obj.data.name.replace(/\s+/g, '-')}`;
            const lbl = document.createElement('label');
            lbl.htmlFor = cb.id;
            lbl.textContent = obj.data.name;
            li.appendChild(cb);
            li.appendChild(lbl);
            checklistItems.appendChild(li);
            obj.checkbox = cb;
        });
    }
}

// ---------------------------------------------------------------------------
// Selection + focus
// ---------------------------------------------------------------------------
function selectObject(obj, focus = false) {
    selectedObject = obj;
    if (obj.checkbox) obj.checkbox.checked = true;
    showInfoPanel(obj.data);
    if (focus) {
        focusTarget = obj.root || obj.mesh;
        const r = obj.data.radius || 2;
        const offset = Math.max(r * 5, 8);
        const target = obj.root || obj.mesh;
        target.getWorldPosition(tmpVec);
        camera.position.set(tmpVec.x + offset, tmpVec.y + offset * 0.5, tmpVec.z + offset);
    }
}

function showInfoPanel(data) {
    const panel = document.getElementById('infoPanel');
    const content = document.getElementById('infoContent');
    if (!panel || !content) return;

    let html = `<h2>${data.name}</h2>`;
    if (data.type) html += `<p class="info-type">${data.type}</p>`;
    if (data.description) html += `<p>${data.description}</p>`;

    const stats = [];
    if (data.diameter) stats.push(['Diameter', data.diameter]);
    if (data.distance) stats.push(['Distance from Sun', data.distance]);
    if (data.orbitalPeriod) stats.push(['Orbital Period', data.orbitalPeriod]);
    if (data.dayLength) stats.push(['Day Length', data.dayLength]);
    if (data.temperature) stats.push(['Temperature', data.temperature]);
    if (data.moons !== undefined) stats.push(['Moons', data.moons]);
    if (data.gravity) stats.push(['Gravity', data.gravity]);
    if (data.agency) stats.push(['Agency', data.agency]);
    if (data.launchDate) stats.push(['Launch Date', data.launchDate]);
    if (data.mission) stats.push(['Mission', data.mission]);
    if (data.status) stats.push(['Status', data.status]);

    if (stats.length) {
        html += '<div class="info-stats">';
        stats.forEach(([k, v]) => {
            html += `<div class="stat-row"><span class="stat-key">${k}</span><span class="stat-val">${v}</span></div>`;
        });
        html += '</div>';
    }

    if (Array.isArray(data.facts) && data.facts.length) {
        html += '<h3>Did you know?</h3><ul class="info-facts">';
        data.facts.forEach((f) => (html += `<li>${f}</li>`));
        html += '</ul>';
    }

    content.innerHTML = html;
    panel.classList.add('visible');
}

function onPointerDown(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const meshes = selectableObjects.map((o) => o.hit || o.mesh);
    const hits = raycaster.intersectObjects(meshes, true);
    if (hits.length) {
        let node = hits[0].object;
        const obj = selectableObjects.find(
            (o) => o.hit === node || o.mesh === node ||
                   (o.root && (o.root === node || isDescendant(o.root, node)))
        );
        if (obj) selectObject(obj, true);
    }
}

function isDescendant(root, node) {
    let cur = node;
    while (cur) { if (cur === root) return true; cur = cur.parent; }
    return false;
}

// ---------------------------------------------------------------------------
// Global UI handlers (referenced from index.html onclick attributes)
// ---------------------------------------------------------------------------
function togglePause() {
    isPaused = !isPaused;
    const btn = document.getElementById('pauseBtn');
    if (btn) btn.textContent = isPaused ? '▶ Play' : '⏸ Pause';
}

function zoomIn() { dollyCamera(0.8); }
function zoomOut() { dollyCamera(1.25); }
function dollyCamera(factor) {
    const dir = new THREE.Vector3().subVectors(camera.position, controls.target);
    dir.multiplyScalar(factor);
    camera.position.copy(controls.target).add(dir);
}

function resetView() {
    focusTarget = null;
    selectedObject = null;
    camera.position.set(INITIAL_CAMERA_POSITION.x, INITIAL_CAMERA_POSITION.y, INITIAL_CAMERA_POSITION.z);
    controls.target.set(INITIAL_CAMERA_TARGET.x, INITIAL_CAMERA_TARGET.y, INITIAL_CAMERA_TARGET.z);
}

function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
}

function toggleMenu() { document.getElementById('menuContent')?.classList.toggle('expanded'); }
function toggleToolkit() { document.getElementById('toolkitContent')?.classList.toggle('expanded'); }
function toggleChecklist() { document.getElementById('checklistPanel')?.classList.toggle('visible'); }
function hideInfo() { document.getElementById('infoPanel')?.classList.remove('visible'); }
function showInfo() { if (selectedObject) showInfoPanel(selectedObject.data); }

function toggleOrbits() {
    showOrbits = !showOrbits;
    orbitLines.forEach((l) => (l.visible = showOrbits));
}
function toggleLabels() { showLabels = !showLabels; }

function setTimeScale(value) {
    timeScale = parseFloat(value);
    const el = document.getElementById('speedValue');
    if (el) el.textContent = `${timeScale.toFixed(1)}x`;
}

// Expose handlers to the global scope for inline HTML onclick attributes
Object.assign(window, {
    togglePause, zoomIn, zoomOut, resetView, toggleFullscreen,
    toggleMenu, toggleToolkit, toggleChecklist, hideInfo, showInfo,
    toggleOrbits, toggleLabels, setTimeScale,
});

// ---------------------------------------------------------------------------
// Event listeners
// ---------------------------------------------------------------------------
function setupEventListeners() {
    window.addEventListener('resize', onWindowResize);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);

    const speedSlider = document.getElementById('speedSlider');
    if (speedSlider) speedSlider.addEventListener('input', (e) => setTimeScale(e.target.value));

    const search = document.getElementById('searchInput');
    if (search) search.addEventListener('input', onSearch);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (composer) composer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(e) {
    switch (e.key.toLowerCase()) {
        case ' ': e.preventDefault(); togglePause(); break;
        case 'o': toggleOrbits(); break;
        case 'l': toggleLabels(); break;
        case 'r': resetView(); break;
        case 'f': toggleFullscreen(); break;
        case '+': case '=': zoomIn(); break;
        case '-': zoomOut(); break;
    }
}

function onSearch(e) {
    const q = e.target.value.trim().toLowerCase();
    if (!q) return;
    const match = selectableObjects.find((o) => o.data.name.toLowerCase().includes(q));
    if (match) selectObject(match, true);
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
init();
