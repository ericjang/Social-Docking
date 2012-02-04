from google.appengine.ext import db

#only one class in datastore at this moment.
class Calculation(db.Model):
    date_time_started = db.DateTimeProperty(auto_now_add=True)
    date_time_ended = db.DateTimeProperty(auto_now_add=True)
    SMILES = db.StringProperty(required=True)#replace this with the SMILES string
    boltzmann_average_1QS4 = db.StringProperty()
    boltzmann_average_1EVE = db.StringProperty()
    boltzmann_average_3IBK = db.StringProperty()
    status = db.StringProperty(required=True,default='in queue')