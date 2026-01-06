// ==========================================================================
// SVO STUDIO - Main JavaScript
// ==========================================================================

$(document).ready(function () {
    'use strict';

    // ==========================================================================
    // Mobile Navigation Toggle
    // ==========================================================================
    const $navToggle = $('#nav-toggle');
    const $navMenu = $('#nav-menu');

    $navToggle.on('click', function () {
        $(this).toggleClass('active');
        $navMenu.toggleClass('active');

        // Prevent body scroll when menu is open
        $('body').toggleClass('menu-open');
    });

    // Close menu when clicking on a link
    $('.nav-link').on('click', function () {
        $navToggle.removeClass('active');
        $navMenu.removeClass('active');
        $('body').removeClass('menu-open');
    });

    // Close menu on escape key
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
    let lastScroll = 0;

    $(window).on('scroll', function () {
        const currentScroll = $(window).scrollTop();

        // Add shadow on scroll
        if (currentScroll > 50) {
            $header.addClass('scrolled');
        } else {
            $header.removeClass('scrolled');
        }

        lastScroll = currentScroll;
    });

    // ==========================================================================
    // Products Carousel (Swiper)
    // ==========================================================================
    const productsSwiper = new Swiper('.products-swiper', {
        slidesPerView: 'auto',
        spaceBetween: 30,
        centeredSlides: false,
        grabCursor: true,
        speed: 600,

        // Navigation arrows
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },

        // Responsive breakpoints
        breakpoints: {
            320: {
                spaceBetween: 15,
            },
            768: {
                spaceBetween: 20,
            },
            1024: {
                spaceBetween: 30,
            }
        }
    });

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
    // Console Log
    // ==========================================================================
    console.log('SVO STUDIO loaded successfully');
});
