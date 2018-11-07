/*  Theme Name: Xaino - Responsive Bootstrap 4 Landing Template
    Author: Saptavarana
    Version: 1.0.0
    Created:September 2018
    File Description:Main Css file of the template
*/

(function($) {

    'use strict';

    function initNavbarStickey() {
        $(window).on('scroll', function() {
            var scroll = $(window).scrollTop();

            if (scroll >= 50) {
                $(".sticky").addClass("stickyadd");
            } else {
                $(".sticky").removeClass("stickyadd");
            }
        });
    }

    function initSmoothLink() {
        $('.navbar-nav a, .scroll_down a').on('click', function(event) {
            var $anchor = $(this);
            $('html, body').stop().animate({
                scrollTop: $($anchor.attr('href')).offset().top - 0
            }, 1500, 'easeInOutExpo');
            event.preventDefault();
        });
    }

    function initScrollspy() {
        try {
            $("#navbarCollapse").scrollspy({
                offset: 20
            });
        } catch (e) {}
    }

    function initTesti() {

        $("#owl-demo").owlCarousel({
            autoPlay: 3000,
            items: 1,
            itemsDesktop: [1199, 1],
            itemsDesktopSmall: [979, 2]

        });
    }

    function initMfpvideo() {
        $('.img-zoom').magnificPopup({
            type: 'image',
            closeOnContentClick: true,
            mainClass: 'mfp-fade',
            gallery: {
                enabled: true,
                navigateByImgClick: true,
                preload: [0, 1]
            }
        });

        $('.features_video').magnificPopup({
            disableOn: 700,
            type: 'iframe',
            mainClass: 'mfp-fade',
            removalDelay: 160,
            preloader: false,
            fixedContentPos: false
        });
    }

    function initCounter() {
        var a = 0;
        $(window).on('scroll', function() {
            var oTop = $('#counter').offset().top - window.innerHeight;
            if (a == 0 && $(window).scrollTop() > oTop) {
                $('.counter_value').each(function() {
                    var $this = $(this),
                        countTo = $this.attr('data-count');
                    $({
                        countNum: $this.text()
                    }).animate({
                        countNum: countTo
                    }, {
                        duration: 2000,
                        easing: 'swing',
                        step: function() {
                            $this.text(Math.floor(this.countNum));
                        },
                        complete: function() {
                            $this.text(this.countNum);
                            //alert('finished');
                        }

                    });
                });
                a = 1;
            }
        });
    }

    function initFormSubmit() {
        $(".corp_form_custom .alert").hide();
        $("#contact-form").submit(function (e) {
            e.preventDefault();
            $("#contact-form button").attr("disabled", "disabled");
            var message = $("#message").val();
            var firstName = $("#first-name").val();
            var lastName = $("#last-name").val();
            var email = $("#email").val();
            $.ajax({
                type: "POST",
                url: "https://hooks.zapier.com/hooks/catch/4015857/e8ujt7/",
                data: {
                    message: message,
                    firstName: firstName,
                    lastName: lastName,
                    email: email
                },
                success: function () {
                    $("#contact-form").hide();
                    $(".corp_form_custom .alert").show();
                },
                dataType: "json"
            });
        });
    }

    function init() {
        initNavbarStickey();
        initSmoothLink();
        initScrollspy();
        initTesti();
        initMfpvideo();
        initFormSubmit();

        // Event tracking
        if (window.NODE_ENV === "production") {
            amplitude.getInstance().logEvent('HOME_PAGE_VIEW');
        }
    }
    init();

})(jQuery)