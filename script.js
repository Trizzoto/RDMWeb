// Global variables and parameters
const modelContainer = document.getElementById('model-container');
let scene, camera, renderer, model, controls;

// Consolidated parameters
const params = {
    texture: {
        rotation: 27,
        scaleX: 200,
        scaleY: 200,
        offsetX: 34,
        offsetY: -96,
        centerX: 1.4,
        centerY: 1.4,
        stretchX: 0.7,
        stretchY: 1.0,
        skewX: 0,
        skewY: -5,
        opacity: 1.0,
        normalThreshold: -0.8
    },
    camera: {
        posX: 376.34,
        posY: 78.18,
        posZ: -319.78,
        targetX: 0,
        targetY: 0,
        targetZ: 0,
        fov: 25
    },
    model: {
        rotationX: 57 * Math.PI / 180,
        rotationY: -43 * Math.PI / 180,
        rotationZ: -169 * Math.PI / 180
    }
};

// Utility function for loading overlay
function handleLoadingOverlay(action) {
    const loadingOverlay = document.querySelector('.loading-overlay');
    if (!loadingOverlay) return;

    if (action === 'remove') {
        loadingOverlay.classList.add('fade-out');
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
        }, 500);
    } else if (action === 'hide') {
        loadingOverlay.style.display = 'none';
    }
}

// Mobile device handling
function setupMobileControls(controls, camera) {
    controls.minPolarAngle = Math.PI / 2.2;
    controls.maxPolarAngle = Math.PI / 2.2;
    controls.enableZoom = false;

    if (window.innerWidth <= 768) {
        const widthRatio = window.innerWidth / 768;
        camera.position.z *= (1 + (1 - widthRatio));
        camera.updateProjectionMatrix();

        // Setup pinch zoom if Hammer.js is available
        if (typeof Hammer !== 'undefined') {
            const mc = new Hammer(renderer.domElement);
            mc.get('pinch').set({ enable: true });
            
            let initialScale;
            
            mc.on('pinchstart', (e) => {
                initialScale = camera.position.z;
                if (controls) controls.enabled = false;
            });
            
            mc.on('pinchend', (e) => {
                if (controls) controls.enabled = true;
            });

            mc.on('pinch', (e) => {
                const minZoom = camera.position.z / 2;
                const maxZoom = camera.position.z * 2;
                let newZ = initialScale / e.scale;
                newZ = Math.max(minZoom, Math.min(maxZoom, newZ));
                camera.position.z = newZ;
                camera.updateProjectionMatrix();
            });
        }
    }
}

function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcdcdcd);

    // Camera setup
    camera = new THREE.PerspectiveCamera(
        params.camera.fov,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(params.camera.posX, params.camera.posY, params.camera.posZ);
    camera.lookAt(params.camera.targetX, params.camera.targetY, params.camera.targetZ);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    while (modelContainer.firstChild) {
        modelContainer.removeChild(modelContainer.firstChild);
    }
    modelContainer.appendChild(renderer.domElement);

    // Controls setup
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 100;
    controls.maxDistance = 500;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.2;

    // Handle mobile/desktop settings
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
        setupMobileControls(controls, camera);
    } else {
        controls.minPolarAngle = Math.PI / 3;
        controls.maxPolarAngle = Math.PI / 2.2;
        controls.enableZoom = true;
    }

    setupLighting();
    loadModelAndTexture();
    animate();
}

function setupLighting() {
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    
    const lights = [
        { type: 'front', position: [0, 0, 300], intensity: 1.2 },
        { type: 'top', position: [0, 300, 0], intensity: 1.0 },
        { type: 'bottom', position: [0, -300, 0], intensity: 1.0 },
        { type: 'back', position: [0, 0, -300], intensity: 1.0 },
        { type: 'backLeft', position: [-200, 0, -200], intensity: 0.8 },
        { type: 'backRight', position: [200, 0, -200], intensity: 0.8 }
    ];

    lights.forEach(light => {
        const directionalLight = new THREE.DirectionalLight(0xffffff, light.intensity);
        directionalLight.position.set(...light.position);
        if (light.type !== 'front' && light.type !== 'backLeft' && light.type !== 'backRight') {
            directionalLight.lookAt(0, 0, 0);
        }
        scene.add(directionalLight);
    });
}

