let restaurant;
var map;
let reviews;

const objectId = function () {
  const timestamp = (new Date().getTime() / 1000 | 0).toString(16);
  return timestamp + 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, function() {
      return (Math.random() * 16 | 0).toString(16);
  }).toLowerCase();
};

document.addEventListener('DOMContentLoaded', event => {
  document.querySelector('input[name="restaurant_id"]').setAttribute('value', getParameterByName('id'));
});


document.forms[0].onsubmit = async(e) => {
  e.preventDefault();
  let review;
  let isOfflineReview = false;
  const formElement = document.querySelector('form');
  if(navigator.onLine){
    const params = new URLSearchParams(new FormData(formElement).entries());
    review = await fetch('http://localhost:1337/reviews/', {
      method:"POST",
      body:params
    }).then(res => res.json());
    // console.log(review);
  } else {
    review = {};
    isOfflineReview = true;
    new FormData(formElement).forEach(function(value, key){
      review[key] = value;
    });
    review.id = objectId();
    await Idb.insert('offline-reviews', [review]);
  }

  // Creates review DOM element, with normal style if was successfuly created
  // or with a red bar if created while offline
  const reviewElement = createReviewHTML(review, isOfflineReview);
  // Adds review to the document
  const ul = document.getElementById('reviews-list');
  ul.appendChild(reviewElement);

  // Clear form data
  formElement.reset();
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = async () => {
    try {
      reviews = await DBHelper.fetchReviews(getParameterByName('id'));
      const offlineReviews = await DBHelper.fetchOfflineReviews(getParameterByName('id'));
      //Gets all reviews for the restaurant (online && offline);
      reviews = reviews.concat(offlineReviews);
      if(reviews.length === 0)
        reviews = null;
    } catch(error){
      console.log('Error fetching reviews: ', error);
    }
    
    fetchRestaurantFromURL((error, restaurant) => {
      if (error) { // Got an error!
        console.error(error);
      } else {
        self.map = new google.maps.Map(document.getElementById('map'), {
          zoom: 16,
          center: restaurant.latlng,
          scrollwheel: false
        });
        fillBreadcrumb();
        DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
      }
    }); 
}

const toggleMap = () => {
  const mapElement = document.querySelector('#map-container');
  const currentDisplay = mapElement.style.display;
  if(currentDisplay === 'block')
    mapElement.style.display = 'none';
  else
    mapElement.style.display = 'block';
}


/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    const error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = `Image of ${restaurant.name} restaurant`;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = () => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  title.id = 'reviews-header';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    // Offline reviews are stored with an Object id string to idb, 
    // which is removed before they're sent to the server to be inserted
    const isOfflineReview = review.id.constructor === Number ? false : true;
    ul.appendChild(createReviewHTML(review, isOfflineReview));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = (review, isOfflineReview) => {
  const li = document.createElement('li');
  li.setAttribute('role', 'listitem');
  li.setAttribute('id', `review-${review.id}`)
  const name = document.createElement('p');
  isOfflineReview && (name.style.backgroundColor = '#ea104e');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  isOfflineReview && (date.style.backgroundColor = '#ea104e');
  date.innerHTML = review.updatedAt 
                    ? new Date(review.updatedAt).toDateString()
                    : new Date().toDateString();
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
