import os.path
import wsgiref.handlers
import cgi
import logging

from dataClasses import Calculation
from google.appengine.ext import db, webapp
from google.appengine.ext.webapp import util, template

class HomeHandler(webapp.RequestHandler):
	def get(self):
		path = os.path.join(os.path.dirname(__file__), "../templates/index.html")
		args=dict()#nothing in args right now
		self.response.out.write(template.render(path,args))
	def post(self):
		#the same code
		path = os.path.join(os.path.dirname(__file__), "../templates/index.html")
		args=dict()#nothing in args right now
		self.response.out.write(template.render(path,args))