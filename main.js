// Import Three.js core library and OrbitControls for camera movement
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Global variables for scene management
let scene, camera, renderer, controls;
let sun, planets = [], moons = [], asteroids = [], comets = [], spacecraft = [];
let selectedObject = null;
let raycaster, mouse;
let labels = []; // Array to store object labels
let textureLoader; // Global texture loader
let isPaused = false; // Animation pause state
let animationId; // Store animation frame ID for cancellation
let renderLoop; // Separate render loop for paused state

// Store initial camera position for reset
let initialCameraPosition = { x: 0, y: 20, z: 50 };
let initialCameraTarget = { x: 0, y: 0, z: 0 };

// Enhanced solar system data with more Indian spacecraft and detailed information
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
            name: "Mercury", 
            radius: 0.3, 
            distance: 15,
            eccentricity: 0.2056,
            speed: 0.02,
            description: "Mercury is the smallest planet in our solar system and closest to the Sun. It has extreme temperature variations, from 427°C during the day to -173°C at night. Orbital period: 88 Earth days.",
            texture: "textures/mercury.jpg",
            color: 0x8C7853,
            facts: ["No atmosphere", "Heavily cratered surface", "One day = 59 Earth days", "No moons"]
        },
        {
            name: "Venus", 
            radius: 0.5, 
            distance: 20, 
            eccentricity: 0.0067,
            speed: 0.015,
            description: "Venus is the second planet from the Sun and is similar in size to Earth. Known as Earth's twin, it has a thick, toxic atmosphere of carbon dioxide with sulfuric acid clouds. Surface temperature: 462°C.",
            texture: "textures/venus.jpg",
            color: 0xFFC649,
            facts: ["Hottest planet in solar system", "Rotates backwards", "Thick CO₂ atmosphere", "Surface pressure 90x Earth's"]
        },
        {
            name: "Earth", 
            radius: 0.6, 
            distance: 25, 
            eccentricity: 0.0167,
            speed: 0.01,
            description: "Earth is the third planet from the Sun and the only known planet with life. It has liquid water, protective atmosphere, and moderate temperatures. Age: 4.54 billion years, Population: 8+ billion humans.",
            texture: "textures/earth.jpg",
            color: 0x6B93D6,
            facts: ["71% surface covered by water", "Only known planet with life", "1 natural satellite (Moon)", "Protective magnetic field"]
        },
        {
            name: "Mars", 
            radius: 0.4, 
            distance: 30, 
            eccentricity: 0.0934,
            speed: 0.008,
            description: "Mars is the fourth planet from the Sun and is known as the Red Planet due to iron oxide on its surface. It has the largest volcano (Olympus Mons) and canyon (Valles Marineris) in the solar system.",
            texture: "textures/mars.jpg",
            color: 0xC1440E,
            facts: ["2 small moons: Phobos & Deimos", "Day length: 24h 37m", "Polar ice caps", "Evidence of ancient water"]
        },
        {
            name: "Jupiter", 
            radius: 2.5, 
            distance: 40, 
            eccentricity: 0.0489,
            speed: 0.005,
            description: "Jupiter is the largest planet in our solar system and is a gas giant. It has a Great Red Spot (giant storm) and over 80 moons including the four Galilean moons. Acts as a cosmic vacuum cleaner.",
            texture: "textures/jupiter.jpg",
            color: 0xD8CA9D,
            facts: ["Great Red Spot storm", "95+ moons", "Mostly hydrogen & helium", "Could fit 1,300 Earths inside"]
        },
        {
            name: "Saturn", 
            radius: 2.2, 
            distance: 50, 
            eccentricity: 0.0565,
            speed: 0.004,
            description: "Saturn is the sixth planet from the Sun and is famous for its prominent ring system made of ice and rock particles. It has 146 confirmed moons, including Titan with thick atmosphere.",
            texture: "textures/saturn.jpg",
            color: 0xFAD5A5,
            facts: ["Prominent ring system", "146+ moons", "Less dense than water", "Hexagonal storm at north pole"]
        },
        {
            name: "Uranus", 
            radius: 1.5, 
            distance: 60, 
            eccentricity: 0.0457,
            speed: 0.003,
            description: "Uranus is an ice giant that rotates on its side at 98° tilt. It has faint rings and 27 known moons. Discovered by William Herschel in 1781, it's the coldest planetary atmosphere in the solar system.",
            texture: "textures/uranus.jpg",
            color: 0x4FD0E3,
            facts: ["Rotates on its side (98° tilt)", "27 known moons", "Faint ring system", "Coldest atmosphere: -224°C"]
        },
        {
            name: "Neptune", 
            radius: 1.4, 
            distance: 70, 
            eccentricity: 0.0113,
            speed: 0.002,
            description: "Neptune is the farthest planet from the Sun and is known for its strong winds reaching up to 2,100 km/h. It has 16 known moons, with Triton being the largest and orbiting backwards.",
            texture: "textures/neptune.jpg",
            color: 0x4B70DD,
            facts: ["Strongest winds: 2,100 km/h", "16 known moons", "Deep blue color from methane", "Takes 165 Earth years to orbit Sun"]
        }
    ],
    moons: [
        {
            name: "Moon", 
            parent: "Earth", 
            radius: 0.15, 
            distance: 3, 
            eccentricity: 0.0549,
            speed: 0.05,
            description: "The Moon is Earth's only natural satellite and the fifth-largest moon in the Solar System. Formed 4.5 billion years ago, it influences Earth's tides and stabilizes our planet's axial tilt.",
            texture: "textures/moon.jpg",
            color: 0x888888,
            facts: ["Influences Earth's tides", "Same side always faces Earth", "Apollo 11 first landing: 1969", "Diameter: 3,474 km"]
        }
    ],
    dwarfPlanets: [
        {
            name: "Pluto", 
            radius: 0.2, 
            distance: 80, 
            eccentricity: 0.2488,
            speed: 0.001,
            description: "Pluto is a dwarf planet in the Kuiper belt. Discovered in 1930, reclassified as dwarf planet in 2006. It has 5 known moons with Charon being the largest, almost half Pluto's size.",
            texture: "textures/pluto.jpg",
            color: 0x8B4513,
            facts: ["Reclassified as dwarf planet in 2006", "5 known moons", "Made of rock and ice", "New Horizons flyby: 2015"]
        }
    ],
    spacecraft: [
        {
            name: "Chandrayaan-1", 
            distance: 30, 
            speed: 0.003,
            description: "India's first lunar probe launched by ISRO in 2008. Successfully confirmed water molecules on the Moon's surface. Mission cost: ₹386 crores. Operated for 312 days instead of planned 2 years.",
            texture: "textures/spaceship.png",
            color: 0xFF6600,
            facts: ["Discovered water on Moon", "Launched: October 22, 2008", "11 scientific instruments", "Lost contact in August 2009"]
        },
        {
            name: "Chandrayaan-2", 
            distance: 32, 
            speed: 0.0028,
            description: "India's second lunar exploration mission launched in 2019. Consisted of orbiter, lander (Vikram), and rover (Pragyan). Orbiter continues to study Moon despite lander's hard landing.",
            texture: "textures/spaceship.png",
            color: 0xFF4500,
            facts: ["Launched: July 22, 2019", "Orbiter still operational", "Vikram lander hard landing", "Pragyan rover: 27 kg"]
        },
        {
            name: "Chandrayaan-3", 
            distance: 28, 
            speed: 0.0032,
            description: "India's third lunar mission launched in 2023. Successfully achieved soft landing near Moon's south pole, making India 4th country to land on Moon and 1st near south pole.",
            texture: "textures/spaceship.png",
            color: 0xFF8C00,
            facts: ["Launched: July 14, 2023", "Soft landing: August 23, 2023", "South pole landing", "Cost: ₹615 crores"]
        },
        {
            name: "Mangalyaan (MOM)", 
            distance: 35, 
            speed: 0.0025,
            description: "India's Mars Orbiter Mission launched in 2013. Made India first country to reach Mars orbit in first attempt and first Asian country to reach Mars. Lowest cost Mars mission ever.",
            texture: "textures/spaceship.png",
            color: 0xDC143C,
            facts: ["First Mars mission success", "Cost: ₹450 crores", "Launched: November 5, 2013", "Mission life: 8+ years"]
        },
        {
            name: "Aditya-L1", 
            distance: 45, 
            speed: 0.002,
            description: "India's first solar observation mission launched in 2023. Positioned at Lagrange Point L1 to study Sun's corona, solar wind, and space weather. Seven scientific instruments onboard.",
            texture: "textures/spaceship.png",
            color: 0xFFD700,
            facts: ["First Indian solar mission", "Launched: September 2, 2023", "Lagrange Point L1 orbit", "7 scientific payloads"]
        },
        {
            name: "Voyager 1", 
            distance: 90, 
            speed: 0.0005,
            description: "NASA's space probe launched in 1977, now in interstellar space. Most distant human-made object from Earth. Carries Golden Record with sounds and images from Earth.",
            texture: "textures/spaceship.png",
            color: 0xC0C0C0,
            facts: ["In interstellar space", "Launched: September 5, 1977", "Carries Golden Record", "24+ billion km from Earth"]
        },
        {
            name: "PSLV-C37", 
            distance: 55, 
            speed: 0.0018,
            description: "ISRO's record-breaking mission that deployed 104 satellites in single launch (February 2017). Included main satellite Cartosat-2D and 103 co-passenger satellites from various countries.",
            texture: "textures/spaceship.png",
            color: 0x4169E1,
            facts: ["104 satellites in one launch", "World record holder", "February 15, 2017", "Multiple country satellites"]
        }
    ]
};

