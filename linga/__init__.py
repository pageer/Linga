from comics import (Comic, ComicLister, ComicMetadata)
from app import app, db, login_manager
from auth import User, user_query
import views

if __name__ == '__main__':
    app.run()