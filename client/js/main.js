let restaurants, neighborhoods, cuisines;
let map;
let markers = [];

// Google maps code

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };

  self.markers = [];
  self.map = new google.maps.Map(document.getElementById("map"), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });

  // requestAnimationFrame(() => {
  updateRestaurants();
  // });
};

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, "click", () => {
      window.location.href = marker.url;
    });
    // requestAnimationFrame(x =>  self.markers.push(marker));
    self.markers.push(marker);
  });
};

document.addEventListener("DOMContentLoaded", async event => {
  await DBHelper.fetchRestaurants(_ => null);
  // updateRestaurants();
  fetchNeighborhoods();
  fetchCuisines();
});

const toggleMap = () => {
  const mapElement = document.querySelector('#map-container');
  const currentDisplay = mapElement.style.display;
  if(!currentDisplay || currentDisplay === 'block')
    mapElement.style.display = 'none';
  else
    mapElement.style.display = 'block';
}

const fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) {
      // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
      // requestAnimationFrame(() => fillNeighborhoodsHTML());
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById("neighborhoods-select");
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement("option");
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
      // requestAnimationFrame(() => fillCuisinesHTML());
    }
  });
};

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById("cuisines-select");
  cuisines.forEach(cuisine => {
    const option = document.createElement("option");
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

const updateRestaurants = () => {
  const cSelect = document.getElementById("cuisines-select");
  const nSelect = document.getElementById("neighborhoods-select");

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    (error, restaurants) => {
      if (error) {
        // Got an error!
        console.error(error);
      } else {
        resetRestaurants(restaurants);
        fillRestaurantsHTML();
      }
    }
  );
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = restaurants => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById("restaurants-list");
  ul.innerHTML = "";

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
};

const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById("restaurants-list");
  let elementsString = '';
  restaurants.forEach(restaurant => {
    //filter(item => item.id === 1).
    // ul.append(createRestaurantHTML(restaurant));
    elementsString = elementsString.concat(createRestaurantHTML(restaurant));
  });
  ul.innerHTML = elementsString;
  lazyLoadImages();
  addMarkersToMap();
};

const lazyLoadImages = () => {
  // Get all of the images that are marked up to lazy load
  const images = document.querySelectorAll(".restaurant-img");
  const config = {
    // If the image gets within 50px in the Y axis, start the download.
    rootMargin: "50px 0px",
    threshold: 0.01
  };

  const onIntersection = entries => {
    // Loop through the entries
    entries.forEach(entry => {
      // Are we in viewport?
      if (entry.intersectionRatio > 0) {
        // Stop watching and load the image
        observer.unobserve(entry.target);
        entry.target.setAttribute("src", entry.target.getAttribute("data-src"));
      }
    });
  };

  // The observer for the images on the page
  let observer = new IntersectionObserver(onIntersection, config);
  images.forEach(image => {
    observer.observe(image);
  });
};

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = restaurant => {
  //   var $el = $(`
  //   <h1>Hi, my name is ${myName}</h1>
  // `);

  const el = `
    <li role="listitem">
      <img 
        class="restaurant-img" 
        data-src="${DBHelper.imageUrlForRestaurant(restaurant)}"
        alt="${DBHelper.imageUrlForRestaurant(restaurant)}"
      />
      <h3>${restaurant.name}</h3>
      <p>${restaurant.address}</p>
      <a 
        href="${DBHelper.urlForRestaurant(restaurant)}"
        aria-label="${"View details, " + restaurant.name}"
      >View Details</a>
    </li>`;
  return el;

  // const li = document.createElement('li');

  // li.setAttribute('role', 'listitem');
  // const image = document.createElement('img');
  // image.className = 'restaurant-img';
  // image.setAttribute('data-src',DBHelper.imageUrlForRestaurant(restaurant));
  // // image.src = DBHelper.imageUrlForRestaurant(restaurant);
  // image.alt = `Image of ${restaurant.name} restaurant`;
  // li.append(image);

  // const name = document.createElement('h3');
  // name.innerHTML = restaurant.name;
  // li.append(name);

  // const neighborhood = document.createElement('p');
  // neighborhood.innerHTML = restaurant.neighborhood;
  // li.append(neighborhood);

  // const address = document.createElement('p');
  // address.innerHTML = restaurant.address;
  // li.append(address);

  // const more = document.createElement('a');
  // more.innerHTML = 'View Details';
  // more.href = DBHelper.urlForRestaurant(restaurant);
  // more.setAttribute('aria-label', 'View details, '+restaurant.name);
  // li.append(more)

  // return li;
};
