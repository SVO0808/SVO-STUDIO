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

            // Update Summary
            const subtotal = this.getTotal();
            const shippingThreshold = 60;
            const shippingCost = subtotal > shippingThreshold ? 0 : 4.99;
            const total = subtotal + shippingCost;

            // Selectors (assuming order of rows in HTML)
            const $subtotalRow = $('.summary-row').first();
            const $shippingRow = $('.summary-row').eq(1); // 2nd row is shipping
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
                const remaining = shippingThreshold - subtotal;
                let $msg = $('.free-shipping-msg');
                if ($msg.length === 0) {
                    $msg = $('<p class="free-shipping-msg" style="font-size: 0.8rem; color: #666; margin-top: 0.5rem; font-style: italic;"></p>');
                    $shippingRow.after($msg);
                }
                $msg.text(`Add $${remaining.toFixed(2)} more for free shipping.`); // Using $ since API is in USD defaults effectively
            }

            $totalRow.find('span:last-child').text(`$${total.toFixed(2)}`);
            $cartSummary.show();

            // Link Checkout Button
            $('.cart-summary .btn-black').off('click').on('click', function () {
                window.location.href = 'checkout.html';
            });
        },

        // ======================================================================
        // Dropdown Logic
        // ======================================================================
        initDropdown: function () {
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

            // Open on hover trigger
            $trigger.on('mouseenter', () => {
                clearTimeout(timeout);
                this.renderDropdown(); // Refresh data
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
            $(document).on('click', function (e) {
                // If click is not inside dropdown AND not on the trigger
                if (!$(e.target).closest('#cart-dropdown').length && !$(e.target).closest('.cart-link').length) {
                    $dropdown.removeClass('active');
                }
            });
        },

        renderDropdown: function () {
            const $container = $('.mini-cart-items');
            $container.empty();

            if (this.items.length === 0) {
                $container.html('<p style="color: #999; text-align: center; padding: 1rem;">Your cart is empty</p>');
                $('#mini-cart-subtotal').text('$0.00');
                $('#mini-cart-count').text('0 items');
                return;
            }

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

        openDropdown: function () {
            this.renderDropdown();
            $('#cart-dropdown').addClass('active');

            // Auto close after 3s if not hovered
            setTimeout(() => {
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
        init: function () {
            if (!$('body').hasClass('page-checkout')) return;

            this.renderSummary();

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

            $('#checkout-form').on('submit', function (e) {
                e.preventDefault();
                const $btn = $('#btn-pay');
                const originalText = $btn.text();

                $btn.prop('disabled', true).text('Processing...');

                // Simulate API call
                setTimeout(() => {
                    window.location.href = 'confirmation.html';
                }, 2000);
            });
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
            const shipping = subtotal > 60 ? 0 : 4.99;
            const total = subtotal + shipping;

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
    // Initialize
    // ==========================================================================
    fetchProducts();
    initProductDetail();
    initCollection();
    Cart.init();
    Cart.initDropdown(); // Initialize dropdown
    Checkout.init();
    Confirmation.init();

    console.log('SVO STUDIO loaded successfully');
});
