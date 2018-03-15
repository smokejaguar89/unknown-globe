/*
  Post Snippet Class
*/
class PostSnippet {
  constructor(id, date, dateString, image, title, category) {
    this.id = id;
    this.date = date;
    this.dateString = dateString;
    this.image = image;
    this.title = title;
    this.category = category;
  }

  getTitle() {
    return this.title;
  }
}

/*
  Post Class
*/
class Post extends PostSnippet {
  constructor(id, date, dateString, image, title, category, content) {
    super();
    this.id = id;
    this.date = date;
    this.dateString = dateString;
    this.image = image;
    this.title = title;
    this.category = category;
    this.content = content;
  }

  getContentByLanguage(lang) {
    return this.content[lang];
  }
}