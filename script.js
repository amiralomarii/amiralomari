// ===== ENHANCED JAVASCRIPT FOR MODERN INTERACTIONS =====

// ===== CUSTOM CURSOR SYSTEM =====
class CustomCursor {
  constructor() {
    this.cursor = document.querySelector('.custom-cursor');
    this.cursorDot = document.querySelector('.cursor-dot');
    this.cursorRing = document.querySelector('.cursor-ring');
    
    this.mouseX = 0;
    this.mouseY = 0;
    this.cursorX = 0;
    this.cursorY = 0;
    
    this.isTouchDevice = this.detectTouchDevice();
    this.init();
  }

  detectTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
  }

  init() {
    // Skip initialization on touch devices
    if (this.isTouchDevice || !this.cursor || !this.cursorDot || !this.cursorRing) {
      if (this.cursor) {
        this.cursor.style.display = 'none';
      }
      return;
    }
    
    this.bindEvents();
    this.animate();
  }

  bindEvents() {
    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    // Handle interactive elements
    const interactiveElements = document.querySelectorAll('a, button, .project-card, .stat-card, .social-link');
    
    interactiveElements.forEach(element => {
      element.addEventListener('mouseenter', () => {
        if (this.cursorRing) {
          this.cursorRing.style.transform = 'translate(-50%, -50%) scale(1.5)';
          this.cursorRing.style.background = 'rgba(124, 58, 237, 0.3)';
        }
      });
      
      element.addEventListener('mouseleave', () => {
        if (this.cursorRing) {
          this.cursorRing.style.transform = 'translate(-50%, -50%) scale(1)';
          this.cursorRing.style.background = 'transparent';
        }
      });
    });

    // Handle text elements
    const textElements = document.querySelectorAll('h1, h2, h3, p, span');
    
    textElements.forEach(element => {
      element.addEventListener('mouseenter', () => {
        if (this.cursorRing) {
          this.cursorRing.style.transform = 'translate(-50%, -50%) scale(2)';
          this.cursorRing.style.background = 'rgba(6, 182, 212, 0.2)';
        }
      });
      
      element.addEventListener('mouseleave', () => {
        if (this.cursorRing) {
          this.cursorRing.style.transform = 'translate(-50%, -50%) scale(1)';
          this.cursorRing.style.background = 'transparent';
        }
      });
    });
  }

  animate() {
    if (this.isTouchDevice) return;
    
    // Smooth cursor movement
    this.cursorX += (this.mouseX - this.cursorX) * 0.1;
    this.cursorY += (this.mouseY - this.cursorY) * 0.1;
    
    if (this.cursor) {
      this.cursor.style.left = this.cursorX + 'px';
      this.cursor.style.top = this.cursorY + 'px';
    }
    
    if (this.cursorDot) {
      this.cursorDot.style.left = this.cursorX + 'px';
      this.cursorDot.style.top = this.cursorY + 'px';
    }
    
    if (this.cursorRing) {
      this.cursorRing.style.left = this.cursorX + 'px';
      this.cursorRing.style.top = this.cursorY + 'px';
    }
    
    requestAnimationFrame(() => this.animate());
  }
}

// ===== ENHANCED TYPING ANIMATION =====
class EnhancedTypingAnimation {
  constructor(element, phrases, options = {}) {
    this.element = element;
    this.phrases = phrases;
    this.options = {
      typeSpeed: 80,
      deleteSpeed: 40,
      pauseTime: 2000,
      cursorChar: '|',
      ...options
    };

    this.phraseIndex = 0;
    this.charIndex = 0;
    this.isDeleting = false;
    this.isPaused = false;

    this.init();
  }

  init() {
    this.type();
  }

