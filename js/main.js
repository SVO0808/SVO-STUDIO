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
        if ($('.products-swiper').length === 0) return;

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
    // Fetch Products Logic
    // ==========================================================================
    let allProducts = [];

    function fetchProducts() {
        // Determine if we are on Shop page or Home page
        const isShopPage = $('body').hasClass('page-shop');
        const $targetContainer = isShopPage ? $('#shop-products-grid') : $('#products-carousel');

        // Show loading
        $targetContainer.html('<div class="loading"></div>');

        // Fetch ALL products to handle client-side filtering on shop page
        // or just to have data ready
        $.ajax({
            url: `${API_BASE_URL}/products`,
            method: 'GET',
            dataType: 'json',
            success: function (products) {
                // Filter only clothing
                allProducts = products.filter(p =>
                    p.category === "men's clothing" ||
                    p.category === "women's clothing"
                );

                if (isShopPage) {
                    renderShopGrid(allProducts);
                    initShopFilters();
                } else {
                    // Home page: Render only men's clothing in carousel
                    const mensProducts = allProducts.filter(p => p.category === "men's clothing");
                    renderCarousel(mensProducts);
                }
            },
            error: function (error) {
                console.error('Error fetching:', error);
                $targetContainer.html('<p class="error">Failed to load products.</p>');
            }
        });
    }

    // ==========================================================================
    // Render Functions
    // ==========================================================================
    function renderCarousel(products) {
        const $carousel = $('#products-carousel');
        $carousel.empty();

        products.forEach(product => {
            $carousel.append(`
                <div class="swiper-slide">
                    ${createProductCard(product)}
                </div>
            `);
        });

        initSwiper();
    }

    function renderShopGrid(products) {
        const $grid = $('#shop-products-grid');
        $grid.empty();

        if (products.length === 0) {
            $grid.html('<p class="no-results">No products found.</p>');
            return;
        }

        products.forEach(product => {
            $grid.append(createProductCard(product));
        });
    }

    function createProductCard(product) {
        return `
            <a href="product.html?id=${product.id}" class="product-card" data-id="${product.id}">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.title}" loading="lazy">
                </div>
                <div class="product-info">
                    <h3 class="product-title">${truncateText(product.title, 40)}</h3>
                    <p class="product-price">$${product.price.toFixed(2)}</p>
                </div>
            </a>
        `;
    }

    // ==========================================================================
    // Shop Filters & Sort
    // ==========================================================================
    function initShopFilters() {
        // Category Filter
        $('.filter-btn[data-category]').on('click', function () {
            $('.filter-btn[data-category]').removeClass('active');
            $(this).addClass('active');

            const category = $(this).data('category');
            applyFilters(category, $('.filter-btn[data-sort].active').data('sort'));
        });

        // Sort Filter
        $('.filter-btn[data-sort]').on('click', function () {
            $('.filter-btn[data-sort]').removeClass('active');
            $(this).addClass('active');

            const sortType = $(this).data('sort');
            applyFilters($('.filter-btn[data-category].active').data('category'), sortType);
        });

        // Check URL params for initial category
        const urlParams = new URLSearchParams(window.location.search);
        const categoryParam = urlParams.get('category');
        if (categoryParam) {
            let catName = 'all';
            if (categoryParam === 'men') catName = "men's clothing";
            if (categoryParam === 'women') catName = "women's clothing";

            $(`.filter-btn[data-category="${catName}"]`).trigger('click');
        } else {
            // Default active if filter elements exist
            if ($('.filter-btn[data-category="all"]').length > 0) {
                $('.filter-btn[data-category="all"]').addClass('active');
                $('.filter-btn[data-sort="newest"]').addClass('active');
            }
        }
    }

    function applyFilters(category, sortType) {
        let filtered = [...allProducts];

        // 1. Filter
        if (category && category !== 'all') {
            filtered = filtered.filter(p => p.category === category);
        }

        // 2. Sort
        if (sortType === 'price-asc') {
            filtered.sort((a, b) => a.price - b.price);
        } else if (sortType === 'price-desc') {
            filtered.sort((a, b) => b.price - a.price);
        }

        renderShopGrid(filtered);
    }

    // ==========================================================================
    // Utility Functions
    // ==========================================================================
    function truncateText(text, maxLength) {
        if (!text) return '';
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
