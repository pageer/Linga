"""Pages and AJAX endpoints."""
import io
import os.path
from datetime import datetime
from PIL import Image
from flask import (
    render_template,
    redirect,
    abort,
    url_for,
    send_file,
    flash,
    request,
    jsonify,
)
from flask_login import login_required, login_user, logout_user, current_user
from linga import app, db
from linga.auth import User, get_user
from linga.comics import (
    ComicLister,
    ComicMetadata,
    get_recent_books,
    get_metadata,
    relpath_to_book,
    add_sep
)

# Create any missing tables.
db.create_all()

def save_object(obj):
    db.session.add(obj)
    db.session.commit()

def get_book(path):
    ret = relpath_to_book(add_sep(path))
    ret.set_rel_path(app.config['BOOK_PATH'])
    return ret

@app.route('/')
@app.route('/books/')
@login_required
def show_book_list():
    lister = ComicLister(app.config['BOOK_PATH'])
    book_list = lister.get_books()
    books = lister.group_by_path(book_list)
    recent_metadata = get_recent_books(current_user.user_id)
    return render_template('show-book-list.html',
                           books=books, recent=recent_metadata)

@app.route('/books/read/<string:book>/page/<int:page>')
@app.route('/books/read/<string:book>/', defaults={'page': 0})
@login_required
def show_book(book, page):
    try:
        full_book = get_book(book)
        meta = full_book.metadata(current_user.user_id)
        if page == 0:
            page = meta.last_page if meta.last_page else 1
        else:
            meta.last_page = page
            save_object(meta)
        return render_template(
            'show-book.html',
            book=full_book,
            book_id=book,
            metadata=meta,
            page=page)
    except Exception as err:
        app.logger.error(err.message)
        abort(404)

@app.route('/books/page/<string:book>/<int:page>')
@login_required
def show_page(book, page):
    try:
        book = get_book(book)
        img_file = book.get_file(page - 1)
        sio = io.BytesIO()
        sio.write(img_file)
        sio.seek(0)
        return send_file(sio, 'image/jpg')
    except Exception as err:
        app.logger.error(str(err))
        abort(404)

@app.route('/books/pagethumb/<string:book>/<int:page>')
@login_required
def show_pagethumb(book, page):
    try:
        book = get_book(book)
        img_file = book.get_file(page - 1)
        inio = io.BytesIO()
        outio = io.BytesIO()
        inio.write(img_file)
        inio.seek(0)

        img = Image.open(inio)
        img.thumbnail((64, 64))
        img.save(outio, "JPEG")
        outio.seek(0)

        return send_file(outio, 'image/jpg')
    except Exception as err:
        app.logger.error(err.message)
        abort(404)

@app.route('/books/download/<string:book>')
@login_required
def download_book(book):
    try:
        book = get_book(book)
        return send_file(os.path.abspath(book.path), mimetype=book.mimetype(), as_attachment=True,
                         attachment_filename=book.rel_path)
    except Exception as ex:
        app.logger.error(str(err))
        abort(404)

@app.route('/user/login', methods=['GET', 'POST'])
def user_login():
    username = ''
    if request.method == 'POST':
        username = request.form.get('email')
        passwd = request.form.get('password')
        if len(username) > 3 and len(passwd) > 3:
            valid = False
            usr = get_user(username)
            if usr is not None:
                valid = usr.check_password(passwd)
            if valid:
                valid = login_user(usr)
            if valid:
                usr.last_login = datetime.now()
                try:
                    save_object(usr)
                    return redirect(request.args.get('next') or url_for('show_book_list'))
                except Exception as ex:
                    flash(ex)
            else:
                flash('Invalid username or password')
        else:
            flash('Invalid username or password')
    return render_template('user/login.html', email=username)

@app.route('/user/logout', methods=['GET', 'POST'])
def user_logout():
    logout_user()
    return redirect(url_for('user_login'))

@app.route('/user/create', methods=['GET', 'POST'])
def user_create():
    if not app.config.get('ALLOW_REGISTRATION'):
        abort(403)

    username = request.form.get('email')
    passwd = request.form.get('password')
    confirm_passwd = request.form.get('confirm_password')

    if request.method == 'POST':
        return user_create_post(username, passwd, confirm_passwd)

    return render_template('user/create.html', email=username)


def user_create_post(username, passwd, confirm_passwd):
    if len(username) < 3 and len(passwd) < 3:
        flash("Invalid username or password!")
        return redirect(url_for('user_create'))

    if passwd != confirm_passwd:
        flash("Passwords don't match!")
        return redirect(url_for('user_create'))

    usr = User(username, passwd)
    try:
        save_object(usr)
        flash("Created user")
        return redirect(url_for('user_login'))
    except Exception as ex:
        flash("Error creating user - " + str(ex))
        app.logger.error(ex)

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
    dual = request.form.get('dual') == 'true'

    if path and uid and page:
        data = get_metadata(uid, path)
        if data is None:
            data = ComicMetadata(uid, path)
        data.last_access = datetime.now()
        data.last_page = page
        data.fit_mode = fit_mode
        data.right_to_left = rtol
        data.dual_page = dual
        if finished:
            data.finished_book = True
        try:
            save_object(data)
            return jsonify({'success': True})
        except Exception as err:
            return jsonify({'success': False, 'error': str(err)})
    return jsonify({'success': False, 'error': 'Missing data'})
