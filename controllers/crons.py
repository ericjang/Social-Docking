#!/usr/bin/env python

import time
from datetime import datetime,timedelta
from google.appengine.ext import webapp,db
from dataClasses import *
import logging

# The cron controllers:
class cleanUnfinished(webapp.RequestHandler):
	# Executed once a day, clears up any 'in progress' calculations
	# that have not been finished in awhile.
	def get(self):
		logging.debug('cron job - time to clean out the aborted jobs!')
		myquery = Calculation.all().filter('status = ','in progress')
		myquery.order('date_time_started')
		now = datetime.now()
		a = timedelta(seconds=600)#cutoff = over an hour
		for suspect in myquery:
			runtime = now - suspect.date_time_started	
			if (a < runtime):
				suspect.status = 'in queue'
				suspect.put()#puts it back into the datastore.
		self.response.out.write("cron job finished!")
