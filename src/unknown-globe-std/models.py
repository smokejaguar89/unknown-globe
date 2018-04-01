import time
import datetime

from google.appengine.ext import ndb

class Post(ndb.Model):
    date = ndb.DateProperty()
    image = ndb.StringProperty()
    title = ndb.StringProperty()
    category = ndb.IntegerProperty()
    en = ndb.StringProperty()
    pl = ndb.StringProperty()
    pt = ndb.StringProperty()
    
class PostHelper(object):
    """ Helps to format post data from datastore into client-friendly structure.
  
    Attributes:
        post: An object containing formatted post data.
    """
  
    def __init__(self, post):
        post_dict = post.to_dict()
        post_date = post_dict.get('date', None)
        
        self.post = {
            'id': post.key.urlsafe(),
            'data': {
                'date': int(time.mktime(post_date.timetuple())) if post_date else None,
                'date_string': str(post_date) if post_date else None,
                'title': post_dict.get('title', None),
                'image': post_dict.get('image', None),
                'category': self._category_enum_converter(post_dict.get('category', 0)),
                'content': {
                    'en': post_dict.get('en', None),
                    'pl': post_dict.get('pl', None),
                    'pt': post_dict.get('pt', None)
                }
            }
        }
        
    def _category_enum_converter(self, category_id):
        categories = {
            0: 'Unclassified',
            1: 'Thoughts',
            2: 'Travel'
        }
    
        return categories.get(category_id, "Unknown")
    
    def get_post(self):
        return self.post