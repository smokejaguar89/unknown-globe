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
        id: A string URL-safe post ID.
        data: An object containing the post body data.
    """
  
    def __init__(self, id, data):
        self.id = id
        self.data = {
            'date': int(time.mktime(data['date'].timetuple())) if data['date'] else None,
            'date_string': str(data.get('date', None)),
            'title': data.get('title', None),
            'image': data.get('image', None),
            'category': self._category_enum_converter(data.get('category', 0)),
            'content': {
                'en': data.get('en', None),
                'pl': data.get('pl', None),
                'pt': data.get('pt', None)
            }
        }
    
    def _category_enum_converter(self, category_id):
        categories = {
            0: 'Unclassified',
            1: 'Thoughts',
            2: 'Travel'
        }
    
        return categories.get(category_id, None)
    
    def get_post(self):
        return {
            'id': self.id,
            'data': self.data
        }