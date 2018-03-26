import re
import os
import os.path
import zipfile
import rarfile
from datetime import datetime
from flask import url_for

from app import (get_app, get_config, get_db, db)

COMIC_ARCHIVE_EXTENSIONS = ['.cbz', '.zip', '.cbr', '.rar']
COMIC_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif']
COMIC_IMAGE_MIME_MAP = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
}

def path_to_book(path):
    if is_supported_format(path):
        return Comic(path)
    else:
        raise Exception('Unsupported format')

def relpath_to_book(path, basepath=''):
    if basepath == '':
        basepath = get_config('BOOK_PATH')
    
    fullpath = os.path.normpath(os.path.join(basepath, path))
    
    if os.path.isabs(path):
        raise Exception('Expected relative path')
    
    if os.path.commonprefix([basepath, fullpath]) != basepath:
        raise Exception('Expected path to be a subdirectory of basepath')
    
    return path_to_book(fullpath)

def remove_sep(path, new_sep='--'):
    return path.replace(os.sep, new_sep)
    
def add_sep(path, fake_sep='--'):
    return path.replace(fake_sep, os.sep)

def is_supported_format(file_path):
    name, ext = os.path.splitext(file_path)
    return ext.lower() in COMIC_ARCHIVE_EXTENSIONS and os.path.isfile(file_path)

def is_supported_image(file_name):
    name, ext = os.path.splitext(file_name)
    return ext.lower() in COMIC_IMAGE_EXTENSIONS

def get_mime_type(file_name):
    name, ext = os.path.splitext(file_name)
    if ext in ['.zip', '.cbz']:
        return 'application/zip'
    elif ext in ['.rar', '.cbr']:
        return 'application/rar'
    else:
        return 'application/octet-stream'

def filename_to_bookname(path):
    return re.sub(r"[-_]+", ' ', os.path.splitext(os.path.basename(path))[0])
    
def comic_query():
    return db.session.query(ComicMetadata)


class InvalidPageError(IndexError):
    def __init__(self, page=0):
        super(IndexError, self).__init__()
        self.page = page
    

class Comic:
    def __init__(self, path, archive = None):
        self.name = filename_to_bookname(path)
        self.path = path
        self.rel_path = path
        self.current_file_index = -1
        self.archive = archive
        self.file_list = []
        self._metadata = None
    
    def metadata(self, userid):
        if self._metadata is None:
            try:
                dat = comic_query().filter_by(user_id=userid, book_relpath=self.rel_path).first()
            except:
                dat = ComicMetadata(userid, self.rel_path)
            if dat:
                self._metadata = dat
            else:
                self._metadata = ComicMetadata(userid, self.rel_path)
        return self._metadata
    
    def set_rel_path(self, base):
        # Make sure there's a trailing slash.
        base = os.path.join(base, '')
        parts = self.path.rpartition(base)
        self.rel_path = parts[2]
        
    def disp_relpath(self):
        return remove_sep(self.rel_path)
    
    def mimetype(self):
        return get_mime_type(self.path)
    
    def get_archive(self):
        if not self.archive:
            if self.mimetype() == 'application/rar':
                self.archive = rarfile.RarFile(self.path, 'r')
            else:
                self.archive = zipfile.ZipFile(self.path, 'r')
        return self.archive
        
    def get_file_list(self):
        if not self.file_list:
            files = self.get_archive().namelist()
            self.file_list = []
            for f in files:
                if is_supported_image(f):
                    self.file_list.append(f)
            self.file_list.sort()
        return self.file_list

    def get_page_list(self):
        files = self.get_file_list()
        pages = []
        index = 1
        for f in files:
            pages.append({
                "file": f,
                "index": index,
                "url": url_for('show_page', book=self.disp_relpath(), page=index),
                "page_url": url_for('show_book', book=self.disp_relpath(), page=index),
                "thumb_url": url_for('show_pagethumb', book=self.disp_relpath(), page=index),
            })
            index += 1
        return pages

    
    def next_file(self):
        return self.get_file(self.current_file_index + 1)
    
    def prev_file(self):
        return self.get_file(self.current_file_index - 1)
    
    def get_file(self, index):
        self.current_file_index = index
        try:
            return self.get_archive().read(self.get_file_list()[index])
        except IndexError:
            raise InvalidPageError(index)
    
    def get_file_mime(self, index=-1):
        if index == -1:
            index = self.current_file_index
        try:
            filename = self.get_file_list()[index]
            ext = os.path.splitext(filename)[1]
            for mimetype, extensions in COMIC_IMAGE_MIME_MAP.items():
                if ext in extensions:
                    return mimetype
            raise Exception('Unrecognized MIME type')
        except IndexError:
            raise InvalidPageError(index)

    
class ComicLister:
    
    def __init__(self, base_path=''):
        self.base_path = base_path
        
    def get_book_list(self, path=''):
        ret = []
        path = path if path else self.base_path
        for item in os.listdir(path):
            full_path = os.path.join(path, item)
            if os.path.isdir(full_path):
                child_paths = self.get_book_list(full_path)
                ret.extend(child_paths)
            elif is_supported_format(full_path):
                ret.append(full_path)
        ret.sort()
        return ret
    
    def get_books(self, path=''):
        path = path if path else self.base_path
        ret = []
        for item in self.get_book_list(path):
            c = Comic(item)
            c.set_rel_path(path)
            ret.append(c)
        return ret
    
    def group_by_path(self, books):
        ret = ComicDir()
        for book in books:
            paths = book.rel_path.split(os.path.sep)
            target = ret
            pathlen = len(paths)
            if pathlen > 1:
                target = ret.traverse_children(paths[:pathlen-1])
            target.books.append(book)
        return ret


class ComicDir:
    def __init__(self, name=''):
        self.name = name
        self.books = []
        self.children = {}
    
    def child(self, name):
        try:
            return self.children[name]
        except KeyError:
            self.children[name] = ComicDir(name)
            return self.children[name]
    
    def traverse_children(self, path_list):
        """Recursively traverse multiple children represented by the path list"""
        curr_item = self
        for path in path_list:
            curr_item = curr_item.child(path)
        return curr_item
    

class ComicMetadata(db.Model):
    __tablename__ = 'linga_book_metadata'
    
    user_id = db.Column(db.Integer, db.ForeignKey('linga_users.user_id'), nullable=False, primary_key=True)
    book_relpath = db.Column(db.String(256), nullable=False, primary_key=True)
    last_page = db.Column(db.Integer, nullable=False, default=1)
    last_access = db.Column(db.DateTime, nullable=False, default=datetime.now())
    finished_book = db.Column(db.Boolean, nullable=False, default=False)
    fit_mode = db.Column(db.String(length=10), nullable=False, default="full")
    right_to_left = db.Column(db.Boolean, nullable=False, default=False)
    dual_page = db.Column(db.Boolean, nullable=False, default=False)
    
    def __init__(self, userid=None, bookpath=None):
        self.user_id = userid
        self.book_relpath = bookpath
        self.last_page = 1
        self.last_access = datetime.now()
        self.finished_book = False
        self.fit_mode = "full"
        self.right_to_left = False
        self.dual_page = False
    
    def book_name(self):
        return filename_to_bookname(self.book_relpath)
    
    def disp_relpath(self):
        return remove_sep(self.book_relpath)
    
    def last_access_date(self):
        return self.last_access.strftime('%Y-%m-%d %H:%M:%S')
    
