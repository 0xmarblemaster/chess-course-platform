/**
 * Swan Landing Page Clone - Main JavaScript
 * Handles animations, interactions, and dynamic behaviors
 */

// ============================================
// SMOOTH SCROLLING
// ============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href !== '#privacy' && href !== '#terms') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// ============================================
// SCROLL ANIMATIONS - INTERSECTION OBSERVER
// ============================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe elements that should fade in on scroll
document.addEventListener('DOMContentLoaded', () => {
    const elementsToAnimate = document.querySelectorAll('.feature-card, .testimonial-card');
    elementsToAnimate.forEach(el => {
        el.classList.add('fade-in-on-scroll');
        fadeInObserver.observe(el);
    });
});

// ============================================
// FAQ ACCORDION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

        question.addEventListener('click', () => {
            // Close all other FAQ items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });

            // Toggle current item
            item.classList.toggle('active');
        });
    });
});

// ============================================
// TESTIMONIALS CAROUSEL - INFINITE SCROLL
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const track = document.querySelector('.testimonials-track');
    if (track) {
        // Clone testimonials for infinite scroll effect
        const testimonials = Array.from(track.children);
        testimonials.forEach(testimonial => {
            const clone = testimonial.cloneNode(true);
            track.appendChild(clone);
        });
    }
});

// ============================================
// NAVBAR SCROLL EFFECT
// ============================================

let lastScroll = 0;
const nav = document.querySelector('.nav');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    // Add shadow on scroll
    if (currentScroll > 50) {
        nav.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.08)';
    } else {
        nav.style.boxShadow = 'none';
    }

    lastScroll = currentScroll;
});

// ============================================
// VIDEO PLAYER PLACEHOLDER
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const playButtons = document.querySelectorAll('.play-button');

    playButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Placeholder for video player functionality
            alert('Video player would open here. This is a demo clone.');
        });
    });
});

// ============================================
// REQUEST ACCESS BUTTON HANDLERS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const requestButtons = document.querySelectorAll('.btn-primary');

    requestButtons.forEach(button => {
        if (button.textContent.includes('Request Access') ||
            button.textContent.includes('Watch Demo')) {
            button.addEventListener('click', (e) => {
                // Prevent default if it's a form submission
                if (button.textContent.includes('Request Access')) {
                    e.preventDefault();
                    // Show a simple alert (in production, this would open a modal or form)
                    showNotification('Request Access form would appear here');
                }
            });
        }
    });
});

// ============================================
// NOTIFICATION SYSTEM
// ============================================

function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 24px;
        background: #000;
        color: #fff;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        font-size: 14px;
        max-width: 300px;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Add fadeOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ============================================
// PARALLAX EFFECT ON HERO
// ============================================

window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    if (hero && scrolled < window.innerHeight) {
        hero.style.transform = `translateY(${scrolled * 0.3}px)`;
        hero.style.opacity = 1 - (scrolled / 800);
    }
});

// ============================================
// CHAT ANIMATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.querySelectorAll('.chat-message');
    const chatObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateX(0)';
                }, index * 100);
            }
        });
    }, { threshold: 0.2 });

    chatMessages.forEach(message => {
        message.style.opacity = '0';
        message.style.transform = 'translateX(-20px)';
        message.style.transition = 'all 0.5s ease-out';
        chatObserver.observe(message);
    });
});

// ============================================
// FEATURE CARDS STAGGER ANIMATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const featureCards = document.querySelectorAll('.feature-card');
    const featureObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
            }
        });
    }, { threshold: 0.1 });

    featureCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease-out';
        featureObserver.observe(card);
    });
});

// ============================================
// PRICING CARD HIGHLIGHT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const pricingCard = document.querySelector('.pricing-card');
    if (pricingCard) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'pulse 1s ease-out';
                }
            });
        }, { threshold: 0.5 });

        observer.observe(pricingCard);
    }
});

// Add pulse animation
const pulseStyle = document.createElement('style');
pulseStyle.textContent = `
    @keyframes pulse {
        0%, 100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.02);
        }
    }
`;
document.head.appendChild(pulseStyle);

// ============================================
// CUSTOM CURSOR REMOVED
// ============================================
// The original Swan site does not use a custom cursor effect.
// Standard browser cursor behavior is maintained for better UX.

// ============================================
// PERFORMANCE OPTIMIZATION
// ============================================

// Debounce function for scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debounce to scroll handlers
const debouncedScroll = debounce(() => {
    // Any expensive scroll operations go here
}, 100);

window.addEventListener('scroll', debouncedScroll);

// ============================================
// LAZY LOADING FOR IMAGES (if any are added)
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
});

// ============================================
// CONSOLE MESSAGE
// ============================================

console.log('%c🦢 Swan Landing Page Clone', 'font-size: 20px; font-weight: bold; color: #000;');
console.log('%cThis is a technical clone for educational purposes', 'font-size: 12px; color: #666;');
console.log('%cOriginal design by Swan (getswan.com)', 'font-size: 12px; color: #999;');
