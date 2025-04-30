<?php
/**
 * Plugin Name: Customización de Banderas Polylang
 * Description: Permite personalizar las banderas de Polylang.
 */

add_filter( 'pll_custom_flag', 'pgc_custom_flag', 10, 2 );
 
function pgc_custom_flag( $flag, $code ) {
    $flag['url']    = content_url( "/polylang/{$code}.svg" );
    $flag['width']  = 32;
    $flag['height'] = 22;
    $flag['src'] = '';
    return $flag;
}
?>