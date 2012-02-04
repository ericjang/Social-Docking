import cgi
from dataClasses import *#wildcard! import everything
from datetime import datetime
from google.appengine.ext import db, webapp
from django.utils import simplejson
import random
import logging

#respond to work request		
class GetDataHandler(webapp.RequestHandler):
	def post(self):
		qry = Calculation.all().filter('status = ','in queue')#does not search datastore until access
		ref = qry.get()
		ref.status = 'in progress'
		ref.date_time_started = datetime.now()
		ref.put()#puts it back into the datastore.
		output = {
			'SMILES':ref.SMILES,
			'key':unicode(ref.key())
		}
		output = simplejson.dumps(output)#use the json encoder
		self.response.out.write(output)#send this data to the user as a json response. From the html end, user will work with this json.
		
#process results from worker.
class ResultsHandler(webapp.RequestHandler):
	def post(self):
		a = cgi.escape(self.request.get('boltzmann_average_1QS4'))
		b = cgi.escape(self.request.get('boltzmann_average_1EVE'))
		c = cgi.escape(self.request.get('boltzmann_average_3IBK'))
		key = cgi.escape(self.request.get('key'))
		#fetch appropriate object from datastore
		ref = db.get(key)
		ref.boltzmann_average_1QS4 = a
		ref.boltzmann_average_1EVE = b
		ref.boltzmann_average_3IBK = c
		ref.date_time_ended = datetime.now()
		ref.status='finished'
		ref.put()