function createModel(geometry, texture) {
    geometry.computeVertexNormals();
    const positionAttribute = geometry.getAttribute('position');
    const normalAttribute = geometry.getAttribute('normal');
    
    // Calculate face dimensions for proper scaling
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    for (let i = 0; i < positionAttribute.count; i += 3) {
        const normal = new THREE.Vector3(
            normalAttribute.getX(i),
            normalAttribute.getY(i),
            normalAttribute.getZ(i)
        );
        
        if (normal.z < params.texture.normalThreshold) {
            for (let j = 0; j < 3; j++) {
                const x = positionAttribute.getX(i + j);
                const y = positionAttribute.getY(i + j);
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }
        }
    }
    
    const faceWidth = maxX - minX;
    const faceHeight = maxY - minY;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    const uvs = new Float32Array(positionAttribute.count * 2);
    
    for (let i = 0; i < positionAttribute.count; i += 3) {
        const normal = new THREE.Vector3(
            normalAttribute.getX(i),
            normalAttribute.getY(i),
            normalAttribute.getZ(i)
        );
        
        if (normal.z < params.texture.normalThreshold) {
            for (let j = 0; j < 3; j++) {
                const x = positionAttribute.getX(i + j);
                const y = positionAttribute.getY(i + j);
                
                let u = (x - centerX) / (faceWidth / 2);
                let v = (y - centerY) / (faceHeight / 2);
                
                u *= params.texture.scaleX / 100;
                v *= params.texture.scaleY / 100;
                
                const skewX = params.texture.skewX / 25;
                const skewY = params.texture.skewY / 25;
                const oldU = u;
                u += v * skewX;
                v += oldU * skewY;
                
                u += params.texture.offsetX / 100;
                v += params.texture.offsetY / 100;
                
                u = (u + 1) / 2;
                v = (v + 1) / 2;
                
                uvs[(i + j) * 2] = u;
                uvs[(i + j) * 2 + 1] = v;
            }
        }
    }
    
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.attributes.uv.needsUpdate = true;
    
    const material = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        map: texture,
        transparent: params.texture.opacity < 1.0,
        opacity: params.texture.opacity,
        emissive: 0x000000,
        reflectivity: 0,
        alphaTest: 0.1,           // Helps with texture edges
    });
    
    // Improve geometry quality
    geometry.computeTangents();
    geometry.attributes.position.setUsage(THREE.StaticDrawUsage);
    geometry.attributes.normal.setUsage(THREE.StaticDrawUsage);
    geometry.attributes.uv.setUsage(THREE.StaticDrawUsage);
    
    model = new THREE.Mesh(geometry, material);
    
    // Center the geometry itself first
    geometry.center();
    
    // Calculate bounding box for scaling
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 200 / maxDim; // Scale to reasonable size
    model.scale.multiplyScalar(scale);
    
    // Set initial rotation using modelParams
    model.rotation.set(
        params.model.rotationX,
        params.model.rotationY,
        params.model.rotationZ
    );
    
    scene.add(model);
    
    // Set camera to initial position
    camera.position.set(params.camera.posX, params.camera.posY, params.camera.posZ);
    camera.lookAt(params.camera.targetX, params.camera.targetY, params.camera.targetZ);
    
    // Update controls target and refresh
    controls.target.set(params.camera.targetX, params.camera.targetY, params.camera.targetZ);
    controls.update();
    
    // Remove loading overlay
    handleLoadingOverlay('remove');
}

function animate() {
    requestAnimationFrame(animate);
    if (renderer && scene && camera) {
        controls.update(); // Required for auto-rotation
        renderer.render(scene, camera);
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    init();
    initCarousel();
    observeFeatures();
    initSmoothScroll();
    initPageTransitions();
    initCompatibilityChecker();

    // Handle loading overlay
    if (!modelContainer) {
        handleLoadingOverlay('hide');
    } else {
        window.addEventListener('load', () => handleLoadingOverlay('remove'));
    }

    // Hamburger menu
    const hamburger = document.querySelector('.hamburger-menu');
    const nav = document.querySelector('nav');
    
    if (hamburger && nav) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            nav.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!nav.contains(e.target) && !hamburger.contains(e.target) && nav.classList.contains('active')) {
                hamburger.classList.remove('active');
                nav.classList.remove('active');
            }
        });
    }
});

