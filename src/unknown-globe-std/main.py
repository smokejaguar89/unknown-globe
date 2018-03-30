# Copyright 2016 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import webapp2
import jinja2
import os
import json
import time
import datetime
from google.appengine.ext import ndb
from models import Post, PostHelper

JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
    extensions=['jinja2.ext.autoescape'],
    autoescape=True)
    
class DatastoreHelper(object):
    def get_posts(self):
        query = Post.query().order(-Post.date)
        results = query.fetch()
        return [self._build_post_obj(result) for result in results]
    
    def _build_post_obj(self, post):
        post_helper = PostHelper(post.key.urlsafe(), post.to_dict())
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
                post_helper = PostHelper(post.key.urlsafe(), post.to_dict())
                return post_helper.get_post()
            return None
    
        post = Post.query().order(-Post.date).get()
    
        if post:
            post_helper = PostHelper(post.key.urlsafe(), post.to_dict())
            return post_helper.get_post()
      
        return None

class MainPage(webapp2.RequestHandler):
    def get(self):
        datastore_helper = DatastoreHelper()
  
        latest_post = datastore_helper.get_post()
        posts = datastore_helper.get_posts()
    
        template_values = {
            'post': latest_post,
            'posts': posts
        }
    
        template = JINJA_ENVIRONMENT.get_template('views/index.html')    
        self.response.write(template.render(template_values))
        
class GetPost(webapp2.RequestHandler):
    def get(self, id):
        datastore_helper = DatastoreHelper()
        post = datastore_helper.get_post(id)
    
        self.response.headers['Content-Type'] = 'application/json'
   
        if post is not None:
          self.response.write(json.dumps({'message': post}))
        else:
          self.response.status = 404
          self.response.write(json.dumps({'message': "Not found"}))
  
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