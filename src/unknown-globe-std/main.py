import webapp2
import jinja2
import os
import json
import time
import datetime
import re

from google.appengine.ext import ndb
from models import Post, PostHelper

JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
    extensions=['jinja2.ext.autoescape'],
    autoescape=True)
    
class DatastoreHelper(object):
    def get_posts(self):
        query = Post.query()
        results = query.fetch()
        return [self._build_post_obj(result) for result in results]
    
    def _build_post_obj(self, post):
        post_helper = PostHelper(post)
        return post_helper.get_post()

    def get_post(self, id=None):
        """ Fetches a post from datastore.
  
        Args:
            id: A string URL-safe post ID.
    
        Returns:
            If a valid ID is provided, returns the matching post. If the ID is invalid, 
            returns a 404 error. If no ID is provided, returns the most recent post.
        """
    
        if id:
            try:
                key = ndb.Key(urlsafe=id)
            except:
                key = None
            if key:
                post = key.get()
                post_helper = PostHelper(post)
                return post_helper.get_post()
            return None
    
        post = Post.query().order(-Post.date).get()
    
        if post:
            post_helper = PostHelper(post)
            return post_helper.get_post()
      
        return None

class MainPage(webapp2.RequestHandler):
    def get(self):
        datastore_helper = DatastoreHelper()
        template_values = {
            'post': datastore_helper.get_post(),
            'posts': datastore_helper.get_posts()
        }
    
        template = JINJA_ENVIRONMENT.get_template('views/index.html')    
        self.response.write(template.render(template_values))
        
class GetPost(webapp2.RequestHandler):
    def get(self, id):
        if self._is_valid_id(id):
            datastore_helper = DatastoreHelper()
            post = datastore_helper.get_post(id)
    
            self.response.headers['Content-Type'] = 'application/json'
   
            if post is not None:
              self.response.write(json.dumps({'message': post}))
            else:
              self.response.status = 404
              self.response.write(json.dumps({'message': "Post not found."}))
        else:
            self.response.status = 400
            self.response.write(json.dumps({'message': 'Invalid ID.'}))
          
    def _is_valid_id(self, id):
        if len(id) == 0 or (len(id) < 50 and bool(re.match(r'^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$', id))):
            return True
        return False

class GetPosts(webapp2.RequestHandler):
    def get(self):
        datastore_helper = DatastoreHelper()
        posts = datastore_helper.get_posts()
    
        self.response.headers['Content-Type'] = 'application/json'
        self.response.write(json.dumps({'message': posts}))
    
app = webapp2.WSGIApplication([
    ('/', MainPage),
    ('/getpost/(.*?)', GetPost),
    ('/getposts/', GetPosts)
], debug=True)