  type() {
    if (this.isPaused) return;

    const currentPhrase = this.phrases[this.phraseIndex];
    const visibleText = currentPhrase.substring(0, this.charIndex);

    this.element.innerHTML = `${visibleText}<span class="cursor">${this.options.cursorChar}</span>`;

    if (!this.isDeleting) {
      if (this.charIndex < currentPhrase.length) {
        this.charIndex++;
        setTimeout(() => this.type(), this.options.typeSpeed);
      } else {
        setTimeout(() => {
          this.isDeleting = true;
          this.type();
        }, this.options.pauseTime);
      }
    } else {
      if (this.charIndex > 0) {
        this.charIndex--;
        setTimeout(() => this.type(), this.options.deleteSpeed);
      } else {
        this.isDeleting = false;
        this.phraseIndex = (this.phraseIndex + 1) % this.phrases.length;
        setTimeout(() => this.type(), 300);
      }
    }
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
    this.type();
  }
}

// ===== ENHANCED TESTIMONIALS CAROUSEL =====
class EnhancedTestimonialsCarousel {
  constructor(container) {
    this.container = container;
    this.slides = container.querySelectorAll('.testimonial-slide');
    this.dots = container.querySelectorAll('.dot');
    this.leftArrow = container.querySelector('.carousel-nav.left');
    this.rightArrow = container.querySelector('.carousel-nav.right');

    this.currentIndex = 0;
    this.autoSlideInterval = null;
    this.autoSlideDelay = 7000;
    this.isAnimating = false;

    this.init();
  }

  init() {
    this.bindEvents();
    this.startAutoSlide();
    this.showSlide(0);
  }

  bindEvents() {
    this.leftArrow?.addEventListener('click', () => {
      this.prevSlide();
      this.resetAutoSlide();
    });

    this.rightArrow?.addEventListener('click', () => {
      this.nextSlide();
      this.resetAutoSlide();
    });

    this.dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        this.showSlide(index);
        this.resetAutoSlide();
      });
    });

    this.container.addEventListener('mouseenter', () => this.pauseAutoSlide());
    this.container.addEventListener('mouseleave', () => this.startAutoSlide());

    // Enhanced keyboard navigation
    this.container.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        this.prevSlide();
        this.resetAutoSlide();
      } else if (e.key === 'ArrowRight') {
        this.nextSlide();
        this.resetAutoSlide();
      }
    });
  }

  showSlide(index) {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    
    // Fade out current slide
    this.slides[this.currentIndex].style.opacity = '0';
    this.slides[this.currentIndex].style.transform = 'translateY(20px) scale(0.95)';
    
    setTimeout(() => {
      // Update slides
      this.slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
        slide.setAttribute('aria-hidden', i !== index);
        if (i === index) {
          slide.style.opacity = '1';
          slide.style.transform = 'translateY(0) scale(1)';
        }
      });

      // Update dots
      this.dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
        dot.setAttribute('aria-selected', i === index);
      });

      this.currentIndex = index;
      this.isAnimating = false;
    }, 300);
  }

  nextSlide() {
    const newIndex = (this.currentIndex + 1) % this.slides.length;
    this.showSlide(newIndex);
  }

  prevSlide() {
    const newIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
    this.showSlide(newIndex);
  }

  startAutoSlide() {
    this.autoSlideInterval = setInterval(() => {
      this.nextSlide();
    }, this.autoSlideDelay);
  }

  pauseAutoSlide() {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
      this.autoSlideInterval = null;
    }
  }

  resetAutoSlide() {
    this.pauseAutoSlide();
    this.startAutoSlide();
  }
}

// ===== ENHANCED STATS COUNTER =====
class EnhancedStatsCounter {
  constructor() {
    this.counters = document.querySelectorAll('.count');
    this.hasStarted = false;
    this.observer = null;

    this.init();
  }

  init() {
    this.setupIntersectionObserver();
  }

