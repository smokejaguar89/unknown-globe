/*eslint-disable no-else-return */
class GoogleTagManagerHelper {

  constructor() {
    this.event;
    this.params;
  }
  
  fireTag() {
    dataLayer.push(this.params);
    dataLayer.push({'event' : this.event });
  }
}

class HttpHelper {

  constructor() {
    this.xhr = new XMLHttpRequest();
  }

  /**
   * Builds query string.
   * @param {object} data Data to construct into query string.
   * @return {string} Query string.
   */
  buildQueryString(data) {
    if (Object.keys(data).length > 0) {
      return '?' + Object.keys(data).map(function(key) {
        return [key, data[key]].map(encodeURIComponent).join("=");
      }).join("&");
    } else {
      return "";
    }
  }

  /**
   * Makes GET request.
   * @param {string} url URL to make GET request to.
   * @param {object} params Data to construct query string.
   * @return {object} JSON response from server.
   */
  get(url, params={}) {
    return new Promise((resolve, reject) => {
      let completedUri = url + this.buildQueryString(params);
    	
      this.xhr.open("GET", completedUri, true);
      this.xhr.onreadystatechange = function() {
        if (this.readyState === 4 && this.status >= 200) {
          resolve(JSON.parse(this.response));
        }
      };
      this.xhr.onerror = () => {
        reject({
          status: this.status,
          statusText: this.statusText
        });
      };
      this.xhr.send();
    });
  }
}

class PostHelper {
	
  constructor() {
    this.currentPost;
    this.snippets;
  }

  /**
   * Gets all posts from API.
   * @param {object} params Parameters to be sent in GET query string.
   * @return {Array<Post>} Posts returned from API.
   */
  getPosts(params={}) {
    if (typeof this.snippets !== 'undefined') {
      return new Promise((resolve) => {
        resolve(this.snippets);
      });
    } else {
      let BASE_URI = 'https://unknown-globe.appspot.com/getposts/';

      return new Promise((resolve, reject) => {
        let httpHelper = new HttpHelper();
        httpHelper.get(BASE_URI, params)
          .then((resp) => {
            resolve(resp.message);
          })
          .catch((e) => {
            reject(e);
          });
      });
    }
  }

