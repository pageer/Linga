import os.path
import StringIO
from datetime import datetime
from PIL import Image
from flask import (render_template, make_response, redirect, abort, url_for,
				   send_file, flash, request, session, jsonify, g)
from flask_login import (login_required, login_user, logout_user, current_user)

from linga import User, app, db, user_query
from linga.comics import (ComicLister, Comic, ComicMetadata, comic_query,
						  relpath_to_book, add_sep)

# Create any missing tables.
db.create_all()

def get_book(path):
	ret = relpath_to_book(add_sep(path))
	ret.set_rel_path(app.config['BOOK_PATH'])
	return ret

def show_index():
	return render_template('index.html')

@app.route('/')
@app.route('/books/')
@login_required
def show_book_list():
	lister = ComicLister(app.config['BOOK_PATH'])
	book_list = lister.get_books()
	books = lister.group_by_path(book_list)
	recent_metadata = comic_query().filter_by(user_id=current_user.user_id).order_by(ComicMetadata.last_access.desc()).limit(10)
	return render_template('show-book-list.html',
						   books=books, recent=recent_metadata)

@app.route('/books/read/<string:book>/page/<int:page>')
@app.route('/books/read/<string:book>/', defaults = {'page': 0})
@login_required
def show_book(book, page):
	try:
		bk = get_book(book)
		meta = bk.metadata(current_user.user_id)
		if page == 0:
			page = meta.last_page if meta.last_page else 1
		else:
			meta.last_page = page
			db.session.add(meta)
			db.session.commit()
		return render_template('show-book.html', book=bk, book_id=book, metadata=meta, page=page)
	except:
		abort(404)

@app.route('/books/page/<string:book>/<int:page>')
@login_required
def show_page(book, page):
	try:
		bk = get_book(book)
		img_file = bk.get_file(page - 1)
		sio = StringIO.StringIO()
		sio.write(img_file)
		sio.seek(0)
		return send_file(sio, 'image/jpg')
	except Exception, err:
		abort(404)

@app.route('/books/pagethumb/<string:book>/<int:page>')
@login_required
def show_pagethumb(book, page):
	try:
		bk = get_book(book)
		img_file = bk.get_file(page - 1)
		inio = StringIO.StringIO()
		outio = StringIO.StringIO()
		inio.write(img_file)
		inio.seek(0)
		
		im = Image.open(inio)
		im.thumbnail((64, 64))
		im.save(outio, "JPEG")
		outio.seek(0)
		
		return send_file(outio, 'image/jpg')
	except Exeption, err:
		return jsonify({'err': err.message})
		abort(404)
			
@app.route('/books/download/<string:book>')
@login_required
def download_book(book):
	try:
		bk = get_book(book)
		return send_file(os.path.abspath(bk.path), mimetype=bk.mimetype(), as_attachment=True,
		                 attachment_filename=bk.rel_path)
	except:
		abort(404)

@app.route('/user/login', methods = ['GET', 'POST'])
def user_login():
	username = ''
	if request.method == 'POST':
		username = request.form.get('email')
		passwd = request.form.get('password')
		if len(username) > 3 and len(passwd) > 3:
			valid = False
			usr = user_query().filter_by(email=username).first()
			if usr is not None:
				valid = usr.check_password(passwd)
			if valid:
				valid = login_user(usr)
			if valid:
				usr.last_login = datetime.now()
				try:
					db.session.add(usr)
					db.session.commit()
					return redirect(request.args.get('next') or url_for('show_book_list'))
				except Exception as ex:
					flash(ex)
			else:
				flash('Invalid username or password')
		else:
			flash('Invalid username or password')
	return render_template('user/login.html', email=username)

@app.route('/user/logout', methods = ['GET', 'POST'])
def user_logout():
	logout_user()
	return redirect(url_for('user_login'))

@app.route('/user/create', methods = ['GET', 'POST'])
def user_create():
	if not app.config.get('ALLOW_REGISTRATION'):
		abort(403)
	username = ''
	if request.method == 'POST':
		username = request.form.get('email')
		passwd = request.form.get('password')
		confirm_passwd = request.form.get('confirm_password')
		if len(username) > 3 and len(passwd) > 3 and passwd == confirm_passwd:
			usr = User(username, passwd)
			try:
				db.session.add(usr)
				db.session.commit()
				flash("Created user")
			except Exception as ex:
				flash(ex)
	return render_template('user/create.html', email=username)

@app.route('/book/update/page', methods=['POST'])
@login_required
def update_page():
	uid = current_user.user_id
	path = request.form.get('relpath')
	page = request.form.get('page')
	finished = request.form.get('finished') == 'true'
	fit_mode = request.form.get('fitmode') or "full"
	rtol = request.form.get('rtl') == 'true'
	
	if path and uid and page:
		data = comic_query().filter_by(user_id=uid, book_relpath=path).first()
		if data is None:
			data = ComicMetadata(uid, path)
		data.last_access = datetime.now()
		data.last_page = page
		data.fit_mode = fit_mode
		data.right_to_left = rtol
		if finished:
			data.finished_book = True
		try:
			db.session.add(data)
			db.session.commit()
			return jsonify({'success': True})
		except Exception as err:
			return jsonify({'success': False, 'error': err.message})
	return jsonify({'success': False, 'error': 'Missing data'})