  setupIntersectionObserver() {
    const options = {
      threshold: 0.2, // Lower threshold for earlier triggering
      rootMargin: '0px 0px -100px 0px' // Increased margin for better detection
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.hasStarted) {
          // Small delay to ensure smooth triggering
          setTimeout(() => {
            this.animateCounters();
            this.hasStarted = true;
          }, 300);
        }
      });
    }, options);

    const statsSection = document.getElementById('stats');
    if (statsSection) {
      this.observer.observe(statsSection);
    }
  }

  animateCounters() {
    this.counters.forEach(counter => {
      const target = parseInt(counter.getAttribute('data-target'));
      const suffix = counter.getAttribute('data-suffix') || '';
      
      this.animateCounter(counter, target, suffix);
    });
  }

  animateCounter(element, target, suffix) {
    let current = 0;
    const duration = 1500; // Faster animation
    const steps = 50; // More steps for smoother animation
    const increment = target / steps;
    const stepTime = duration / steps;

    // Set initial state - show 0 immediately
    element.textContent = '0' + suffix;
    element.style.opacity = '1';
    element.style.transform = 'translateY(0)';
    
    // Start animation immediately without delay
    const timer = setInterval(() => {
      current += increment;

      if (current >= target) {
        current = target;
        element.textContent = target + suffix;
        clearInterval(timer);
      } else {
        element.textContent = Math.floor(current) + suffix;
      }
    }, stepTime);
  }
}

// ===== SMOOTH SCROLL ENHANCEMENT =====
class SmoothScrollEnhancer {
  constructor() {
    this.init();
  }

  init() {
    this.enhanceScrollBehavior();
    this.addScrollProgressIndicator();
  }

  enhanceScrollBehavior() {
    // Add smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

  addScrollProgressIndicator() {
    // Create scroll progress bar
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 0%;
      height: 3px;
      background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
      z-index: 9999;
      transition: width 0.1s ease;
    `;
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
      const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      progressBar.style.width = scrolled + '%';
    });
  }
}

// ===== NAVBAR SCROLL EFFECT ENHANCEMENT =====
class EnhancedNavbarScrollEffect {
  constructor() {
    this.navbar = document.querySelector('.navbar');
    this.lastScrollY = window.scrollY;
    this.init();
  }

  init() {
    if (!this.navbar) return;

    window.addEventListener('scroll', () => this.handleScroll());
  }

  handleScroll() {
    const currentScrollY = window.scrollY;
    
    // Enhanced navbar behavior
    if (currentScrollY > 100) {
      this.navbar.style.transform = 'translateX(-50%) translateY(10px)';
      this.navbar.style.opacity = '0.9';
    } else {
      this.navbar.style.transform = 'translateX(-50%) translateY(0)';
      this.navbar.style.opacity = '1';
    }

    // Auto-highlight active section in navbar
    this.updateActiveNavLink();
    
    this.lastScrollY = currentScrollY;
  }

  updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 150;
      const sectionHeight = section.offsetHeight;
      if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      }
    });
  }
}

// ===== INTERSECTION OBSERVER FOR ENHANCED ANIMATIONS =====
class EnhancedAnimationObserver {
  constructor() {
    this.elements = document.querySelectorAll('.fade-in');
    this.init();
  }

  init() {
    const options = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
          
          // Enhanced stagger animation for grouped elements
          if (entry.target.classList.contains('project-card') || 
              entry.target.classList.contains('stat-card')) {
            this.animateWithStagger(entry.target);
          }
          
          observer.unobserve(entry.target);
        }
      });
    }, options);

    this.elements.forEach(element => {
      observer.observe(element);
    });
  }

  animateWithStagger(element) {
    const siblings = Array.from(element.parentElement.children);
    const index = siblings.indexOf(element);
    
    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    }, index * 100);
  }
}

// ===== ENHANCED SCROLL TO TOP =====
class EnhancedScrollToTop {
  constructor() {
    this.button = document.getElementById('scrollToTopBtn');
    this.threshold = 400;

    this.init();
  }

  init() {
    if (!this.button) return;

    this.bindEvents();
    this.handleScroll();
  }

  bindEvents() {
    window.addEventListener('scroll', () => this.handleScroll());
    this.button.addEventListener('click', () => this.scrollToTop());
    
    // Enhanced click animation
    this.button.addEventListener('click', (e) => {
      const ripple = document.createElement('span');
      ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
      `;
      
      const rect = this.button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = e.clientX - rect.left - size / 2 + 'px';
      ripple.style.top = e.clientY - rect.top - size / 2 + 'px';
      
      this.button.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 600);
    });
  }

  handleScroll() {
    const shouldShow = window.scrollY > this.threshold;
    this.button.style.display = shouldShow ? 'flex' : 'none';
    
    if (shouldShow) {
      this.button.style.opacity = '1';
      this.button.style.transform = 'translateY(0)';
    } else {
      this.button.style.opacity = '0';
      this.button.style.transform = 'translateY(10px)';
    }
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}

