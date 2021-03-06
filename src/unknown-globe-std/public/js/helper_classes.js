/*eslint-env browser */

/**
 * Error handler class to show externally friendly error messages.
 */
class ErrorHandler extends Error {
  /**
   * @param {status} HTTP response status.
   * @param {message} Error message.
   */
  constructor(status, message) {
    super();
    this.name = status;
    this.message = message;
  }

  /**
   * Displays external error message for three seconds.
   */
  displayError() {
    let errorContainer = document.getElementById('error');
    errorContainer.innerHTML = this.message;
    errorContainer.style.display = 'block';
    
    window.setTimeout(function() {
      errorContainer.style.display = 'none';
    }, 3000);
  }
}

/**
 * Class containing static functions for UI manipulation.
 */
class UiHelper {  
  /** 
   * Toggles loading animation.
   */
  static toggleLoader() {
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
   * Toggles post title in the nav-bar.
   */
  static toggleHeaderPostTitle() {
  	let headerPostTitle = document.getElementById('header-post-title');
  	
  	if(window.scrollY > 440) {
  	  headerPostTitle.style.display = "inline";
  	} else {
  	  headerPostTitle.style.display = "none";
  	}
  }
}

/**
 * Class to help with tag firing events.
 */
class GoogleTagManagerHelper {  
  /**
   * Fires tag by pushing event into global data layer.
   * @param {event} event Event name to trigger tag.
   * @param {object} params Parameters to include in network request.
   */
  static fireTag(event, params={}) {
    dataLayer.push(params);
    dataLayer.push({'event' : event });
  }
}

/**
 * Class to help with HTTP requests.
 */
class HttpHelper {
  /**
   * Builds query string.
   * @param {object} data Data to construct into query string.
   * @return {string} Query string.
   */
  static _buildQueryString(data) {
    if (Object.keys(data).length > 0) {
      return '?' + Object.keys(data).map(function(key) {
        return [key, data[key]].map(encodeURIComponent).join("=");
      }).join("&");
    }

    return "";
  }

  /**
   * Builds URI to make request.
   * @param {string} base Base URI (domain).
   * @param {string} action URI path.
   * @param {object} params Query string parameters.
   * @return {string} Finalised URL.
   */
  static buildUri(base, action, params={}) {
  	let path = action + '/';

  	if('id' in params) {
  	  path += params['id'];
  	  delete params['id'];
  	}

    return base + '/' + path + HttpHelper._buildQueryString(params);
  }

  /**
   * Makes GET request.
   * @param {string} uri URL to make GET request to (including query string).
   * @return {Promise} JSON response from server.
   */
  static get(uri) {
    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest();
      xhr.open("GET", uri);
      xhr.setRequestHeader('Cache-Control', 'public');
      xhr.setRequestHeader('Cache-Control', 'max-age=86400');
      xhr.onreadystatechange = function() {
        if (this.readyState === 4 && this.status >= 200) {
          resolve(JSON.parse(this.response));
        }
      };
      xhr.onerror = () => {
      	console.log(xhr.status);
      	console.log(xhr.statusText);
        reject(new ErrorHandler(xhr.status, xhr.statusText));
      };
      xhr.send();
    });
  }
}

/**
 * Class to help with post-related operations.
 */
class PostHelper {
  constructor() {
    this.BASE_URI = 'https://unknown-globe.appspot.com';
    this.GET_POSTS = 'getposts';
    this.GET_POST = 'getpost';	
    this.currentPost;
    this.postSnippets;
  }