// Header scroll behavior
let lastScrollTop = 0;
const header = document.querySelector('header');
const scrollThreshold = 50; // minimum scroll amount before hiding/showing header

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    
    // Determine scroll direction and distance
    if (Math.abs(lastScrollTop - currentScroll) <= scrollThreshold) return;
    
    // Scrolling down & past the threshold
    if (currentScroll > lastScrollTop && currentScroll > header.offsetHeight) {
        header.classList.add('header-hidden');
    } 
    // Scrolling up
    else {
        header.classList.remove('header-hidden');
    }
    
    lastScrollTop = currentScroll;
});

// Scroll animations for Why Choose RDM section
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.3
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
        }
    });
}, observerOptions);

// Observe title and features when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Observe the title
    const title = document.querySelector('.why-choose h2');
    observer.observe(title);

    // Observe each feature
    const features = document.querySelectorAll('.feature');
    features.forEach(feature => {
        observer.observe(feature);
    });
});

// Product gallery functionality
document.addEventListener('DOMContentLoaded', () => {
    const mainImage = document.getElementById('main-product-image');
    const thumbnails = document.querySelectorAll('.thumbnail');

    if (mainImage && thumbnails.length > 0) {
        thumbnails.forEach(thumbnail => {
            thumbnail.addEventListener('click', () => {
                // Update main image
                mainImage.src = thumbnail.src;
                mainImage.alt = thumbnail.alt;

                // Update active state
                thumbnails.forEach(thumb => thumb.classList.remove('active'));
                thumbnail.classList.add('active');
            });
        });
    }

    // Product options price update
    const gpsSelect = document.getElementById('gps');
    const mountingSelect = document.getElementById('mounting');
    const priceElement = document.querySelector('.price');
    const afterpayAmount = document.querySelector('.afterpay');

    if (gpsSelect && mountingSelect && priceElement && afterpayAmount) {
        const basePrice = 699.00;

        function updatePrice() {
            let totalPrice = basePrice;
            
            if (gpsSelect.value === 'yes') totalPrice += 49.00;
            if (mountingSelect.value === 'yes') totalPrice += 29.00;

            priceElement.textContent = `$${totalPrice.toFixed(2)} AUD`;
            const installment = (totalPrice / 4).toFixed(2);
            afterpayAmount.textContent = `or 4 payments of $${installment} with `;
        }

        gpsSelect.addEventListener('change', updatePrice);
        mountingSelect.addEventListener('change', updatePrice);
    }
});

// Intersection Observer for feature animations
const observeFeatures = () => {
    const features = document.querySelectorAll('.feature');
    const options = {
        threshold: 0.2,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, options);

    features.forEach(feature => observer.observe(feature));
};

// Smooth scroll for navigation links
const initSmoothScroll = () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
};

// Page transition effects
const initPageTransitions = () => {
    window.addEventListener('pageshow', () => {
        document.body.classList.remove('is-exiting');
    });

    document.querySelectorAll('a:not([href^="#"])').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const target = e.currentTarget.href;
            document.body.classList.add('is-exiting');
            setTimeout(() => {
                window.location = target;
            }, 500);
        });
    });
};

