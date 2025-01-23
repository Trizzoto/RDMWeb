// Check if we're on the home page
const modelContainer = document.getElementById('model-container');

// Only initialize Three.js if we're on the home page
if (modelContainer) {
    let scene, camera, renderer, controls, model;

    function init() {
        // Create scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xffffff);

        // Create camera with wider view
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 5000);
        camera.position.set(0, 40, 200);
        camera.lookAt(0, 40, 0);

        // Create renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        modelContainer.appendChild(renderer.domElement);

        // Basic lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
        directionalLight.position.set(0, 40, 200);
        scene.add(directionalLight);

        // Controls setup for smooth rotation
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.07;
        controls.enableZoom = false;
        controls.enablePan = false;
        controls.enableRotate = true;
        controls.rotateSpeed = 1.0;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 2.0;
        controls.enabled = true;

        // Load STL Model
        const loader = new THREE.STLLoader();
        loader.load(
            'stl_case.stl',
            function (geometry) {
                const material = new THREE.MeshStandardMaterial({
                    color: 0xcccccc,
                    metalness: 0.2,
                    roughness: 0.7,
                    flatShading: true
                });
                model = new THREE.Mesh(geometry, material);
                
                geometry.center();
                model.scale.set(0.5, 0.5, 0.5);
                model.position.y = 20;
                scene.add(model);
            },
            function (xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function (error) {
                console.error('Error loading STL:', error);
            }
        );

        window.addEventListener('resize', onWindowResize, false);
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }

    // Initialize the scene
    init();
    animate();
}

// Loading animation
document.addEventListener('DOMContentLoaded', () => {
    const loadingOverlay = document.querySelector('.loading-overlay');
    
    // Remove loading overlay
    if (!modelContainer) {
        // For non-home pages, remove immediately
        loadingOverlay.style.display = 'none';
    } else {
        // For home page, wait for content
        window.addEventListener('load', () => {
            loadingOverlay.classList.add('fade-out');
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 500);
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

// Initialize all functionality
document.addEventListener('DOMContentLoaded', () => {
    observeFeatures();
    initSmoothScroll();
    initPageTransitions();
    initCompatibilityChecker();
});

// Hamburger menu functionality
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const body = document.body;

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
        body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navLinks.contains(e.target) && navLinks.classList.contains('active')) {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
            body.style.overflow = '';
        }
    });

    // Close menu when window is resized above mobile breakpoint
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && navLinks.classList.contains('active')) {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
            body.style.overflow = '';
        }
    });
});