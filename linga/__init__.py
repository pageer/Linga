"""A simple comic book viewer."""
from linga.app import app, db, login_manager
from linga.auth import User
from linga.comics import ComicMetadata
import linga.views

if __name__ == '__main__':
    app.run()