  /**
   * Gets post by ID from API.
   * @param {number} id ID to select post.
   * @return {Post} Post returned from API.
   */
  getPostById(id) {
    let BASE_URI = 'https://unknown-globe.appspot.com/getpost/';
    let params = { 'id' : id };
  	
    return new Promise((resolve, reject) => {
      let httpHelper = new HttpHelper();
      httpHelper.get(BASE_URI, params)
        .then((resp) => {
          resolve(resp.message);
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  /**
   * Converts UNIX timestamp to human-readable format.
   * @param {number} timestamp UNIX timestamp.
   * @return {string} Time in human-readable format.
   */
  timeConverter(timestamp) {
    let a = new Date(timestamp);
    let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let year = a.getFullYear();
    let month = months[a.getMonth()];
    let date = a.getDate();
    let formattedTime = date + ' ' + month + ' ' + year;
    return formattedTime;
  }

  /** 
   * Toggles loading animation.
   */
  toggleLoader() {
    let globeIcon = document.getElementById('globe-icon');
    let spinner = document.getElementById('spinner');
    
    if (globeIcon.style.display === 'none') {
      globeIcon.style.display = 'block';
      spinner.style.display = 'none';
    } else {
      globeIcon.style.display = 'none';
      spinner.style.display = 'block';
    }
  }

  /**
   * Moves item at position <pivot> to beginning of array <postSnippets> and orders
   *  remaining posts by date
   * @param {Array<PostSnippet>} postSnippets Post snippets to be shuffled.
   * @param {number} pivot Position of the post to move to front of postSnippets.
   * @return {Array<PostSnippet>} Shuffled post snippets.
   */
  sortPostSnippets(postSnippets, pivot) {
    let alpha = postSnippets[pivot];
    postSnippets.splice(pivot, 1);
    postSnippets.sort((a, b) => {
      return b.data.date - a.data.date;
    });
    postSnippets.splice(0, 0, alpha);
    return postSnippets;
  }
  
  /**
   * Takes posts as input and builds cards from their content.
   * @param {Array<Post>} posts Posts.
   * @return {string} Cards as string of HTML.
   */
  buildCards(posts) {
    let cardsHtml = [];

    for (this.i = 0; this.i < posts.length; this.i++) {

      /**
       * Creates Post Snippet object.
       */
      let currentPost = new PostSnippet(
        posts[this.i].id,
        posts[this.i].data.date,
        posts[this.i].data.dateString,
        posts[this.i].data.image,
        posts[this.i].data.title,
        posts[this.i].data.category
      );

      if (this.i === 0) {
        cardsHtml.push('<div class="card alpha depth-2" id="alpha" style="z-index:' + posts.length.toString() + '" postId=' + currentPost.id + '>');
        cardsHtml.push('<div class="card-title-container"><div class="card-title">' + currentPost.title);
        cardsHtml.push('<div class="card-subtitle">' + currentPost.category + '</div></div>');
        cardsHtml.push('<div class="date">' + currentPost.dateString + '</div></div>');
        cardsHtml.push('<div class="card-img" style="background-image: url(\'/assets/' + currentPost.image + '\')"><div class="card-img-overlay"></div></div>');
        cardsHtml.push('<div class="card-footer">');
        cardsHtml.push('<div class="lang" lang="en">ENGLISH</div>');
        cardsHtml.push('<div class="lang" lang="pl">POLSKI</div>');
        cardsHtml.push('<div class="lang" lang="pt">PORTUGUÊS</div>');
        cardsHtml.push('</div></div>');
      } else {
        cardsHtml.push('<div class="card beta depth-1" style="z-index:' + (posts.length - this.i).toString() + '" postId=' + currentPost.id +'>');
        cardsHtml.push('<div class="card-title-container">');
        cardsHtml.push('<div class="img-ball depth-1" style="background-image:url(\'/assets/' + currentPost.image +'\')"></div>');
        cardsHtml.push('<div class="card-title">' + currentPost.title);
        cardsHtml.push('<div class="card-subtitle">' + currentPost.category + '</div></div>');
        cardsHtml.push('<div class="date">' + currentPost.dateString + '</div></div></div>');
      }
    }

    return cardsHtml.join("");
  }

  /**
   * Prints cards on page and assigns event listeners.
   * @param {string} cards String to print on page.
   */
  layCards(cards) {
    let cardContainer = document.getElementById('stack');
    cardContainer.innerHTML = cards;
  }
  
  /**
   * Adds click event listeners to cards in the stack.
   */
  addEventListeners() {
    let laidCards = document.getElementsByClassName('card');

    for (this.i = 0; this.i < laidCards.length; this.i++) {
      let laidCard = laidCards[this.i];
      let cardIndex = this.i;
      let postId = laidCard.getAttribute('postId');
      let self = this;

      if (cardIndex === 0) {
        let langChoices = document.getElementsByClassName('lang');
        for (this.j = 0; this.j < langChoices.length; this.j++) {
          let langChoice = langChoices[this.j];
          
          langChoice.addEventListener('click', function() {
            self.loadPost(postId, langChoice.getAttribute('lang'), cardIndex);
          });
        }
      } else {
        laidCard.addEventListener('click', function() {
          self.loadPost(postId, 'en', cardIndex);
        });
      }
    }
  }

  /**
   * Prints post on page.
   * @param {Post} post Post to print on page.
   * @param {string} lang Language of content to print on page.
   */
  printPost(post, lang) {
    let titleDiv = document.getElementById('post-title');
    let contentDiv = document.getElementById('post-content');

    titleDiv.innerHTML = post.getTitle();
    contentDiv.innerHTML = post.getContentByLanguage(lang);
  }

  /**
   * Loads selected post and prints on to page. Sorts post snippets.
   * @param {number} id ID of post to retrieve.
   * @param {string} lang Language of content to print.
   * @param {number} pivot Position of the chosen post in the array of posts.
   */
  loadPost(id, lang, pivot) {
    this.toggleLoader();
    
    Promise.all([this.getPostById(id), this.getPosts()])
      .then((resp) => {
        let post = resp[0];
        let posts = resp[1];
        
        // Assigns retrieved post to member variable currentPost
      	this.currentPost = new Post(
          post.id,
          post.data.date,
          post.data.dateString,
          post.data.image,
          post.data.title,
          post.data.category,
          post.data.content
        );

        // Fires GTM tag
        let googleTagManagerHelper = new GoogleTagManagerHelper();
        googleTagManagerHelper.event = 'post';
        googleTagManagerHelper.params = {
          postId : this.currentPost.id,
          postTitle : this.currentPost.title,
          postLanguage : lang
        };
        googleTagManagerHelper.fireTag();
        
        // Prints post on page
        this.printPost(this.currentPost, lang);

        // Post Snippets
        this.snippets = posts;
      	let cards = this.buildCards(this.sortPostSnippets(this.snippets, pivot));
      	this.layCards(cards);
      	this.addEventListeners(cards);
      	this.toggleLoader();
      })
      .catch((e) => {
      	this.toggleLoader();
      	console.log(e);
      });
  } 
}