// Initialize the entire 3D scene
function init() {
    // Create the main scene container
    scene = new THREE.Scene();
    
    // Create perspective camera (field of view, aspect ratio, near clip, far clip)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Create WebGL renderer with antialiasing for smooth edges
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000); // Set background to black
    
    // Add renderer to the container div in HTML
    document.getElementById('container').appendChild(renderer.domElement);

    // Initialize global texture loader
    textureLoader = new THREE.TextureLoader();

    // Initialize orbit controls for mouse/touch camera movement
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Smooth camera movement
    controls.dampingFactor = 0.05; // Damping intensity

    // Initialize raycaster for mouse click detection on 3D objects
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2(); // Store mouse position

    // Create all scene elements
    addStarField();        // Add background stars
    createSun();           // Create the sun
    createPlanets();       // Create all planets with orbits
    createMoons();         // Create moons
    createDwarfPlanets();  // Create dwarf planets
    createAsteroids();     // Create asteroid field
    createComets();        // Create comets
    createSpacecraft();    // Create spacecraft

    // Set and store initial camera position
    camera.position.set(initialCameraPosition.x, initialCameraPosition.y, initialCameraPosition.z);
    controls.target.set(initialCameraTarget.x, initialCameraTarget.y, initialCameraTarget.z);

    // Populate the categorized menu
    populateMenu();
    
    // Setup checklist with real-time visibility
    setupChecklist();

    // Add event listeners for user interaction
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('click', onMouseClick);

    // Start the animation loop
    animate();
    
    // Start continuous render loop for camera controls
    startRenderLoop();

    // TOOLKIT IS CLOSED BY DEFAULT
}

