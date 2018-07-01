window.addEventListener("load", function() {
  async function updateOnlineStatus(event) {
    const connection = navigator.onLine ? 'online' : 'offline';
    const regex = new RegExp('.*?(id=[0-9]*)','g');
    console.log(`You are now :`, connection);
    const onlineAlert = document.querySelector('#online-alert');
    if(connection === 'online') {
      onlineAlert.innerHTML = 'Online!';
      //Get all offline reviews
      const offlineReviews = await Idb.getAll('offline-reviews');
      
      offlineReviews.forEach(async element => {
        try {
          const data = new URLSearchParams();
          const elementIdbId = element.id;
          let reqStatus;
          
          delete element.id;
          
          Object.keys(element).forEach(key => data.set(key,element[key]));
          const response = await fetch('http://localhost:1337/reviews/', {
            method:"POST",
            body:data
          }).then(res => {
            reqStatus = res.status; // 201 === created
            return res.json()
          });

          if(reqStatus === 201) {
            // Remove item from iDB
            await Idb.delete('offline-reviews', elementIdbId );

            //If browser window is in the single restaurant page
            if(regex.test(window.location.href)) {
              //Update item DOM item color and id
              const reviewElement = document.querySelector(`#review-${elementIdbId}`);
              reviewElement.children[0].style.backgroundColor='';
              reviewElement.children[1].style.backgroundColor='';
              reviewElement.setAttribute('id', `review-${response.id}`)
            }
          }
        } catch(error) {
          console.log(error);
        }
      });
    } else {
      onlineAlert.innerHTML = 'Offline!';
    }

    onlineAlert.style.transform = 'none';
    setTimeout(() =>{
      onlineAlert.style.transform = '';
    },2000);
  }

  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);
});

const createReview = (review) => {
  const li = document.createElement('li');
  li.setAttribute('role', 'listitem');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.date;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}