// Compatibility checker functionality
const initCompatibilityChecker = () => {
    const makeSelect = document.getElementById('make');
    const yearSelect = document.getElementById('year');
    const modelSelect = document.getElementById('model');
    const checkBtn = document.querySelector('.check-btn');

    if (!makeSelect) return; // Only run on compatibility page

    // Populate years (2008 to current year)
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 2008; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }

    // Vehicle models by make
    const vehicleModels = {
        toyota: ['Supra', 'GR86', 'GR Corolla', 'Camry', 'Corolla'],
        honda: ['Civic Type R', 'NSX', 'S2000', 'Accord', 'Civic'],
        ford: ['Mustang', 'Focus RS', 'GT', 'Focus ST', 'Fiesta ST'],
        chevrolet: ['Corvette', 'Camaro', 'SS', 'Spark'],
        bmw: ['M2', 'M3', 'M4', 'M5', 'M8'],
        mercedes: ['AMG GT', 'C63 AMG', 'E63 AMG', 'A45 AMG']
    };

    // Update models when make changes
    makeSelect.addEventListener('change', () => {
        const make = makeSelect.value;
        modelSelect.innerHTML = '<option value="">Select Model</option>';
        modelSelect.disabled = !make;

        if (make && vehicleModels[make]) {
            vehicleModels[make].forEach(model => {
                const option = document.createElement('option');
                option.value = model.toLowerCase().replace(/\s+/g, '-');
                option.textContent = model;
                modelSelect.appendChild(option);
            });
        }
    });

    // Check compatibility
    checkBtn.addEventListener('click', () => {
        const make = makeSelect.value;
        const year = yearSelect.value;
        const model = modelSelect.value;

        if (!make || !year || !model) {
            alert('Please select all fields');
            return;
        }

        // Simple compatibility check
        const yearNum = parseInt(year);
        let message = '';

        if (yearNum >= 2015) {
            message = 'Your vehicle is fully compatible with RDM-7 DASH!';
        } else if (yearNum >= 2008) {
            message = 'Your vehicle is compatible with basic features. Some advanced features may not be available.';
        } else {
            message = 'Your vehicle may not be fully compatible. Please contact support for more information.';
        }

        // Show result with animation
        const result = document.createElement('div');
        result.className = 'compatibility-result';
        result.textContent = message;
        
        const existingResult = document.querySelector('.compatibility-result');
        if (existingResult) {
            existingResult.remove();
        }

        result.style.opacity = '0';
        result.style.transform = 'translateY(20px)';
        document.querySelector('.checker-form').appendChild(result);

        // Trigger animation
        setTimeout(() => {
            result.style.opacity = '1';
            result.style.transform = 'translateY(0)';
        }, 10);
    });
};

// Launch Control Indicator functionality
document.addEventListener('DOMContentLoaded', () => {
    const launchIndicator = document.querySelector('.launch-indicator');
    if (launchIndicator) {
        setInterval(() => {
            launchIndicator.classList.toggle('active');
        }, 2000);
    }
});

// Coolant value animation
document.addEventListener('DOMContentLoaded', () => {
    const coolantValue = document.querySelector('.coolant-value');
    const coolantBorder = document.querySelector('.coolant-border');
    const progressFill = document.querySelector('.progress-fill');
    
    if (coolantValue && coolantBorder && progressFill) {
        function animateCoolant() {
            let startValue = 20;
            let endValue = 105;
            let duration = 5000; // 5 seconds
            let holdDuration = 500; // 0.5 seconds
            
            function easeInOutCubic(t) {
                return t < 0.5
                    ? 4 * t * t * t
                    : 1 - Math.pow(-2 * t + 2, 3) / 2;
            }

            function updateValue(start, end, progress) {
                const value = Math.round(start + (end - start) * easeInOutCubic(progress));
                coolantValue.textContent = value;
                
                // Update border color based on value
                if (value < 45) {
                    coolantBorder.style.borderColor = '#0066ff'; // Blue
                } else if (value > 90) {
                    coolantBorder.style.borderColor = '#ff0000'; // Red
                } else {
                    coolantBorder.style.borderColor = '#444444'; // Gray
                }

                // Update progress bar
                const progressPercent = ((value - 20) / (105 - 20)) * 100;
                progressFill.style.width = `${progressPercent}%`;

                // Update progress bar color based on percentage
                if (progressPercent < 30) {
                    progressFill.style.backgroundColor = '#0066ff'; // Blue
                } else if (progressPercent > 70) {
                    progressFill.style.backgroundColor = '#ff0000'; // Red
                } else {
                    progressFill.style.backgroundColor = '#00ff00'; // Green
                }
            }

            function animate() {
                // Animate up
                let startTime = Date.now();
                function upAnimation() {
                    let elapsed = Date.now() - startTime;
                    let progress = Math.min(elapsed / duration, 1);
                    
                    updateValue(startValue, endValue, progress);
                    
                    if (progress < 1) {
                        requestAnimationFrame(upAnimation);
                    } else {
                        // Hold at max value
                        setTimeout(() => {
                            // Animate down
                            startTime = Date.now();
                            function downAnimation() {
                                let elapsed = Date.now() - startTime;
                                let progress = Math.min(elapsed / duration, 1);
                                
                                updateValue(endValue, startValue, progress);
                                
                                if (progress < 1) {
                                    requestAnimationFrame(downAnimation);
                                } else {
                                    setTimeout(animate, 0); // Restart animation
                                }
                            }
                            requestAnimationFrame(downAnimation);
                        }, holdDuration);
                    }
                }
                requestAnimationFrame(upAnimation);
            }
            
            // Initialize progress bar
            progressFill.style.width = '0%';
            progressFill.style.backgroundColor = '#0066ff';
            
            animate();
        }
        
        animateCoolant();
    }
});