// Helper function to load texture with improved error handling
function loadTextureWithFallback(textureUrl, material, fallbackColor) {
    // Log texture loading attempt
    console.log(`🔄 Attempting to load texture: ${textureUrl}`);
    
    // Try to load the texture
    textureLoader.load(
        textureUrl,
        function(texture) {
            // Success: apply texture
            console.log(`✅ Successfully loaded texture: ${textureUrl}`);
            console.log(`📊 Texture dimensions: ${texture.image.width}x${texture.image.height}`);
            
            // Apply texture to material
            material.map = texture;
            
            // Ensure texture is properly displayed
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.flipY = false; // Fix texture orientation
            
            // Update material
            material.needsUpdate = true;
            
            // For debugging - log material state
            console.log(`🎨 Material updated for texture: ${textureUrl}`);
        },
        function(progress) {
            // Progress callback
            if (progress.lengthComputable) {
                const percentComplete = progress.loaded / progress.total * 100;
                console.log(`📊 Loading progress for ${textureUrl}: ${percentComplete.toFixed(2)}%`);
            }
        },
        function(error) {
            // Error: use fallback color
            console.error(`❌ Failed to load texture: ${textureUrl}`, error);
            console.log(`🎨 Using fallback color for texture: #${fallbackColor.toString(16)}`);
            material.color.setHex(fallbackColor);
            material.needsUpdate = true;
        }
    );
}

// Create a field of stars as background
function addStarField() {
    // Create geometry to hold star positions
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 10000; // Number of stars
    const positions = new Float32Array(starCount * 3); // 3 coordinates per star

    // Generate random positions for each star
    for (let i = 0; i < starCount * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 2000; // Spread stars across large area
    }

    // Set positions in geometry
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Create material for stars (white points)
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
    
    // Create star field and add to scene
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}

// Create the Sun with texture and lighting - IMPROVED LIGHTING
function createSun() {
    // Create sphere geometry for the sun
    const geometry = new THREE.SphereGeometry(solarSystemData.sun.radius, 32, 32);
    
    // Use MeshBasicMaterial for sun (self-emitting light)
    const material = new THREE.MeshBasicMaterial({ 
        color: 0xffffff // Start with white for texture
    });

    // Create sun mesh and store data
    sun = new THREE.Mesh(geometry, material);
    sun.userData = solarSystemData.sun;
    scene.add(sun);

    // Load sun texture with fallback
    loadTextureWithFallback(solarSystemData.sun.texture, material, solarSystemData.sun.color);

    // Add MULTIPLE LIGHTS for better illumination
    
    // Main sun light (bright)
    const sunLight = new THREE.PointLight(0xffffff, 3, 1000);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // Ambient light (increased intensity for better texture visibility)
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8); // Increased from 0.3 to 0.8
    scene.add(ambientLight);

    // Directional light for even lighting
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);

    // Add hemispheric light for better overall illumination
    const hemiLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.4);
    scene.add(hemiLight);

    // Add label for the sun
    addLabel(sun, "Sun");
}

