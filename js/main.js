// ==========================================================================
// SVO STUDIO - Main JavaScript
// ==========================================================================

$(document).ready(function () {
    'use strict';

    // ==========================================================================
    // API Configuration
    // ==========================================================================
    const API_BASE_URL = 'https://fakestoreapi.com';

    // ==========================================================================
    // Mobile Navigation Toggle
    // ==========================================================================
    const $navToggle = $('#nav-toggle');
    const $navMenu = $('#nav-menu');

    $navToggle.on('click', function () {
        $(this).toggleClass('active');
        $navMenu.toggleClass('active');
        $('body').toggleClass('menu-open');
    });

    $('.nav-link').on('click', function () {
        $navToggle.removeClass('active');
        $navMenu.removeClass('active');
        $('body').removeClass('menu-open');
    });

    $(document).on('keydown', function (e) {
        if (e.key === 'Escape' && $navMenu.hasClass('active')) {
            $navToggle.removeClass('active');
            $navMenu.removeClass('active');
            $('body').removeClass('menu-open');
        }
    });

    // ==========================================================================
    // Header Scroll Effect
    // ==========================================================================
    const $header = $('.header');

    $(window).on('scroll', function () {
        const currentScroll = $(window).scrollTop();
        if (currentScroll > 50) {
            $header.addClass('scrolled');
        } else {
            $header.removeClass('scrolled');
        }
    });

    // ==========================================================================
    // Products Carousel (Swiper)
    // ==========================================================================
    let productsSwiper = null;

    function initSwiper() {
        productsSwiper = new Swiper('.products-swiper', {
            slidesPerView: 'auto',
            spaceBetween: 30,
            centeredSlides: false,
            grabCursor: true,
            speed: 600,
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            breakpoints: {
                320: { spaceBetween: 15 },
                768: { spaceBetween: 20 },
                1024: { spaceBetween: 30 }
            }
        });
    }

    // ==========================================================================
    // Fetch Products from API
    // ==========================================================================
    function fetchProducts() {
        const $carousel = $('#products-carousel');

        // Show loading state
        $carousel.html('<div class="swiper-slide loading"></div>');

        // Fetch men's clothing products
        $.ajax({
            url: `${API_BASE_URL}/products/category/men's clothing`,
            method: 'GET',
            dataType: 'json',
            success: function (products) {
                // Products: 1-backpack, 2-tshirt, 3-jacket, 4-casual shirt
                // All are basic streetwear essentials for men
                renderProducts(products);
            },
            error: function (error) {
                console.error('Error fetching products:', error);
                $carousel.html('<p class="error">Failed to load products. Please try again.</p>');
            }
        });
    }

    // ==========================================================================
    // Render Products
    // ==========================================================================
    function renderProducts(products) {
        const $carousel = $('#products-carousel');
        $carousel.empty();

        products.forEach(function (product) {
            const productCard = `
                <div class="swiper-slide">
                    <a href="product.html?id=${product.id}" class="product-card">
                        <div class="product-image">
                            <img src="${product.image}" alt="${product.title}" loading="lazy">
                        </div>
                        <div class="product-info">
                            <h3 class="product-title">${truncateText(product.title, 40)}</h3>
                            <p class="product-price">$${product.price.toFixed(2)}</p>
                        </div>
                    </a>
                </div>
            `;
            $carousel.append(productCard);
        });

        // Initialize Swiper after products are loaded
        initSwiper();
    }

    // ==========================================================================
    // Utility Functions
    // ==========================================================================
    function truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }

    // ==========================================================================
    // Smooth Scroll for Anchor Links
    // ==========================================================================
    $('a[href^="#"]').on('click', function (e) {
        const target = $(this.getAttribute('href'));
        if (target.length) {
            e.preventDefault();
            $('html, body').animate({
                scrollTop: target.offset().top - 80
            }, 600);
        }
    });

    // ==========================================================================
    // Initialize
    // ==========================================================================
    fetchProducts();

    console.log('SVO STUDIO loaded successfully');
});
