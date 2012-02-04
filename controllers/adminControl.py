import cgi
from dataClasses import *#wildcard! import everything
from datetime import datetime
from google.appengine.ext import db, webapp
from django.utils import simplejson
import random
import logging

#use this to reset the availability of everything: use with great care!
class ResetHandler(webapp.RequestHandler):
	def get(self):
		logging.debug('resetting status of everything!')
		myquery = Calculation.all().filter('status = ','finished')
		for suspect in myquery:
			suspect.status = 'in queue'
			suspect.put()#puts it back into the datastore.
		self.response.out.write("job availability has been reset!")