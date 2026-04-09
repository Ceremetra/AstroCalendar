<?php
/**
 * Plugin Name: Wandering Astro
 * Description: Automatically displays astrological transit data and moon phase info on blog posts based on publish date.
 * Version: 1.1.0
 * Author: Wandering Islands
 * License: GPL-2.0+
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'WANDERING_ASTRO_VERSION', '1.1.0' );
define( 'WANDERING_ASTRO_URL', plugin_dir_url( __FILE__ ) );

/**
 * Register the location meta box on the post editor.
 */
function wandering_astro_add_meta_box() {
    add_meta_box(
        'wandering_astro_location',
        'Astro Location',
        'wandering_astro_meta_box_html',
        'post',
        'side',
        'default'
    );
}
add_action( 'add_meta_boxes', 'wandering_astro_add_meta_box' );

/**
 * Render the meta box HTML.
 */
function wandering_astro_meta_box_html( $post ) {
    wp_nonce_field( 'wandering_astro_location', 'wandering_astro_nonce' );
    $location = get_post_meta( $post->ID, '_wandering_astro_location', true );
    $lat      = get_post_meta( $post->ID, '_wandering_astro_lat', true );
    $lon      = get_post_meta( $post->ID, '_wandering_astro_lon', true );
    ?>
    <p>
        <label for="wandering_astro_location"><strong>Location</strong></label><br>
        <input type="text" id="wandering_astro_location" name="wandering_astro_location"
               value="<?php echo esc_attr( $location ); ?>"
               style="width:100%;" placeholder="e.g. Bali, Indonesia" />
    </p>
    <?php if ( $lat && $lon ) : ?>
        <p class="description">
            Coordinates: <?php echo esc_html( $lat ); ?>, <?php echo esc_html( $lon ); ?>
        </p>
    <?php endif; ?>
    <p class="description">
        Enter the place this post was written from. Coordinates are resolved automatically on save.
    </p>
    <?php
}

/**
 * Save the location meta and geocode it.
 */
function wandering_astro_save_meta( $post_id ) {
    if ( ! isset( $_POST['wandering_astro_nonce'] ) ||
         ! wp_verify_nonce( $_POST['wandering_astro_nonce'], 'wandering_astro_location' ) ) {
        return;
    }
    if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
        return;
    }
    if ( ! current_user_can( 'edit_post', $post_id ) ) {
        return;
    }

    $location = isset( $_POST['wandering_astro_location'] )
        ? sanitize_text_field( $_POST['wandering_astro_location'] )
        : '';

    update_post_meta( $post_id, '_wandering_astro_location', $location );

    if ( empty( $location ) ) {
        delete_post_meta( $post_id, '_wandering_astro_lat' );
        delete_post_meta( $post_id, '_wandering_astro_lon' );
        return;
    }

    // Geocode via OpenStreetMap Nominatim
    $url = 'https://nominatim.openstreetmap.org/search?' . http_build_query( array(
        'q'      => $location,
        'format' => 'json',
        'limit'  => 1,
    ) );

    $response = wp_remote_get( $url, array(
        'headers' => array( 'User-Agent' => 'WanderingAstro/1.1 (WordPress plugin)' ),
        'timeout' => 10,
    ) );

    if ( is_wp_error( $response ) ) {
        return;
    }

    $body = json_decode( wp_remote_retrieve_body( $response ), true );

    if ( ! empty( $body[0]['lat'] ) && ! empty( $body[0]['lon'] ) ) {
        update_post_meta( $post_id, '_wandering_astro_lat', sanitize_text_field( $body[0]['lat'] ) );
        update_post_meta( $post_id, '_wandering_astro_lon', sanitize_text_field( $body[0]['lon'] ) );
    }
}
add_action( 'save_post', 'wandering_astro_save_meta' );

/**
 * Enqueue scripts and styles on single posts only.
 */
function wandering_astro_enqueue_assets() {
    if ( ! is_singular( 'post' ) ) {
        return;
    }

    wp_enqueue_style(
        'wandering-astro-css',
        WANDERING_ASTRO_URL . 'css/wandering-astro.css',
        array(),
        WANDERING_ASTRO_VERSION
    );

    wp_enqueue_script(
        'astronomy-engine',
        WANDERING_ASTRO_URL . 'js/astronomy.min.js',
        array(),
        WANDERING_ASTRO_VERSION,
        true
    );

    wp_enqueue_script(
        'wandering-astro-js',
        WANDERING_ASTRO_URL . 'js/wandering-astro.js',
        array( 'astronomy-engine' ),
        WANDERING_ASTRO_VERSION,
        true
    );
}
add_action( 'wp_enqueue_scripts', 'wandering_astro_enqueue_assets' );

/**
 * Append the astro data container to single post content.
 */
function wandering_astro_append_content( $content ) {
    if ( ! is_singular( 'post' ) || ! in_the_loop() || ! is_main_query() ) {
        return $content;
    }

    $post_id   = get_the_ID();
    $post_date = get_the_date( 'c' );
    $lat       = get_post_meta( $post_id, '_wandering_astro_lat', true );
    $lon       = get_post_meta( $post_id, '_wandering_astro_lon', true );
    $location  = get_post_meta( $post_id, '_wandering_astro_location', true );

    $attrs = 'data-date="' . esc_attr( $post_date ) . '"';
    if ( $lat && $lon ) {
        $attrs .= ' data-lat="' . esc_attr( $lat ) . '"';
        $attrs .= ' data-lon="' . esc_attr( $lon ) . '"';
    }
    if ( $location ) {
        $attrs .= ' data-location="' . esc_attr( $location ) . '"';
    }

    $astro_html = '<div class="wandering-astro-data" ' . $attrs . '>';
    $astro_html .= '<div class="wandering-astro-loading">Calculating celestial positions&hellip;</div>';
    $astro_html .= '</div>';

    return $content . $astro_html;
}
add_filter( 'the_content', 'wandering_astro_append_content' );