// Create all planets with realistic elliptical orbits - IMPROVED MATERIALS
function createPlanets() {
    solarSystemData.planets.forEach(planetData => {
        // Create sphere geometry for planet
        const geometry = new THREE.SphereGeometry(planetData.radius, 32, 32);
        
        // Create material with better lighting response - LAMBERT for softer lighting
        const material = new THREE.MeshLambertMaterial({ 
            color: 0xffffff // Start with white to show texture properly
        });

        // Create planet mesh and store orbital data
        const planet = new THREE.Mesh(geometry, material);
        planet.userData = planetData;
        planet.userData.angle = Math.random() * Math.PI * 2; // Random starting position
        planets.push(planet);
        scene.add(planet);

        // Load planet texture with fallback color
        loadTextureWithFallback(planetData.texture, material, planetData.color);

        // Create elliptical orbit visualization
        createEllipticalOrbit(planetData);
        
        // Add label for the planet
        addLabel(planet, planetData.name);
    });
}

// Create elliptical orbit path based on real astronomical data
function createEllipticalOrbit(planetData) {
    const points = [];
    const segments = 100; // Number of points to create smooth ellipse
    
    // Calculate ellipse parameters
    const a = planetData.distance; // Semi-major axis
    const b = a * Math.sqrt(1 - planetData.eccentricity * planetData.eccentricity); // Semi-minor axis
    
    // Generate ellipse points
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const x = a * Math.cos(angle);
        const z = b * Math.sin(angle);
        points.push(new THREE.Vector3(x, 0, z));
    }

    // Create geometry from points
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
    
    // Create material with planet's color
    const orbitMaterial = new THREE.LineBasicMaterial({ 
        color: planetData.color,
        transparent: true,
        opacity: 0.4
    });
    
    // Create orbit line and add to scene
    const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
    scene.add(orbit);
}

// Create moons that orbit around their parent planets - IMPROVED MATERIALS
function createMoons() {
    solarSystemData.moons.forEach(moonData => {
        // Create sphere geometry for moon
        const geometry = new THREE.SphereGeometry(moonData.radius, 16, 16);
        
        // Create material with Lambert for better lighting
        const material = new THREE.MeshLambertMaterial({ 
            color: 0xffffff // Start with white for texture
        });
        
        // Create moon mesh and store data
        const moon = new THREE.Mesh(geometry, material);
        moon.userData = moonData;
        moon.userData.angle = 0; // Start at angle 0
        moons.push(moon);
        scene.add(moon);

        // Load moon texture with fallback
        loadTextureWithFallback(moonData.texture, material, moonData.color);
        
        // Add label for the moon
        addLabel(moon, moonData.name);
    });
}

// Create dwarf planets - IMPROVED MATERIALS
function createDwarfPlanets() {
    solarSystemData.dwarfPlanets.forEach(planetData => {
        // Create sphere geometry
        const geometry = new THREE.SphereGeometry(planetData.radius, 16, 16);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0xffffff // Start with white for texture
        });
        
        // Create mesh and add orbital properties
        const planet = new THREE.Mesh(geometry, material);
        planet.userData = planetData;
        planet.userData.angle = Math.random() * Math.PI * 2;
        planets.push(planet); // Add to planets array
        scene.add(planet);

        // Load texture with fallback
        loadTextureWithFallback(planetData.texture, material, planetData.color);
        
        // Create elliptical orbit
        createEllipticalOrbit(planetData);
        
        // Add label
        addLabel(planet, planetData.name);
    });
}

// Create random asteroids scattered throughout the solar system - IMPROVED MATERIALS
function createAsteroids() {
    for (let i = 0; i < 50; i++) {
        // Create irregular asteroid shape
        const geometry = new THREE.SphereGeometry(0.05 + Math.random() * 0.1, 8, 8);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0xffffff // Start with white for texture
        });
        
        // Create asteroid mesh
        const asteroid = new THREE.Mesh(geometry, material);
        
        // Position randomly in space
        asteroid.position.set(
            (Math.random() - 0.5) * 200,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 200
        );
        
        // Store asteroid data
        asteroid.userData = {
            name: `Asteroid ${i + 1}`,
            description: "A rocky body orbiting the Sun. Most asteroids are found in the asteroid belt between Mars and Jupiter.",
            visible: true,
            facts: ["Rocky composition", "Irregular shape", "No atmosphere", "Size varies greatly"]
        };
        
        asteroids.push(asteroid);
        scene.add(asteroid);

        // Load moon texture for asteroids (as requested)
        loadTextureWithFallback("textures/moon.jpg", material, 0x444444);
        
        // Add label (smaller for asteroids)
        addLabel(asteroid, `A${i + 1}`, true);
    }
}