// ===== FLOATING CHAT BUTTON =====
class FloatingChatButton {
  constructor() {
    this.button = document.querySelector('.floating-chat-btn');
    this.init();
  }

  init() {
    if (!this.button) return;

    this.bindEvents();
  }

  bindEvents() {
    this.button.addEventListener('click', () => {
      // Scroll to chatbot section
      const chatbotSection = document.getElementById('chatbot');
      if (chatbotSection) {
        chatbotSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  }
}

// ===== PARALLAX EFFECTS =====
class ParallaxEffects {
  constructor() {
    this.elements = document.querySelectorAll('.mesh-gradient, .mesh-gradient-2, .mesh-gradient-3');
    this.init();
  }

  init() {
    if (this.elements.length === 0) return;
    
    window.addEventListener('scroll', () => this.handleScroll());
  }

  handleScroll() {
    const scrolled = window.pageYOffset;
    const rate = scrolled * -0.5;
    
    this.elements.forEach((element, index) => {
      const speed = (index + 1) * 0.2;
      element.style.transform = `translateY(${rate * speed}px)`;
    });
  }
}

// ===== PERFORMANCE OPTIMIZER =====
class PerformanceOptimizer {
  constructor() {
    this.init();
  }

  init() {
    this.optimizeAnimations();
    this.preloadCriticalResources();
    this.lazyLoadImages();
  }

  optimizeAnimations() {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    if (prefersReducedMotion.matches) {
      document.body.classList.add('reduced-motion');
    }

    prefersReducedMotion.addEventListener('change', (e) => {
      if (e.matches) {
        document.body.classList.add('reduced-motion');
      } else {
        document.body.classList.remove('reduced-motion');
      }
    });
  }

  preloadCriticalResources() {
    const criticalImages = [
      'Amir Alomari Suit-Photoroom.png'
    ];

    criticalImages.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });
  }

  lazyLoadImages() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.classList.add('loaded');
            imageObserver.unobserve(img);
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
    }
  }
}

// ===== ACCESSIBILITY ENHANCER =====
class EnhancedAccessibilityEnhancer {
  constructor() {
    this.init();
  }

  init() {
    this.setupKeyboardNavigation();
    this.setupFocusManagement();
    this.setupScreenReaderSupport();
  }

  setupKeyboardNavigation() {
    // Enhanced keyboard navigation for all interactive elements
    const interactiveElements = document.querySelectorAll(
      '.project-card, .stat-card, .social-link, .carousel-nav, .dot, .cta-button'
    );

    interactiveElements.forEach(element => {
      element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          element.click();
        }
      });
    });
  }

  setupFocusManagement() {
    // Improve focus visibility
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });
  }

  setupScreenReaderSupport() {
    // Add ARIA labels and descriptions where needed
    const elements = document.querySelectorAll('.section-title');
    elements.forEach(element => {
      if (!element.getAttribute('aria-label')) {
        element.setAttribute('aria-label', element.textContent);
      }
    });
  }
}

// ===== BUTTON INTERACTIONS =====
class ButtonInteractions {
  constructor() {
    this.init();
  }

