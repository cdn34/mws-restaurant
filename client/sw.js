const currentCacheName = 'mws-restaurant-2';

self.addEventListener('install', event => {
    let imgArray = []
    for(let i = 0; i < 10; i++ )
        imgArray = imgArray.concat(`img/${i+1}.jpg`);

    event.waitUntil(
        caches.open(currentCacheName).then(cache => {

            const requestCSS = new Request('https://normalize-css.googlecode.com/svn/trunk/normalize.css', {mode: 'no-cors'});
            fetch(requestCSS).then(response => cache.put(requestCSS, response));

            const requestMaps = new Request('https://maps.googleapis.com/maps/api/js?key=AIzaSyA2s2CKiGPYkP7R6UWtyBtOBXRZsf7Y5_c&libraries=places&callback=initMap', {mode: 'no-cors'});
            fetch(requestMaps).then(response => cache.put(requestMaps, response));
            
            const requestIdb = new Request('https://cdn.jsdelivr.net/npm/idb@2.1.2/lib/idb.min.js', {mode: 'no-cors'});
            fetch(requestIdb).then(response => cache.put(requestIdb, response));

            return cache.addAll([
                '/',
                'restaurant.html',
                'css/styles.css',
                'js/idb.js',
                'js/dbhelper.js',
                'js/main.js',
                'js/restaurant_info.js',
            ].concat(imgArray));
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            Promise.all(
                cacheNames.filter(cacheName => 
                    cacheName.startsWith('mws-restaurant-') && cacheName !== currentCacheName
                ).map(cacheName => caches.delete(cacheName))
            )
        })
    )
});

self.addEventListener('fetch', event => {

    const requestUrl = new URL(event.request.url);
    if(requestUrl.pathname === '/restaurant.html') {
        event.respondWith(caches.match('restaurant.html'));
        return;
    }

    event.respondWith(caches.match(event.request).then(response => {
        if(!response)
            return fetch(event.request);
        else return response;
    }));
});