// Create comets with elliptical orbits - IMPROVED MATERIALS
function createComets() {
    for (let i = 0; i < 5; i++) {
        // Create comet nucleus
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0xffffff // Start with white for texture
        });
        
        // Create comet mesh
        const comet = new THREE.Mesh(geometry, material);
        
        // Store comet orbital data
        comet.userData = {
            name: `Comet ${i + 1}`,
            description: "An icy body that develops a tail when approaching the Sun. Made of dust, rock, and frozen gases like water, carbon dioxide, and methane.",
            distance: 100 + i * 20,
            eccentricity: 0.5 + Math.random() * 0.3, // Highly elliptical
            speed: 0.001,
            angle: Math.random() * Math.PI * 2,
            visible: true,
            facts: ["Develop tails near Sun", "Made of ice and rock", "Highly elliptical orbits", "Some visible to naked eye"]
        };
        
        comets.push(comet);
        scene.add(comet);

        // Load moon texture for comets too
        loadTextureWithFallback("textures/moon.jpg", material, 0x87CEEB);
        
        // Add label
        addLabel(comet, `C${i + 1}`, true);
    }
}

// Create spacecraft models - IMPROVED MATERIALS
function createSpacecraft() {
    solarSystemData.spacecraft.forEach((craftData, index) => {
        // Create simple box geometry for spacecraft
        const geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4); // Make larger for visibility
        const material = new THREE.MeshLambertMaterial({ 
            color: 0xffffff // Start with white for texture
        });
        
        // Create spacecraft mesh
        const craft = new THREE.Mesh(geometry, material);
        craft.userData = craftData;
        craft.userData.angle = 0;
        craft.userData.visible = true;
        spacecraft.push(craft);
        scene.add(craft);

        // Load spaceship texture/icon for spacecraft
        loadTextureWithFallback(craftData.texture, material, craftData.color);
        
        // Add label
        addLabel(craft, craftData.name);
    });
}

// Start continuous render loop for camera controls (FIXES PAUSE CONTROLS ISSUE)
function startRenderLoop() {
    function renderContinuous() {
        // Always update controls and render, regardless of pause state
        controls.update();
        updateLabels(); // Keep labels updated
        renderer.render(scene, camera);
        
        // Continue render loop
        renderLoop = requestAnimationFrame(renderContinuous);
    }
    renderContinuous();
}

// Add text label below 3D objects
function addLabel(object, text, isSmall = false) {
    // Create label div element
    const label = document.createElement('div');
    label.className = 'object-label';
    label.textContent = text;
    
    // Make smaller labels for asteroids/comets
    if (isSmall) {
        label.style.fontSize = '8px';
        label.style.padding = '1px 4px';
    }
    
    // Add to document
    document.body.appendChild(label);
    
    // Store label reference with object
    object.userData.label = label;
    labels.push({ object, label });
}

// Update label positions to follow their 3D objects
function updateLabels() {
    labels.forEach(({ object, label }) => {
        // Skip if object is not visible
        if (!object.visible) {
            label.style.display = 'none';
            return;
        }
        
        label.style.display = 'block';
        
        // Convert 3D position to 2D screen coordinates
        const vector = new THREE.Vector3();
        object.getWorldPosition(vector);
        vector.project(camera);
        
        // Convert to pixel coordinates
        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (vector.y * -0.5 + 0.5) * window.innerHeight;
        
        // Position label below object
        label.style.left = (x - label.offsetWidth / 2) + 'px';
        label.style.top = (y + 20) + 'px';
        
        // Hide labels that are behind other objects or too far
        label.style.opacity = vector.z < 1 ? 1 : 0;
    });
}

// Populate the categorized menu with all objects
function populateMenu() {
    // Get category containers
    const planetsList = document.getElementById('planetsList');
    const moonsList = document.getElementById('moonsList');
    const spacecraftList = document.getElementById('spacecraftList');
    const othersList = document.getElementById('othersList');

    // Add Sun to planets list
    const sunItem = createMenuItem(solarSystemData.sun);
    planetsList.appendChild(sunItem);

    // Add planets to planets list
    solarSystemData.planets.forEach(planet => {
        const item = createMenuItem(planet);
        planetsList.appendChild(item);
    });
    
    // Add dwarf planets to planets list
    solarSystemData.dwarfPlanets.forEach(planet => {
        const item = createMenuItem(planet);
        planetsList.appendChild(item);
    });

    // Add moons to moons list
    solarSystemData.moons.forEach(moon => {
        const item = createMenuItem(moon);
        moonsList.appendChild(item);
    });

    // Add spacecraft to spacecraft list
    solarSystemData.spacecraft.forEach(craft => {
        const item = createMenuItem(craft);
        spacecraftList.appendChild(item);
    });

    // Add asteroids to others list
    for (let i = 0; i < 5; i++) {
        const item = createMenuItem({
            name: `Asteroid ${i + 1}`,
            description: "A rocky body orbiting the Sun. Most asteroids are found in the asteroid belt between Mars and Jupiter."
        });
        othersList.appendChild(item);
    }

    // Add comets to others list
    for (let i = 0; i < 5; i++) {
        const item = createMenuItem({
            name: `Comet ${i + 1}`,
            description: "An icy body that develops a tail when approaching the Sun. Made of dust, rock, and frozen gases."
        });
        othersList.appendChild(item);
    }
}

