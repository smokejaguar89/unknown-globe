/*
  Post Snippet Class
*/
class PostSnippet {
  constructor(id, date, image, title, categoryId) {
  	this.id = id;
  	this.data = {
  	  date: new Date(date).getTime(),
  	  dateString: this.timeConverter(new Date(date).getTime()),
  	  image: image,
  	  title: title,
  	  category: this.getCategoryByEnum(categoryId)
  	};
  }

  getTitle() {
  	return this.title;
  }
  
  /**
   * Converts UNIX Timestamp to human-readable format.
   * @param {number} UNIX_timestamp
   * @return {string} Time in human-readable format.
   */
  timeConverter(rawTime){
    let a = new Date(rawTime);
    let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let year = a.getFullYear();
    let month = months[a.getMonth()];
    let date = a.getDate();
    let formattedTime = date + ' ' + month + ' ' + year;
    return formattedTime;
  }

  getCategoryByEnum(categoryId) {
  	let categories = {
  	  1 : 'Thoughts',
  	  2 : 'Travel',
  	  3 : 'Tech'
  	};
  	return categories[categoryId];
  }
}

/*
  Post Class
*/
class Post extends PostSnippet {
  constructor(id, date, image, title, categoryId, en, pt, pl) {
  	super();
  	this.id = id;
  	this.data = {
  	  date: new Date(date).getTime(),
  	  dateString: this.timeConverter(new Date(date).getTime()),
  	  image: image,
  	  title: title,
  	  category: this.getCategoryByEnum(categoryId),
  	  content: {
  	    'en': en,
  	    'pl': pl,
  	    'pt': pt
  	  }
  	};
  }
}

module.exports = {
  PostSnippet: PostSnippet,
  Post : Post
};