  /**
   * Gets all posts from API.
   * @param {object} params Parameters to be sent in GET query string.
   * @return {Array<Post>} Posts returned from API.
   */
  getPosts(params={}) {
    if (typeof this.postSnippets !== 'undefined') {
      return new Promise((resolve) => {
        resolve(this.postSnippets);
      });
    }

    let uri = HttpHelper.buildUri(this.BASE_URI, this.GET_POSTS, params);

    return new Promise((resolve, reject) => {
      HttpHelper.get(uri)
        .then((resp) => {	
          resolve(resp.message.map((item) => {
            return new PostSnippet(
              item.id,
              item.data.date,
              item.data.date_string,
              item.data.image,
              item.data.title,
              item.data.category
            );
          }));
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  /**
   * Gets post by ID from API.
   * @param {number} id ID to select post.
   * @return {Post} Post returned from API.
   */
  getPostById(id) {
  	if(typeof this.currentPost !== "undefined" && this.currentPost.id === id) {
  	  return new Promise((resolve) => {
  	    resolve(this.currentPost);
  	  });
  	}
  	
    let uri = HttpHelper.buildUri(this.BASE_URI, this.GET_POST, { 'id' : id });

    return new Promise((resolve, reject) => {
      HttpHelper.get(uri)
        .then((resp) => {
            resolve(new Post(
              resp.message.id,
              resp.message.data.date,
              resp.message.data.date_string,
              resp.message.data.image,
              resp.message.data.title,
              resp.message.data.category,
              resp.message.data.content
            ));
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  /**
   * Moves item at position <pivot> to position 0 of array <postSnippets> and orders
   *  remaining posts by date in descending order.
   * @param {Array<PostSnippet>} postSnippets Post snippets to be shuffled.
   * @param {number} pivot Position of the post to move to position 0 of <postSnippets>.
   * @return {Array<PostSnippet>} Shuffled post snippets.
   */
  sortPostSnippets(postSnippets, pivot) {
    let alpha = postSnippets[pivot];
    postSnippets.splice(pivot, 1);
    postSnippets.sort((a, b) => {
      return b.date - a.date;
    });
    postSnippets.splice(0, 0, alpha);
    return postSnippets;
  }

  /**
   * Takes posts as input and builds cards from their content.
   * @param {Array<PostSnippet>} postSnippets Post Snippets from which to build cards.
   * @return {string} Cards as string of HTML.
   */
  buildCardsFromPostSnippets(postSnippets) {
    let cardsHtml = [];

    for (this.i = 0; this.i < postSnippets.length; this.i++) {
      let currentPost = postSnippets[this.i];

      if (this.i === 0) {
        cardsHtml.push('<div class="card alpha depth-2" id="alpha" style="z-index:' + postSnippets.length.toString() + '" postId=' + currentPost.id + '>');
        cardsHtml.push('<div class="card-title-container"><div class="card-title">' + currentPost.title);
        cardsHtml.push('<div class="card-subtitle">' + currentPost.category + '</div></div>');
        cardsHtml.push('<div class="date">' + currentPost.dateString + '</div></div>');
        cardsHtml.push('<div class="card-img" style="background-image: url(\'/assets/' + currentPost.image + '\')"></div>');
        cardsHtml.push('<div class="card-footer">');
        cardsHtml.push('<div class="lang" lang="en">ENGLISH</div>');
        cardsHtml.push('<div class="lang" lang="pl">POLSKI</div>');
        cardsHtml.push('<div class="lang" lang="pt">PORTUGUÊS</div>');
        cardsHtml.push('</div></div>');
      } else {
        cardsHtml.push('<div class="card beta depth-1" style="z-index:' + (postSnippets.length - this.i).toString() + '" postId=' + currentPost.id +'>');
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
   * @param {string} selectedLanguage Language of content to print on page.
   */
  printPost(post, selectedLanguage) {
  	let headerPostTitleDiv = document.getElementById('header-post-title');
    let postTitleDiv = document.getElementById('post-title');
    let postContentDiv = document.getElementById('post-content');

    headerPostTitleDiv.innerHTML = post.getTitle();
    postTitleDiv.innerHTML = post.getTitle();
    postContentDiv.innerHTML = post.getContentByLanguage(selectedLanguage);
  }

  /**
   * Loads selected post and prints on to page. Sorts post snippets.
   * @param {number} id ID of post to retrieve.
   * @param {string} selectedLanguage Language of content to load.
   * @param {number} pivot Current position of selected post in snippet array.
   */
  loadPost(id, selectedLanguage, pivot) {
    UiHelper.toggleLoader();

    Promise.all([this.getPostById(id), this.getPosts()])
      .then((resp) => {
      	this.currentPost = resp[0];
        this.postSnippets = resp[1];

        // Fires Google Analytics tag via GTM
        let event = 'post';
        let params = {
          postId : this.currentPost.id,
          postTitle : this.currentPost.title,
          postLanguage : selectedLanguage
        };

        console.log("Tag fired?");
        GoogleTagManagerHelper.fireTag(event, params);
        
        // Prints post on page
        this.printPost(this.currentPost, selectedLanguage);

        // Assembles and lays cards for each post snippet
        let sortedPostSnippets = this.sortPostSnippets(this.postSnippets, pivot);
      	let cards = this.buildCardsFromPostSnippets(sortedPostSnippets);
      	this.layCards(cards);
      	this.addEventListeners(cards);
      	UiHelper.toggleLoader();
      })
      .catch((e) => {
      	UiHelper.toggleLoader();
      	e.displayError();
      	throw e;
      });
  }
}