// Create individual menu item element
function createMenuItem(data) {
    const item = document.createElement('div');
    item.className = 'menu-item';
    item.textContent = data.name;
    
    // Add click event to show info, focus on object, and pause animation
    item.onclick = () => {
        // Pause animation when selecting object
        pauseAnimation();
        
        // Show object info and focus camera
        showObjectInfo(data);
        focusOnObject(data.name);
        
        // Show the reset/home button in info panel
        showResetButton();
    };
    
    return item;
}

// IMPROVED FOCUS FUNCTION - Better zoom and positioning
function focusOnObject(objectName) {
    let targetObject = null;
    
    // Find the object by name
    if (objectName === "Sun") {
        targetObject = sun;
    } else {
        // Search in all object arrays
        targetObject = [...planets, ...moons, ...asteroids, ...comets, ...spacecraft]
            .find(obj => obj.userData.name === objectName);
    }
    
    // Move camera to focus on object with proper zoom
    if (targetObject) {
        const position = targetObject.position.clone();
        
        // Calculate appropriate distance based on object size
        let distance;
        if (targetObject.userData.radius) {
            // For objects with defined radius
            distance = Math.max(targetObject.userData.radius * 8, 5);
        } else {
            // For smaller objects like asteroids/comets/spacecraft
            distance = 3;
        }
        
        // Special cases for very large objects
        if (objectName === "Sun") {
            distance = 25;
        } else if (objectName === "Jupiter" || objectName === "Saturn") {
            distance = 15;
        }
        
        // Set camera target and position for optimal viewing
        controls.target.copy(position);
        
        // Position camera at an angle for better 3D view
        const angle = Math.PI / 4; // 45 degrees
        camera.position.set(
            position.x + distance * Math.cos(angle),
            position.y + distance * 0.5,
            position.z + distance * Math.sin(angle)
        );
        
        // Update controls smoothly
        controls.update();
        
        console.log(`🎯 Focused on ${objectName} at distance ${distance}`);
    }
}

// Show reset button in info panel
function showResetButton() {
    const infoContent = document.getElementById('infoContent');
    
    // Check if reset button already exists
    let resetBtn = document.getElementById('resetViewBtn');
    if (!resetBtn) {
        resetBtn = document.createElement('button');
        resetBtn.id = 'resetViewBtn';
        resetBtn.className = 'reset-btn';
        resetBtn.innerHTML = '🏠 Back to Solar System View';
        resetBtn.onclick = resetToInitialView;
        
        // Add to info panel
        infoContent.appendChild(resetBtn);
    }
}

// Reset camera to initial position and resume animation
function resetToInitialView() {
    // Resume animation
    resumeAnimation();
    
    // Reset camera to initial position
    camera.position.set(initialCameraPosition.x, initialCameraPosition.y, initialCameraPosition.z);
    controls.target.set(initialCameraTarget.x, initialCameraTarget.y, initialCameraTarget.z);
    controls.update();
    
    // Hide info panel
    hideInfo();
    
    console.log("🏠 Reset to initial solar system view");
}