// Carousel functionality
const initCarousel = () => {
    const slides = document.querySelectorAll('.carousel-slide');
    const prevBtn = document.querySelector('.carousel-arrow.prev');
    const nextBtn = document.querySelector('.carousel-arrow.next');
    let currentSlide = 0;
    const totalSlides = slides.length;
    let isTransitioning = false;

    // Initialize slides
    function initializeSlides() {
        slides.forEach((slide, index) => {
            if (index === 0) {
                slide.classList.add('active');
                slide.style.transform = 'translateX(0)';
                slide.style.visibility = 'visible';
            } else {
                slide.style.transform = 'translateX(100%)';
                slide.style.visibility = 'hidden';
            }
        });
    }

    function updateSlides(direction) {
        if (isTransitioning) return;
        isTransitioning = true;

        const nextIndex = (direction === 'next') 
            ? (currentSlide + 1) % totalSlides 
            : (currentSlide - 1 + totalSlides) % totalSlides;

        // Position slides for transition
        slides.forEach((slide, index) => {
            // Reset all slides first
            slide.style.visibility = 'hidden';
            slide.classList.remove('active', 'prev', 'next');

            if (index === currentSlide) {
                // Current slide moves out
                slide.style.visibility = 'visible';
                slide.style.transform = direction === 'next' ? 'translateX(-100%)' : 'translateX(100%)';
            } else if (index === nextIndex) {
                // Next slide moves in
                slide.style.visibility = 'visible';
                slide.classList.add('active');
                slide.style.transform = 'translateX(0)';
                
                // Enable 3D controls if it's the model
                if (slide.id === 'model-container' && controls) {
                    controls.enabled = true;
                }
            } else {
                // Hide other slides
                slide.style.transform = direction === 'next' ? 'translateX(100%)' : 'translateX(-100%)';
                
                // Disable 3D controls if it's the model
                if (slide.id === 'model-container' && controls) {
                    controls.enabled = false;
                }
            }
        });

        // Update current slide after transition
        setTimeout(() => {
            currentSlide = nextIndex;
            isTransitioning = false;
            
            // Hide all non-active slides after transition
            slides.forEach((slide, index) => {
                if (index !== currentSlide) {
                    slide.style.visibility = 'hidden';
                }
            });
        }, 500);
    }

    function nextSlide() {
        updateSlides('next');
    }

    function prevSlide() {
        updateSlides('prev');
    }

    // Event listeners for navigation arrows
    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', prevSlide);
        nextBtn.addEventListener('click', nextSlide);
    }

    // Add keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            prevSlide();
        } else if (e.key === 'ArrowRight') {
            nextSlide();
        }
    });

    // Adjust 3D model size for mobile - using 1.5x instead of 2x
    if (window.innerWidth <= 768) {  // Mobile breakpoint
        camera.position.z *= 1.5;  // Move camera back to zoom out (halfway between original and previous adjustment)
        // OR if using FOV adjustment:
        camera.fov = 60;  // Adjust FOV to be between original (45) and previous (75)
        camera.updateProjectionMatrix();

        // Enable pinch zoom
        const mc = new Hammer(renderer.domElement);
        mc.get('pinch').set({ enable: true });
        
        let initialScale = 1;
        
        mc.on('pinchstart', function(e) {
            initialScale = camera.position.z;
        });
        
        mc.on('pinch', function(e) {
            // Adjust these values to control zoom sensitivity
            const minZoom = camera.position.z / 2;  // Maximum zoom in
            const maxZoom = camera.position.z * 2;  // Maximum zoom out
            
            let newZ = initialScale / e.scale;
            
            // Clamp the zoom level
            newZ = Math.max(minZoom, Math.min(maxZoom, newZ));
            
            camera.position.z = newZ;
            camera.updateProjectionMatrix();
        });
    }

    // Initialize the carousel
    initializeSlides();
};