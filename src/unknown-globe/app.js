// [START app]
/*eslint-disable no-unused-params */
/*eslint-env node */
'use strict';

// [START setup]
const express = require('express');
const app = express();

// Import Models
const models = require('./models');
const Post = models.Post;
const PostSnippet = models.PostSnippet;

// Sets template engine
app.set('view engine', 'ejs');

app.enable('trust proxy');

// Sets path for static files
app.use(express.static('public'));

// By default, the client will authenticate using the service account file
// specified by the GOOGLE_APPLICATION_CREDENTIALS environment variable and use
// the project specified by the GOOGLE_CLOUD_PROJECT environment variable. See
// https://github.com/GoogleCloudPlatform/google-cloud-node/blob/master/docs/authentication.md
// These environment variables are set automatically on Google App Engine
const Datastore = require('@google-cloud/datastore');

// Instantiate a datastore client
const datastore = Datastore();
// [END setup]

/*
 * Returns array of posts.
 * @return {Array<Post>} All posts.
 */
function getPosts() {
  const query = datastore.createQuery('Post')
    .order('date', { descending: true });
    
  return datastore.runQuery(query)
    .then((results) => {
      const entities = results[0];
      return entities.map((entity) => {
        return new PostSnippet(
          entity[datastore.KEY].id,
          entity.date,
       	  entity.image,
      	  entity.title,
      	  entity.category
        );
      });
    });
}

/*
 * Returns post by ID.
 * @param {number} id ID of post to select.
 * @return {Post} Selected post.
 */
function getPostById(id) {
  let query = datastore.createQuery('Post')
    .filter('__key__', '=', datastore.key(['Post', id]));
    
  return datastore.runQuery(query)
    .then((results) => {
      let entity = results[0][0];
      return new Post(
        entity[datastore.KEY].id,
      	entity.date,
      	entity.image,
      	entity.title,
      	entity.category,
      	entity.en,
      	entity.pl,
      	entity.pt
      );
    });
}

/*
 * Returns latest post.
 * @return {Post} Latest post.
 */
function getLatestPost() {
  let query = datastore.createQuery('Post')
    .order('date', { descending: true })
    .limit(1);
    
  return datastore.runQuery(query)
    .then((results) => {
      let entity = results[0][0];
      return new Post(
        entity[datastore.KEY].id,
      	entity.date,
      	entity.image,
      	entity.title,
      	entity.category,
      	entity.en,
      	entity.pl,
      	entity.pt
      );
    });
}

app.get('/', (req, res) => {
  Promise.all([getLatestPost(), getPosts()])
    .then((resp) => {
      res.render('index', {
      	'latestPost': resp[0],
      	'posts': resp[1]
      });
    })
    .catch((e) => {
      console.log(e);
    });
});

app.get('/getpost', (req, res) => {
  /* If ID available, looks for post with that ID */
  if (typeof req.query.id !== "undefined") {
    getPostById(parseInt(req.query.id, 10))
      .then((post) => {
        res
          .status(200)
          .set('Content-Type', 'text/plain')
          .json(post)
          .end();
    });
  /* If ID unavailable, gets the latest post */
  } else {
    getLatestPost()
      .then((post) => {
        res
          .status(200)
          .set('Content-Type', 'text/plain')
          .json(post)
          .end();
    });
  }
});

app.get('/getposts', (req, res) => {	
  getPosts()
    .then((posts) => {
      res
        .status(200)
        .set('Content-Type', 'text/plain')
        .json(posts)
        .end();
    });
});

// [START listen]
const PORT = process.env.PORT || 8080;
app.listen(process.env.PORT || 8080, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});
// [END listen]
// [END app]

module.exports = app;