// Setup checklist with real-time visibility controls
function setupChecklist() {
    const checklistItems = document.getElementById('checklistItems');
    
    // Wait for objects to be created
    setTimeout(() => {
        // List of all objects with their references
        const allObjects = [
            { name: 'Sun', objects: [sun] },
            { name: 'Mercury', objects: planets.filter(p => p.userData.name === 'Mercury') },
            { name: 'Venus', objects: planets.filter(p => p.userData.name === 'Venus') },
            { name: 'Earth', objects: planets.filter(p => p.userData.name === 'Earth') },
            { name: 'Mars', objects: planets.filter(p => p.userData.name === 'Mars') },
            { name: 'Jupiter', objects: planets.filter(p => p.userData.name === 'Jupiter') },
            { name: 'Saturn', objects: planets.filter(p => p.userData.name === 'Saturn') },
            { name: 'Uranus', objects: planets.filter(p => p.userData.name === 'Uranus') },
            { name: 'Neptune', objects: planets.filter(p => p.userData.name === 'Neptune') },
            { name: 'Moon', objects: moons },
            { name: 'Pluto', objects: planets.filter(p => p.userData.name === 'Pluto') },
            { name: 'Indian Spacecraft', objects: spacecraft.filter(s => s.userData.name.includes('Chandrayaan') || s.userData.name.includes('Mangalyaan') || s.userData.name.includes('Aditya') || s.userData.name.includes('PSLV')) },
            { name: 'Other Spacecraft', objects: spacecraft.filter(s => !s.userData.name.includes('Chandrayaan') && !s.userData.name.includes('Mangalyaan') && !s.userData.name.includes('Aditya') && !s.userData.name.includes('PSLV')) },
            { name: 'Asteroids', objects: asteroids },
            { name: 'Comets', objects: comets }
        ];

        // Create checklist items
        allObjects.forEach(group => {
            const item = document.createElement('div');
            item.className = 'checklist-item';
            
            // Create checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `check_${group.name}`;
            checkbox.checked = true; // All objects visible by default
            
            // Create label
            const label = document.createElement('label');
            label.setAttribute('for', checkbox.id);
            label.textContent = group.name;
            
            // Add change event for real-time visibility
            checkbox.addEventListener('change', () => {
                const isVisible = checkbox.checked;
                
                // Toggle visibility for all objects in this group
                group.objects.forEach(obj => {
                    if (obj) {
                        obj.visible = isVisible;
                        // Update userData for tracking
                        if (obj.userData) {
                            obj.userData.visible = isVisible;
                        }
                    }
                });
            });
            
            // Add elements to item
            item.appendChild(checkbox);
            item.appendChild(label);
            checklistItems.appendChild(item);
        });
    }, 1000); // Wait 1 second for objects to be created
}

// Pause animation function (IMPROVED - doesn't stop controls)
function pauseAnimation() {
    isPaused = true;
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    console.log("🛑 Animation paused (controls still active)");
    
    // Update pause button text
    updatePauseButtonText();
}

// Resume animation function
function resumeAnimation() {
    if (isPaused) {
        isPaused = false;
        animate(); // Restart animation loop
        console.log("▶️ Animation resumed");
        
        // Update pause button text
        updatePauseButtonText();
    }
}

// Toggle pause/resume animation
function togglePause() {
    if (isPaused) {
        resumeAnimation();
    } else {
        pauseAnimation();
    }
}

// Update pause button text based on state
function updatePauseButtonText() {
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) {
        pauseBtn.textContent = isPaused ? '▶️ Resume' : '⏸️ Pause';
    }
}

// Main animation loop - runs every frame (when not paused) - SEPARATE FROM RENDER LOOP
function animate() {
    // Only continue animation if not paused
    if (!isPaused) {
        // Request next animation frame and store ID for cancellation
        animationId = requestAnimationFrame(animate);
    }

    // Only update positions when not paused
    if (!isPaused) {
        // Rotate sun around its axis
        if (sun) {
            sun.rotation.y += 0.005;
        }

        // Update planet positions in elliptical orbits
        planets.forEach(planet => {
            if (planet.userData.distance && planet.userData.speed) {
                // Calculate elliptical position
                planet.userData.angle += planet.userData.speed;
                
                const a = planet.userData.distance; // Semi-major axis
                const e = planet.userData.eccentricity || 0; // Eccentricity
                const angle = planet.userData.angle;
                
                // Calculate distance from focus (sun) using ellipse equation
                const r = a * (1 - e * e) / (1 + e * Math.cos(angle));
                
                // Set position
                planet.position.x = r * Math.cos(angle);
                planet.position.z = r * Math.sin(angle);
                
                // Rotate planet around its axis
                planet.rotation.y += 0.01;
            }
        });

        // Update moon positions relative to their parent planets
        moons.forEach(moon => {
            const parentPlanet = planets.find(p => p.userData.name === moon.userData.parent);
            if (parentPlanet) {
                // Update moon's orbital angle
                moon.userData.angle += moon.userData.speed;
                
                // Calculate elliptical position around parent
                const a = moon.userData.distance;
                const e = moon.userData.eccentricity || 0;
                const angle = moon.userData.angle;
                const r = a * (1 - e * e) / (1 + e * Math.cos(angle));
                
                // Position relative to parent planet
                moon.position.x = parentPlanet.position.x + r * Math.cos(angle);
                moon.position.z = parentPlanet.position.z + r * Math.sin(angle);
            }
        });

        // Update comet positions in highly elliptical orbits
        comets.forEach(comet => {
            comet.userData.angle += comet.userData.speed;
            
            const a = comet.userData.distance;
            const e = comet.userData.eccentricity;
            const angle = comet.userData.angle;
            const r = a * (1 - e * e) / (1 + e * Math.cos(angle));
            
            comet.position.x = r * Math.cos(angle);
            comet.position.z = r * Math.sin(angle);
            comet.rotation.y += 0.02;
        });

        // Update spacecraft positions
        spacecraft.forEach(craft => {
            craft.userData.angle += craft.userData.speed;
            craft.position.x = Math.cos(craft.userData.angle) * craft.userData.distance;
            craft.position.z = Math.sin(craft.userData.angle) * craft.userData.distance;
        });

        // Rotate asteroids for visual effect
        asteroids.forEach(asteroid => {
            asteroid.rotation.x += 0.01;
            asteroid.rotation.y += 0.01;
        });
    }
}