  init() {
    this.setupCTAButtons();
    this.setupProjectCards();
    this.setupStatCards();
  }

  setupCTAButtons() {
    const ctaButtons = document.querySelectorAll('.cta-button');
    
    ctaButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const buttonText = button.querySelector('span').textContent.toLowerCase();
        
        if (buttonText.includes('project')) {
          // Scroll to projects section
          const projectsSection = document.getElementById('projects');
          if (projectsSection) {
            projectsSection.scrollIntoView({ behavior: 'smooth' });
          }
        } else if (buttonText.includes('contact')) {
          // Scroll to contact section
          const contactSection = document.getElementById('contact');
          if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });
  }

  setupProjectCards() {
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach(card => {
      card.addEventListener('click', () => {
        // Add click animation
        card.style.transform = 'scale(0.95)';
        setTimeout(() => {
          card.style.transform = '';
        }, 150);
      });
    });
  }

  setupStatCards() {
    const statCards = document.querySelectorAll('.stat-card');
    
    statCards.forEach(card => {
      card.addEventListener('click', () => {
        // Add click animation
        card.style.transform = 'scale(0.95) rotateY(5deg)';
        setTimeout(() => {
          card.style.transform = '';
        }, 150);
      });
    });
  }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  // Check if device supports hover (desktop) or touch (mobile)
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Initialize custom cursor only on devices with mouse
  if (!isTouchDevice) {
    new CustomCursor();
  }
  
  // Initialize typing animation
  const typingElement = document.getElementById('typing-text');
  if (typingElement) {
    const phrases = [
      'AI Developer & Technology Specialist',
      'Turning Ideas into Reality with Code & AI',
      'Building the Future with Intelligent Solutions'
    ];
    new EnhancedTypingAnimation(typingElement, phrases);
  }

  // Initialize testimonials carousel
  const testimonialsContainer = document.querySelector('.testimonials-carousel');
  if (testimonialsContainer) {
    new EnhancedTestimonialsCarousel(testimonialsContainer);
  }

  // Initialize stats counter
  new EnhancedStatsCounter();

  // Initialize scroll to top
  new EnhancedScrollToTop();

  // Initialize floating chat button
  new FloatingChatButton();

  // Initialize smooth scroll enhancer
  new SmoothScrollEnhancer();

  // Initialize enhanced navbar scroll effect
  new EnhancedNavbarScrollEffect();

  // Initialize animation observer
  new EnhancedAnimationObserver();

  // Initialize parallax effects
  new ParallaxEffects();

  // Initialize performance optimizations
  new PerformanceOptimizer();

  // Initialize accessibility enhancements
  new EnhancedAccessibilityEnhancer();

  // Initialize button interactions
  new ButtonInteractions();

  // Add CSS for ripple animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
    
    .loaded {
      opacity: 1;
      transition: opacity 0.3s ease;
    }
  `;
  document.head.appendChild(style);
});

// ===== UTILITY FUNCTIONS =====
const EnhancedUtils = {
  // Enhanced debounce function
  debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  },

  // Enhanced throttle function
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Enhanced viewport check
  isInViewport(element, threshold = 0) {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    
    return (
      rect.top >= -threshold &&
      rect.left >= -threshold &&
      rect.bottom <= windowHeight + threshold &&
      rect.right <= windowWidth + threshold
    );
  },

  // Smooth element reveal
  revealElement(element, delay = 0) {
    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    }, delay);
  }
};

// ===== ERROR HANDLING =====
window.addEventListener('error', (e) => {
  console.error('JavaScript error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
});

// ===== PERFORMANCE MONITORING =====
if ('performance' in window) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType('navigation')[0];
      console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
    }, 0);
  });
}

// ===== EXPORT FOR TESTING =====
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CustomCursor,
    EnhancedTypingAnimation,
    EnhancedTestimonialsCarousel,
    EnhancedStatsCounter,
    EnhancedScrollToTop,
    EnhancedUtils
  };
}
