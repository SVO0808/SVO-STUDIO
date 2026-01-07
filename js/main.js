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

        // Trigger animations on new elements
        if (typeof Animations !== 'undefined') {
            Animations.observeNewElements();
        }
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

        // Trigger animations on new elements
        if (typeof Animations !== 'undefined') {
            Animations.observeNewElements();
        }
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
        $('.btn-black').off('click').on('click', function () {
            const product = $(this).data('product');
            const size = $('.size-btn.active').text();

            if (!product) return;

            Cart.addItem(product, size);

            const btn = $(this);
            const originalText = btn.text();

            btn.text('Added to Cart');
            btn.css('background-color', '#4CAF50'); // Green

            setTimeout(() => {
                btn.text(originalText);
                btn.css('background-color', '');
            }, 2000);
        });

        // Image Zoom Logic (Lens Effect)
        const $imgContainer = $('.main-image');
        const $img = $('#pd-image');

        // Create Lens Element
        let $lens = $('.zoom-lens');
        if ($lens.length === 0) {
            $lens = $('<div class="zoom-lens"></div>');
            $imgContainer.append($lens);
        }

        const ZOOM_LEVEL = 2.5;

        $imgContainer.on('mouseenter', function () {
            // Set lens background to image src
            $lens.css('background-image', `url(${$img.attr('src')})`);
            $lens.addClass('active');
        });

        $imgContainer.on('mousemove', function (e) {
            // Container info
            const { left, top, width, height } = this.getBoundingClientRect();

            // Cursor pos relative to container
            let x = e.clientX - left;
            let y = e.clientY - top;

            // Lens dimensions
            const lensW = $lens.width();
            const lensH = $lens.height();

            // Center lens on cursor
            let lensLeft = x - (lensW / 2);
            let lensTop = y - (lensH / 2);

            // Positioning text/element
            $lens.css({
                left: lensLeft + 'px',
                top: lensTop + 'px'
            });

            // Calculate background position
            // We want to show the part of the image under the cursor.
            // But wait, the image inside is 'contain' and might be smaller than container.
            // For a perfect effect with 'object-fit: contain', it's complex to map exactly unless we know the rendered image dimensions.
            // Simplified approach: Assume image fills container logic for zoom or just map container coordinates to background %

            // Background Position Logic: moving the background in opposite direction
            // bgPosX = - (x * ZOOM_LEVEL - lensW / 2)
            // But we rarely fill the container. 
            // Better approach for 'contain' images: just verify the visual. 
            // If the image has whitespace, the lens will show whitespace.

            // Percentage based usually works best for 'contain' if aligned center
            const xPct = (x / width) * 100;
            const yPct = (y / height) * 100;

            $lens.css({
                'background-size': `${width * ZOOM_LEVEL}px ${height * ZOOM_LEVEL}px`,
                'background-position': `${xPct}% ${yPct}%`
            });
        });

        $imgContainer.on('mouseleave', function () {
            $lens.removeClass('active');
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

        // Store product data
        $('.btn-black').data('product', product);

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
    // Cart Logic
    // ==========================================================================
    const Cart = {
        items: [],
        autoCloseTimer: null,
        discountApplied: false, // Cart discount state

        init: function () {
            this.load();
            this.updateBadge();
            if ($('body').hasClass('page-cart')) {
                this.renderCartPage();
            }
        },

        load: function () {
            const stored = localStorage.getItem('svo_cart');
            if (stored) {
                this.items = JSON.parse(stored);
            }
        },

        save: function () {
            localStorage.setItem('svo_cart', JSON.stringify(this.items));
            this.updateBadge();
        },

        addItem: function (product, size) {
            const existing = this.items.find(item => item.id === product.id && item.size === size);

            if (existing) {
                existing.quantity += 1;
            } else {
                this.items.push({
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    image: product.image,
                    size: size,
                    quantity: 1
                });
            }

            this.save();
            this.updateBadge(); // badge update
            this.openDropdown(); // Show mini cart
        },

        removeItem: function (index) {
            this.items.splice(index, 1);
            this.save();
            this.renderCartPage();
            this.renderDropdown(); // Update dropdown if open
            this.updateBadge();
        },

        changeQty: function (index, delta) {
            const item = this.items[index];
            if (!item) return;
            item.quantity += delta;
            if (item.quantity < 1) item.quantity = 1;
            this.save();
            this.renderCartPage();
        },

        getTotal: function () {
            return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        },

        updateBadge: function () {
            const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
            const $badge = $('.cart-badge');

            if (totalItems > 0) {
                if ($badge.length === 0) {
                    $('.cart-link').append(`<span class="cart-badge">${totalItems}</span>`);
                } else {
                    $badge.text(totalItems);
                }
            } else {
                $badge.remove();
            }
        },

        renderCartPage: function () {
            const $cartItems = $('.cart-items');
            const $cartSummary = $('.cart-summary');

            $cartItems.empty();

            if (this.items.length === 0) {
                $cartItems.html(`
                    <div class="cart-empty-message">
                        <p>Your cart is empty.</p>
                        <a href="shop.html" class="btn btn-black" style="margin-top: 1rem; display: inline-block;">Continue Shopping</a>
                    </div>
                `);
                $cartSummary.hide();
                return;
            }

            this.items.forEach((item, index) => {
                $cartItems.append(`
                    <div class="cart-item" style="display: flex; gap: 1rem; margin-bottom: 2rem; border-bottom: 1px solid #eee; padding-bottom: 1rem;">
                        <div class="item-image" style="width: 80px; height: 100px; flex-shrink: 0;">
                            <img src="${item.image}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: contain;">
                        </div>
                        <div class="item-details" style="flex-grow: 1;">
                            <h4 style="font-size: 0.9rem; margin-bottom: 0.25rem;">${item.title}</h4>
                            <p style="font-size: 0.8rem; color: #666; margin-bottom: 0.5rem;">Size: ${item.size}</p>
                            <div class="qty-control-group" style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem;">
                                <button class="qty-btn" onclick="Cart.changeQty(${index}, -1)" style="width: 24px; height: 24px; border: 1px solid #ddd; background: #fff; cursor: pointer;">-</button>
                                <span style="font-size: 0.9rem; min-width: 20px; text-align: center;">${item.quantity}</span>
                                <button class="qty-btn" onclick="Cart.changeQty(${index}, 1)" style="width: 24px; height: 24px; border: 1px solid #ddd; background: #fff; cursor: pointer;">+</button>
                            </div>
                        </div>
                        <div class="item-actions" style="text-align: right;">
                             <p style="font-size: 0.9rem; font-weight: 500; margin-bottom: 0.5rem;">$${(item.price * item.quantity).toFixed(2)}</p>
                            <button class="remove-btn" onclick="Cart.removeItem(${index})" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #999;">&times;</button>
                        </div>
                    </div>
                `);
            });

            // Update Summary (with discount support)
            const subtotal = this.getTotal();
            const shippingThreshold = 60;

            // Calculate discount if applied
            let discount = 0;
            if (this.discountApplied) {
                discount = subtotal * 0.10;
                $('#cart-discount-row').css('display', 'flex');
                $('#cart-discount-amount').text(`-$${discount.toFixed(2)}`);
            } else {
                $('#cart-discount-row').hide();
            }

            const subtotalAfterDiscount = subtotal - discount;
            const shippingCost = subtotalAfterDiscount > shippingThreshold ? 0 : 4.99;
            const total = subtotalAfterDiscount + shippingCost;

            // Selectors
            const $subtotalRow = $('.summary-row').first();
            const $shippingRow = $('.summary-row').not('#cart-discount-row').eq(1);
            const $totalRow = $('.summary-total');

            // Render Values
            $subtotalRow.find('span:last-child').text(`$${subtotal.toFixed(2)}`);

            if (shippingCost === 0) {
                $shippingRow.find('span:last-child').text('Free');
                // Remove existing progress if any
                $('.free-shipping-msg').remove();
                $shippingRow.find('span:last-child').css('color', '#4CAF50'); // Green
            } else {
                $shippingRow.find('span:last-child').text(`$${shippingCost.toFixed(2)}`);
                $shippingRow.find('span:last-child').css('color', ''); // Reset color

                // Add/Update "Add X for free shipping" message
                const remaining = shippingThreshold - subtotalAfterDiscount;
                let $msg = $('.free-shipping-msg');
                if ($msg.length === 0) {
                    $msg = $('<p class="free-shipping-msg" style="font-size: 0.8rem; color: #666; margin-top: 0.5rem; font-style: italic;"></p>');
                    $shippingRow.after($msg);
                }
                $msg.text(`Add $${remaining.toFixed(2)} more for free shipping.`);
            }

            $totalRow.find('span:last-child').text(`$${total.toFixed(2)}`);
            $cartSummary.show();

            // Coupon Logic for Cart Page
            const self = this;
            $('#apply-cart-coupon').off('click').on('click', function () {
                const code = $('#cart-coupon-code').val().trim().toUpperCase();
                const $msg = $('#cart-coupon-message');
                const $btn = $(this);

                if (code === 'WELCOME10') {
                    if (self.discountApplied) return;

                    self.discountApplied = true;
                    $msg.removeClass('error').addClass('success').text('Coupon applied successfully!');
                    $btn.text('Applied').css({ 'background': '#28a745', 'color': '#fff' }).prop('disabled', true);
                    $('#cart-coupon-code').prop('disabled', true);

                    // Re-render to update totals
                    self.renderCartPage();
                } else if (code === '') {
                    $msg.removeClass('success').addClass('error').text('Please enter a code.');
                } else {
                    $msg.removeClass('success').addClass('error').text('Invalid discount code.');
                }
            });

            // Link Checkout Button
            $('.cart-summary .btn-black').not('#apply-cart-coupon').off('click').on('click', function () {
                window.location.href = 'checkout.html';
            });
        },

        // ======================================================================
        // Dropdown Logic
        // ======================================================================
        initDropdown: function () {
            // Don't initialize dropdown on cart page
            if ($('body').hasClass('page-cart')) return;

            // Inject HTML if not exists
            if ($('#cart-dropdown').length === 0) {
                $('.nav.container').append(`
                    <div id="cart-dropdown">
                        <div class="mini-cart-header">
                            <span>Shopping Cart</span>
                            <span id="mini-cart-count" style="color: #666; font-size: 0.8rem;">0 items</span>
                        </div>
                        <div class="mini-cart-items">
                            <!-- Items -->
                        </div>
                        <div class="mini-cart-footer">
                            <div class="mini-cart-total">
                                <span>Subtotal:</span>
                                <span id="mini-cart-subtotal">$0.00</span>
                            </div>
                            <a href="checkout.html" class="btn btn-black btn-full">Checkout</a>
                            <a href="cart.html" style="display: block; text-align: center; margin-top: 0.5rem; font-size: 0.8rem; color: #666; text-decoration: underline;">View Cart</a>
                        </div>
                    </div>
                `);
            }

            // Events
            let timeout;
            const $dropdown = $('#cart-dropdown');
            const $trigger = $('.cart-link');

            // Clean previous events
            $trigger.off('mouseenter mouseleave');
            $dropdown.off('mouseenter mouseleave');
            $(document).off('click.cartDropdown');

            // Open on hover trigger
            $trigger.on('mouseenter', () => {
                clearTimeout(timeout);
                this.renderDropdown();
                $dropdown.addClass('active');
            });

            // Keep open on hover dropdown
            $dropdown.on('mouseenter', () => {
                clearTimeout(timeout);
            });

            // Close on leave (with delay)
            $trigger.add($dropdown).on('mouseleave', () => {
                timeout = setTimeout(() => {
                    $dropdown.removeClass('active');
                }, 300);
            });

            // Close on click outside
            $(document).on('click.cartDropdown', function (e) {
                if (!$(e.target).closest('#cart-dropdown').length && !$(e.target).closest('.cart-link').length) {
                    $dropdown.removeClass('active');
                }
            });
        },

        renderDropdown: function () {
            const $container = $('.mini-cart-items');
            $container.empty();
            const $checkoutBtn = $('#cart-dropdown .btn-full');

            if (this.items.length === 0) {
                $container.html('<p style="color: #999; text-align: center; padding: 1rem;">Your cart is empty</p>');
                $('#mini-cart-subtotal').text('$0.00');
                $('#mini-cart-count').text('0 items');
                $checkoutBtn.addClass('disabled');
                return;
            }

            $checkoutBtn.removeClass('disabled');

            this.items.forEach(item => {
                $container.append(`
                    <div class="mini-cart-item">
                        <img src="${item.image}" alt="${item.title}">
                        <div style="flex-grow: 1;">
                            <p style="font-size: 0.85rem; font-weight: 500; margin: 0; line-height: 1.2;">${item.title}</p>
                            <p style="font-size: 0.75rem; color: #666; margin: 0.25rem 0;">Size: ${item.size} | Qty: ${item.quantity}</p>
                            <p style="font-size: 0.85rem; font-weight: 500;">$${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                    </div>
                `);
            });

            const subtotal = this.getTotal();
            $('#mini-cart-subtotal').text(`$${subtotal.toFixed(2)}`);
            $('#mini-cart-count').text(`${this.items.length} items`);
        },

        autoCloseTimer: null, // Added autoCloseTimer property

        openDropdown: function () {
            this.renderDropdown();

            // Delay adding class to avoid immediate close by document click listener (bubbling)
            setTimeout(() => {
                $('#cart-dropdown').addClass('active');
            }, 10);

            // Clear previous auto-close timer
            if (this.autoCloseTimer) clearTimeout(this.autoCloseTimer);

            // Auto close after 3s if not hovered
            this.autoCloseTimer = setTimeout(() => {
                if (!$('#cart-dropdown:hover').length && !$('.cart-link:hover').length) {
                    $('#cart-dropdown').removeClass('active');
                }
            }, 3000);
        }
    };

    // Expose Cart to global
    window.Cart = Cart;

    // ==========================================================================
    // Checkout Logic
    // ==========================================================================
    const Checkout = {
        discountApplied: false, // State

        // ======================================================================
        // Payment Validation Regex Patterns
        // ======================================================================
        patterns: {
            // Card Number: 13-19 digits (with or without spaces/dashes)
            cardNumber: /^(\d{4}[\s-]?){3}\d{1,7}$|^\d{13,19}$/,
            // Expiry Date: MM/YY format where MM is 01-12
            expiry: /^(0[1-9]|1[0-2])\/([0-9]{2})$/,
            // CVV: 3 digits (Visa/MC) or 4 digits (Amex)
            cvv: /^[0-9]{3,4}$/
        },

        init: function () {
            if (!$('body').hasClass('page-checkout')) return;

            // Reset state
            this.discountApplied = false;

            this.renderSummary();
            this.initPaymentValidation(); // Initialize payment field validation

            // Coupon Logic
            $('#apply-coupon').on('click', () => {
                const code = $('#coupon-code').val().trim().toUpperCase();
                const $msg = $('#coupon-message');
                const $btn = $('#apply-coupon');

                if (code === 'WELCOME10') {
                    if (this.discountApplied) return; // Already applied

                    this.discountApplied = true;
                    $msg.html('<span style="color: #28a745;">Coupon applied successfully!</span>');
                    $btn.text('Applied').css({ 'background': '#28a745', 'color': '#fff' }).prop('disabled', true);
                    $('#coupon-code').prop('disabled', true);

                    this.renderSummary(); // Re-calc totals
                } else {
                    $msg.html('<span style="color: #dc3545;">Invalid discount code.</span>');
                    // Shake effect optional
                }
            });

            // Email Validation on Blur
            $('#email').on('blur', function () {
                const $input = $(this);
                const email = $input.val();
                const $parent = $input.parent();

                // Remove existing error
                $input.removeClass('error');
                $parent.find('.error-message').remove();

                // Check validity
                if (email.length > 0 && !this.checkValidity()) {
                    $input.addClass('error');
                    $parent.append('<span class="error-message">Please enter a valid email address</span>');
                }
            });

            // Clear error on modify
            $('#email').on('input', function () {
                $(this).removeClass('error');
                $(this).parent().find('.error-message').remove();
            });

            $('#checkout-form').on('submit', (e) => {
                e.preventDefault();

                // Validate all payment fields before submit
                if (!this.validateAllPaymentFields()) {
                    return;
                }

                const $btn = $('#btn-pay');
                const originalText = $btn.text();

                $btn.prop('disabled', true).text('Processing...');

                // Simulate API call
                setTimeout(() => {
                    window.location.href = 'confirmation.html';
                }, 2000);
            });
        },

        // ======================================================================
        // Payment Field Validation & Auto-Formatting
        // ======================================================================
        initPaymentValidation: function () {
            const self = this;

            // ----- Card Number: Auto-format with spaces -----
            $('#cardNum').on('input', function () {
                let value = $(this).val().replace(/\D/g, ''); // Remove non-digits
                value = value.substring(0, 19); // Max 19 digits

                // Add space every 4 digits
                let formatted = '';
                for (let i = 0; i < value.length; i++) {
                    if (i > 0 && i % 4 === 0) {
                        formatted += ' ';
                    }
                    formatted += value[i];
                }

                $(this).val(formatted);
                self.clearError($(this));
            });

            $('#cardNum').on('blur', function () {
                const value = $(this).val().replace(/\s/g, ''); // Remove spaces for validation
                if (value.length > 0 && !self.patterns.cardNumber.test($(this).val())) {
                    self.showError($(this), 'Please enter a valid card number (13-19 digits)');
                }
            });

            // ----- Expiry Date: Auto-format MM/YY -----
            $('#expiry').on('input', function () {
                let value = $(this).val().replace(/\D/g, ''); // Remove non-digits
                value = value.substring(0, 4); // Max 4 digits (MMYY)

                // Auto-add slash after MM
                if (value.length >= 2) {
                    value = value.substring(0, 2) + '/' + value.substring(2);
                }

                $(this).val(value);
                self.clearError($(this));
            });

            $('#expiry').on('blur', function () {
                const value = $(this).val();
                if (value.length > 0) {
                    if (!self.patterns.expiry.test(value)) {
                        self.showError($(this), 'Please enter a valid date (MM/YY)');
                    } else if (self.isExpired(value)) {
                        self.showError($(this), 'This card has expired');
                    }
                }
            });

            // ----- CVV: Only digits, max 4 -----
            $('#cvv').on('input', function () {
                let value = $(this).val().replace(/\D/g, ''); // Remove non-digits
                value = value.substring(0, 4); // Max 4 digits
                $(this).val(value);
                self.clearError($(this));
            });

            $('#cvv').on('blur', function () {
                const value = $(this).val();
                if (value.length > 0 && !self.patterns.cvv.test(value)) {
                    self.showError($(this), 'CVV must be 3 or 4 digits');
                }
            });
        },

        // Check if expiry date is in the past
        isExpired: function (expiry) {
            const match = expiry.match(this.patterns.expiry);
            if (!match) return true;

            const month = parseInt(match[1], 10);
            const year = parseInt('20' + match[2], 10); // Convert YY to 20YY

            const now = new Date();
            const currentMonth = now.getMonth() + 1; // getMonth() is 0-indexed
            const currentYear = now.getFullYear();

            // Card expires at the END of the expiry month
            if (year < currentYear) return true;
            if (year === currentYear && month < currentMonth) return true;

            return false;
        },

        // Show error message for a field
        showError: function ($input, message) {
            const $parent = $input.parent();

            // Remove existing error
            this.clearError($input);

            // Add error state
            $input.addClass('error').css('border-color', '#dc3545');
            $parent.append(`<span class="error-message" style="color: #dc3545; font-size: 0.75rem; display: block; margin-top: 0.25rem;">${message}</span>`);
        },

        // Clear error message for a field
        clearError: function ($input) {
            $input.removeClass('error').css('border-color', '#ddd');
            $input.parent().find('.error-message').remove();
        },

        // Validate all payment fields before submit
        validateAllPaymentFields: function () {
            let isValid = true;

            // Card Number
            const cardNum = $('#cardNum').val();
            if (!cardNum || !this.patterns.cardNumber.test(cardNum)) {
                this.showError($('#cardNum'), 'Please enter a valid card number');
                isValid = false;
            }

            // Expiry
            const expiry = $('#expiry').val();
            if (!expiry || !this.patterns.expiry.test(expiry)) {
                this.showError($('#expiry'), 'Please enter a valid date (MM/YY)');
                isValid = false;
            } else if (this.isExpired(expiry)) {
                this.showError($('#expiry'), 'This card has expired');
                isValid = false;
            }

            // CVV
            const cvv = $('#cvv').val();
            if (!cvv || !this.patterns.cvv.test(cvv)) {
                this.showError($('#cvv'), 'CVV must be 3 or 4 digits');
                isValid = false;
            }

            return isValid;
        },

        renderSummary: function () {
            // Ensure Cart is loaded
            if (Cart.items.length === 0) Cart.load();

            const items = Cart.items;
            const $container = $('#checkout-items');
            $container.empty();

            if (items.length === 0) {
                // If still empty after load, redirect
                window.location.href = 'shop.html';
                return;
            }

            items.forEach(item => {
                $container.append(`
                    <div style="display: flex; gap: 1rem; margin-bottom: 1rem; align-items: center;">
                        <img src="${item.image}" alt="${item.title}" style="width: 50px; height: 60px; object-fit: contain; border: 1px solid #eee;">
                        <div style="flex-grow: 1;">
                            <p style="font-size: 0.9rem; font-weight: 500; margin: 0;">${item.title}</p>
                            <p style="font-size: 0.8rem; color: #666; margin: 0;">Size: ${item.size} x ${item.quantity}</p>
                        </div>
                        <span style="font-size: 0.9rem;">$${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                `);
            });

            // Totals
            const subtotal = Cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            // Discount Math
            let discount = 0;
            if (this.discountApplied) {
                discount = subtotal * 0.10;
                $('#checkout-discount-row').css('display', 'flex');
                $('#checkout-discount').text(`-$${discount.toFixed(2)}`);
            } else {
                $('#checkout-discount-row').hide();
            }

            const shipping = subtotal > 60 ? 0 : 4.99;
            const total = subtotal - discount + shipping;

            $('#checkout-subtotal').text(`$${subtotal.toFixed(2)}`);
            $('#checkout-shipping').text(shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`);
            $('#checkout-total').text(`$${total.toFixed(2)}`);
        }
    };

    // ==========================================================================
    // Confirmation Logic
    // ==========================================================================
    const Confirmation = {
        init: function () {
            if (!$('body').hasClass('page-confirmation')) return;

            // Generate Random Order ID
            const orderId = 'SVO-' + Math.floor(100000 + Math.random() * 900000);
            $('#order-id').text('#' + orderId);

            // Clear Cart
            Cart.clear();
        }
    };

    // ==========================================================================
    // Newsletter Logic
    // ==========================================================================
    const Newsletter = {
        init: function () {
            // Check if already closed or subscribed
            if (localStorage.getItem('svo_newsletter_closed')) return;

            // Inject HTML
            $('body').append(`
                <div class="newsletter-overlay" id="newsletter-popup">
                    <div class="newsletter-modal">
                        <button class="newsletter-close">&times;</button>
                        <div id="newsletter-content">
                            <h3 class="newsletter-title">Join the Club</h3>
                            <p class="newsletter-desc">Subscribe to our newsletter and get <strong>10% OFF</strong> your first order.</p>
                            <form class="newsletter-form">
                                <input type="email" placeholder="Enter your email" required>
                                <button type="submit" class="btn btn-black">Get Code</button>
                            </form>
                        </div>
                    </div>
                </div>
            `);

            // Events
            const $popup = $('#newsletter-popup');
            const $close = $('.newsletter-close');
            const $form = $('.newsletter-form');

            // Show after 3 seconds
            setTimeout(() => {
                $popup.addClass('active');
            }, 3000);

            // Close Logic
            $close.on('click', () => {
                $popup.removeClass('active');
                localStorage.setItem('svo_newsletter_closed', 'true');
            });

            // Submit Logic
            $form.on('submit', (e) => {
                e.preventDefault();
                // Simulate success
                $('#newsletter-content').html(`
                    <h3 class="newsletter-title">Welcome!</h3>
                    <p class="newsletter-desc">Here is your discount code:</p>
                    <div class="newsletter-success-code">WELCOME10</div>
                    <p style="font-size: 0.8rem; margin-top: 1rem; color: #666;">Code copied to clipboard logic would go here</p>
                    <button class="btn btn-black btn-full newsletter-close-btn" style="margin-top: 1rem;">Start Shopping</button>
                `);

                // Mark as done so it doesn't show again (or maybe keep it shown? No, user closes it)
                localStorage.setItem('svo_newsletter_closed', 'true');

                // Bind new close button
                $('.newsletter-close-btn').on('click', () => {
                    $popup.removeClass('active');
                });
            });
        }
    };

    // ==========================================================================
    // Animations Module
    // ==========================================================================
    const Animations = {
        revealObserver: null,

        init: function () {
            this.createObserver();
            this.addRevealClasses();
            this.observeElements();
            // this.initParallax(); // Disabled - removed per user request
            // this.initRippleEffect(); // Disabled - removed per user request
            this.initPageTransition();
            this.initSectionHeaders();
        },

        // Create the Intersection Observer once
        createObserver: function () {
            this.revealObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('active');
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -30px 0px'
            });
        },

        // Add reveal classes to existing elements
        addRevealClasses: function () {
            // Products grid gets staggered animation
            $('.products-grid, .collections-grid').addClass('reveal-stagger');

            // Product cards get individual reveal
            $('.product-card').addClass('reveal');

            // Collection cards
            $('.collection-card').addClass('reveal-scale');

            // Sections get reveal animation
            $('.statement, .about-container, .about-grid').addClass('reveal');

            // About pillars get left reveal
            $('.about-pillars').addClass('reveal-left');

            // Footer gets reveal
            $('.footer-content').addClass('reveal');

            // Featured products section
            $('.featured-products').addClass('reveal');
        },

        // Observe all reveal elements
        observeElements: function () {
            if (!this.revealObserver) return;

            document.querySelectorAll('.reveal, .reveal-stagger, .reveal-left, .reveal-right, .reveal-scale, .section-header').forEach(el => {
                this.revealObserver.observe(el);
            });
        },

        // Re-observe dynamic content (call after products load)
        observeNewElements: function () {
            // Add classes to new product cards
            $('.product-card:not(.reveal)').addClass('reveal');
            $('.collection-card:not(.reveal-scale)').addClass('reveal-scale');

            // Observe new elements
            this.observeElements();
        },

        // Parallax Effect for Hero
        initParallax: function () {
            const $hero = $('.hero');
            if ($hero.length === 0) return;

            $(window).on('scroll', function () {
                const scrolled = $(window).scrollTop();
                const heroHeight = $hero.outerHeight();

                // Only apply parallax when hero is visible
                if (scrolled < heroHeight) {
                    const parallaxValue = scrolled * 0.4;
                    $hero.css('background-position', `center ${parallaxValue}px`);

                    // Also fade out hero content slightly
                    const opacity = 1 - (scrolled / heroHeight) * 0.5;
                    $('.hero-content').css('opacity', Math.max(opacity, 0.5));
                }
            });
        },

        // Ripple Effect on Buttons
        initRippleEffect: function () {
            $(document).on('click', '.btn', function (e) {
                const $btn = $(this);

                // Remove existing ripples
                $btn.find('.ripple').remove();

                // Calculate ripple position
                const rect = this.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                // Create ripple element
                const $ripple = $('<span class="ripple"></span>');
                $ripple.css({
                    left: x + 'px',
                    top: y + 'px',
                    width: '20px',
                    height: '20px'
                });

                $btn.append($ripple);

                // Remove ripple after animation
                setTimeout(() => {
                    $ripple.remove();
                }, 600);
            });
        },

        // Page Transition Effect
        initPageTransition: function () {
            // Add page transition class to main content
            $('main').addClass('page-transition');
        },

        // Section Headers Animation
        initSectionHeaders: function () {
            // Trigger section headers immediately if visible
            setTimeout(() => {
                $('.section-header').each(function () {
                    const rect = this.getBoundingClientRect();
                    if (rect.top < window.innerHeight) {
                        $(this).addClass('active');
                    }
                });
            }, 500);
        },

        // Skeleton Loading Helper
        showSkeleton: function ($container, count = 4) {
            let skeletonHTML = '';
            for (let i = 0; i < count; i++) {
                skeletonHTML += `
                    <div class="product-card skeleton-wrapper">
                        <div class="skeleton skeleton-card"></div>
                        <div class="product-info" style="padding-top: 1rem;">
                            <div class="skeleton skeleton-text"></div>
                            <div class="skeleton skeleton-text short"></div>
                        </div>
                    </div>
                `;
            }
            $container.html(skeletonHTML);
        },

        // Counter Animation for Prices
        animateCounter: function ($el, target, duration = 1000) {
            const startVal = 0;
            const startTime = performance.now();

            function updateCounter(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Easing function
                const easeOut = 1 - Math.pow(1 - progress, 3);
                const currentValue = startVal + (target - startVal) * easeOut;

                $el.text('$' + currentValue.toFixed(2));

                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                }
            }

            requestAnimationFrame(updateCounter);
        },

        // Text Reveal Helper (wrap words in spans)
        prepareTextReveal: function ($el) {
            const text = $el.text();
            const words = text.split(' ');
            $el.empty();

            words.forEach((word, i) => {
                $el.append($('<span></span>').text(word + ' '));
            });
        }
    };

    // ==========================================================================
    // Initialize
    // ==========================================================================
    fetchProducts();
    initProductDetail();
    initCollection();
    Cart.init();
    Cart.initDropdown(); // Initialize dropdown
    Checkout.init();
    Confirmation.init();
    Newsletter.init();
    Animations.init(); // Initialize animations

    console.log('SVO STUDIO loaded successfully');
});
