import os.path
import wsgiref.handlers
import cgi
import logging

from controllers import mainHandler, dataHandler, adminControl, dataClasses, crons
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util, template

def main():
	logging.getLogger().setLevel(logging.DEBUG)
	application = webapp.WSGIApplication([
		(r"/", mainHandler.HomeHandler),
    	('/receiveResults', dataHandler.ResultsHandler),
    	('/getData',dataHandler.GetDataHandler),
    	('/crons/cleanUnfinished/',crons.cleanUnfinished),
    	('/reset-status',adminControl.ResetHandler)
	],debug=True)
	util.run_wsgi_app(application)

if __name__ == "__main__":
    main()