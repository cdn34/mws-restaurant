let restaurants, neighborhoods, cuisines;
let map;
let markers = [];


const starIconBorder = `<path d="M22,9.24l-7.19-0.62L12,2L9.19,8.63L2,9.24l5.46,4.73L5.82,21L12,17.27L18.18,21l-1.63-7.03L22,9.24z M12,15.4l-3.76,2.27
l1-4.28l-3.32-2.88l4.38-0.38L12,6.1l1.71,4.04l4.38,0.38l-3.32,2.88l1,4.28L12,15.4z"/>`;
const starIconFill = `<path d="M12,17.27L18.18,21l-1.64-7.03L22,9.24l-7.19-0.61L12,2L9.19,8.63L2,9.24l5.46,4.73L5.82,21L12,17.27z"/>`;

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
  const mapElement = document.querySelector("#map-container");
  const currentDisplay = mapElement.style.display;
  if (currentDisplay === "block") mapElement.style.display = "none";
  else mapElement.style.display = "block";
};

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
  let elementsString = "";
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
  const starIcon = restaurant.is_favorite === true || restaurant.is_favorite === 'true'
    ? starIconFill
    : starIconBorder;

  const el = `
    <li role="listitem">
      <img 
        class="restaurant-img" 
        data-src="${DBHelper.imageUrlForRestaurant(restaurant)}"
        alt="${DBHelper.imageUrlForRestaurant(restaurant)}"
      />
      <h3>${restaurant.name}</h3>
      <p>${restaurant.address}</p>
      <div class="star-button-container">
        <a 
          href="${DBHelper.urlForRestaurant(restaurant)}"
          aria-label="${"View details, " + restaurant.name}"
        >View Details</a>
        <button id="star-button-${restaurant.id}" class="star-button" aria-label="Toggle favorite" onclick="toggleFavorite(${restaurant.id})">
          <svg id="star-svg-${restaurant.id}" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="24px"height="24px" viewBox="0 0 24 24" enable-background="new 0 0 24 24" xml:space="preserve">
            ${starIcon}
          </svg>
        </button>
      </div>
    </li>`;
  return el;

};

const toggleFavorite = async id => {
  //Get restaurant data from idb
  const restaurant = await Idb.get('restaurants', id);
  const starButton = document.querySelector(`#star-button-${id}`);
  const starSvg = document.querySelector(`#star-svg-${id}`);
  const starIcon = restaurant.is_favorite === true || restaurant.is_favorite === 'true'
  ? starIconBorder
  : starIconFill;

  // Update svg right away
  // Disable button to prevent multiple clicks while the request occurs
  starSvg.innerHTML = starIcon;
  starButton.setAttribute('disabled', true);

  const newFavorite = restaurant.is_favorite === true || restaurant.is_favorite === 'true'
    ? false
    : true;

  try {
    //Updates record on the server
    const response = await fetch(`http://localhost:1337/restaurants/${id}/`, {
      method:"PUT",
      body:new URLSearchParams({ is_favorite: newFavorite })
    }).then(res => res.json());
    
    //Updates record in idb
    await Idb.insert('restaurants', [response]);
    starButton.removeAttribute('disabled');

  } catch(error) {
    console.log("error: ", error);
    // Revert back to the original svg path in case of failure
    starButton.removeAttribute('disabled');
    const starIcon = restaurant.is_favorite === true || restaurant.is_favorite === 'true'
      ? starIconFill
      : starIconBorder;
    document.querySelector(`#star-svg-${id}`).innerHTML = starIcon;
  }
}
