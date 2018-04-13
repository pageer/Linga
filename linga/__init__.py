#from comics import (Comic, ComicLister, ComicMetadata)
from app import app, db, login_manager
from auth import User
from comics import ComicMetadata
import views

if __name__ == '__main__':
    app.run()