// UI Functions - Made global for HTML access

// Toggle main menu visibility
window.toggleMenu = function() {
    const content = document.getElementById('menuContent');
    content.classList.toggle('expanded');
}

// Toggle toolkit visibility
window.toggleToolkit = function() {
    const content = document.getElementById('toolkitContent');
    content.classList.toggle('expanded');
}

// Show info panel
window.showInfo = function() {
    const panel = document.getElementById('infoPanel');
    panel.classList.add('visible');
}

// Hide info panel
window.hideInfo = function() {
    const panel = document.getElementById('infoPanel');
    panel.classList.remove('visible');
    
    // Remove reset button if it exists
    const resetBtn = document.getElementById('resetViewBtn');
    if (resetBtn) {
        resetBtn.remove();
    }
}

// Enhanced show object information in info panel
window.showObjectInfo = function(obj) {
    const infoContent = document.getElementById('infoContent');
    
    let factsHtml = '';
    if (obj.facts && obj.facts.length > 0) {
        factsHtml = '<h4>Quick Facts:</h4><ul>';
        obj.facts.forEach(fact => {
            factsHtml += `<li>${fact}</li>`;
        });
        factsHtml += '</ul>';
    }
    
    infoContent.innerHTML = `
        <h3>${obj.name}</h3>
        <p>${obj.description}</p>
        ${factsHtml}
    `;
    showInfo();
}

// Zoom functions - COMPLETELY FIXED VERSION
window.zoomIn = function() {
    console.log("🔍+ Zooming in...");
    
    // Get direction from camera to target
    const direction = new THREE.Vector3();
    direction.subVectors(controls.target, camera.position);
    const currentDistance = direction.length();
    
    // Only zoom if not too close
    if (currentDistance > 1) {
        // Move camera 15% closer to target
        direction.normalize().multiplyScalar(currentDistance * 0.15);
        camera.position.add(direction);
        
        // Update controls
        controls.update();
        
        console.log(`📏 Distance after zoom in: ${camera.position.distanceTo(controls.target).toFixed(2)}`);
    } else {
        console.log("🚫 Already at minimum zoom distance");
    }
}

window.zoomOut = function() {
    console.log("🔍- Zooming out...");
    
    // Get direction from target to camera
    const direction = new THREE.Vector3();
    direction.subVectors(camera.position, controls.target);
    const currentDistance = direction.length();
    
    // Only zoom if not too far
    if (currentDistance < 800) {
        // Move camera 20% farther from target
        direction.normalize().multiplyScalar(currentDistance * 0.2);
        camera.position.add(direction);
        
        // Update controls
        controls.update();
        
        console.log(`📏 Distance after zoom out: ${camera.position.distanceTo(controls.target).toFixed(2)}`);
    } else {
        console.log("🚫 Already at maximum zoom distance");
    }
}

// Toggle fullscreen mode
window.toggleFullscreen = function() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

// Toggle checklist panel visibility
window.toggleChecklist = function() {
    const panel = document.getElementById('checklistPanel');
    panel.classList.toggle('visible');
}

// Make pause function global for HTML access
window.togglePause = togglePause;

// Make reset function global for HTML access
window.resetToInitialView = resetToInitialView;

// Handle mouse clicks on 3D objects
function onMouseClick(event) {
    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Cast ray from camera through mouse position
    raycaster.setFromCamera(mouse, camera);
    
    // Find intersected objects
    const allObjects = [sun, ...planets, ...moons, ...asteroids, ...comets, ...spacecraft];
    const intersects = raycaster.intersectObjects(allObjects);

    // Show info for clicked object and pause animation
    if (intersects.length > 0) {
        const object = intersects[0].object;
        if (object.userData && object.userData.name) {
            // Pause animation when clicking on object
            pauseAnimation();
            
            showObjectInfo(object.userData);
            showResetButton();
        }
    }
}

// Handle window resize
function onWindowResize() {
    // Update camera aspect ratio
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    // Update renderer size
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Initialize the application when page loads
init();
