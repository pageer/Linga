from flask import (render_template, make_response, redirect, abort, url_for,
				   send_file, flash, request, session, g)
import StringIO

from linga import app
from linga.comics import (ComicLister, Comic, relpath_to_book, add_sep)

def get_book(path):
	ret = relpath_to_book(add_sep(path))
	ret.set_rel_path(app.config['BOOK_PATH'])
	return ret

@app.route('/')
def show_index():
	return render_template('index.html')

@app.route('/books')
def show_book_list():
	lister = ComicLister(app.config['BOOK_PATH'])
	book_list = lister.get_books()
	return render_template('show-book-list.html',
						   books = book_list)

@app.route('/books/read/<string:book>')
def show_book(book):
	try:
		bk = get_book(book)
		return render_template('show-book.html', book=bk, book_id=book)
	except:
		abort(404)

@app.route('/books/page/<string:book>/<int:page>')
def show_page(book, page):
	try:
		bk = get_book(book)
		img_file = bk.get_file(page - 1)
		sio = StringIO.StringIO()
		sio.write(img_file)
		sio.seek(0)
		return send_file(sio, 'image/jpg')
	except:
		abort(404)