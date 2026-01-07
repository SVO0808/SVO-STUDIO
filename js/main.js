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
    // Fetch Products Logic (Home & Shop)
    // ==========================================================================
    let allProducts = [];

    function fetchProducts() {
        // Determine if we need to fetch products list (Home or Shop)
        const isShopPage = $('body').hasClass('page-shop');
        const isHomePage = $('.products-swiper').length > 0;

        // If not shop or home, maybe we don't need to fetch ALL products immediately,
        // unless we want to cache them. For now let's keep it simple.
        if (!isShopPage && !isHomePage) return;

        const $targetContainer = isShopPage ? $('#shop-products-grid') : $('#products-carousel');

        // Show loading
        $targetContainer.html('<div class="loading"></div>');

        $.ajax({
            url: `${API_BASE_URL}/products`,
            method: 'GET',
            dataType: 'json',
            success: function (products) {
                // Filter only clothing/relevant
                allProducts = products.filter(p =>
                    p.category === "men's clothing" ||
                    p.category === "women's clothing"
                );

                if (isShopPage) {
                    renderShopGrid(allProducts);
                    initShopFilters();
                } else if (isHomePage) {
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

            setTimeout(() => {
                $(`.filter-btn[data-category="${catName}"]`).trigger('click');
            }, 100);
        } else {
            // Default active
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
    // Product Detail Logic
    // ==========================================================================
    function initProductDetail() {
        if (!$('body').hasClass('page-product')) return;

        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');

        if (!productId) {
            $('#product-loading').hide();
            $('#product-error').show();
            return;
        }

        fetchProductDetail(productId);

        // Size Selector Interaction
        $('.size-btn').on('click', function () {
            $('.size-btn').removeClass('active');
            $(this).addClass('active');
        });

        // Add to Cart
        $('.btn-black').on('click', function () {
            const btn = $(this);
            const originalText = btn.text();

            btn.text('Added to Cart');
            btn.css('background-color', '#4CAF50'); // Green

            setTimeout(() => {
                btn.text(originalText);
                btn.css('background-color', '');
            }, 2000);
        });
    }

    function fetchProductDetail(id) {
        $.ajax({
            url: `${API_BASE_URL}/products/${id}`,
            method: 'GET',
            dataType: 'json',
            success: function (product) {
                if (!product) {
                    $('#product-loading').hide();
                    $('#product-error').show();
                    return;
                }
                renderProductDetail(product);
            },
            error: function (error) {
                console.error('Error details:', error);
                $('#product-loading').hide();
                $('#product-error').show();
            }
        });
    }

    function renderProductDetail(product) {
        // Populate Data
        $('#pd-image').attr('src', product.image).attr('alt', product.title);
        $('#pd-category').text(product.category);
        $('#pd-title').text(product.title);
        $('#pd-price').text(`$${product.price.toFixed(2)}`);
        $('#pd-desc').text(product.description); // Description from API

        // Hide Size Selector for Backpacks/Accessories
        if (product.title.toLowerCase().includes('backpack') || product.category === 'jewelery') {
            $('.option-group').hide();
        } else {
            $('.option-group').show();
        }

        // Update Page Title
        document.title = `${product.title} - SVO STUDIO`;

        // Show Content
        $('#product-loading').hide();
        $('#product-detail').fadeIn(400);
    }

    // ==========================================================================
    // Collection Page Logic
    // ==========================================================================
    function initCollection() {
        if (!$('body').hasClass('page-collection')) return;

        const urlParams = new URLSearchParams(window.location.search);
        const colId = urlParams.get('id');
        const $grid = $('#collection-grid');
        const $loading = $('#loading-indicator');

        // Collection Data
        const collections = {
            'fw25': {
                title: 'FW25 Essentials',
                desc: 'The new season standard. Bold silhouettes, refined materials.',
                image: 'img/collection-1.png',
                category: "men's clothing"
            },
            'basics': {
                title: 'Core Basics',
                desc: 'Timeless pieces for your daily rotation.',
                image: 'img/collection-2.png',
                category: "women's clothing" // Placeholder for basics
            }
        };

        const collection = collections[colId];

        if (!collection) {
            window.location.replace('shop.html');
            return;
        }

        // Render Hero
        $('#col-title').text(collection.title);
        $('#col-desc').text(collection.desc);
        $('.collection-hero').css('background-image', `url('${collection.image}')`);

        // Fetch & Render Products (Filtered)
        $.ajax({
            url: `${API_BASE_URL}/products/category/${encodeURIComponent(collection.category)}`,
            method: 'GET',
            dataType: 'json',
            success: function (products) {
                $loading.hide();
                products.forEach(product => {
                    $grid.append(createProductCard(product));
                });
            },
            error: function (error) {
                console.error('Error:', error);
                $loading.hide();
                $grid.html('<p class="error">Failed to load collection.</p>');
            }
        });
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
    initProductDetail();
    initCollection();

    console.log('SVO STUDIO loaded successfully');
});
