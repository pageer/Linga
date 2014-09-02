function ComicPage(url, name, index) {
	this.url = url;
	this.name = name;
	this.index = index;
}

function ComicViewModel() {
	this.pages = ko.observableArray([]);
	// Current page number, starting from 1
	this.pageNumber = ko.observable(1);
	this.metadataVisible = ko.observable(false);
	this.name = ko.observable('');
	this.fitMode = ko.observable('full');
	this.rightToLeft = ko.observable(false);
	this.relpath = '';
	
	this.selectors = {
		page_link: '.page-link',
		book_name: '.book-name',
		book_path: '.book-filepath',
		book_page: '.book-last-page',
		main_image: '.main-image',
		image_container: '.image-content',
		next_link: '.next-link',
		prev_link: '.prev-link',
		curr_page: '.curr-page',
		page_cnt: '.total-pages',
		alert: '.dynamic-alert'
	};
	
	this.$links = [];
	this.$image = [];
	
	this.toggleMetadata = function() {
		var visible = this.metadataVisible();
		this.metadataVisible(! visible);
	};
	
	this.addPages = function(pages) {
		for (var i = 0; i < pages.length; i++) {
			this.pages.push(pages[i]);
		}
	};
	
	this.addPage = function(page) {
		this.pages.push(page);
	};
	
	this.allPageNumbers = ko.computed(function() {
		var ret = [];
		for (var i = 0; i < this.pages().length; i++) {
			ret.push(i + 1);
		}
		return ret;
	}, this);
	
	this.pageCount = ko.computed(function() {
		return this.pages().length;
	}, this);
	
	this.currentPage = ko.computed(function() {
		return this.pages()[this.pageNumber() - 1];
	}, this);
	
	this.goToPage = function(index, skip_update) {
		if (0 < index && index <= this.pageCount()) {
			this.pageNumber(index);
			localStorage.setItem('page:' + this.name(), index);
			this.setPageInDom();
			if (! skip_update) {
				this.updatePage();
			}
		}
	};
	
	this.goToNext = function() {
		var curr_page = this.pageNumber();
		this.goToPage(curr_page + 1);
	};
	
	this.goToPrev = function() {
		var curr_page = this.pageNumber();
		this.goToPage(curr_page - 1);
	};
	
	this.pageRight = function() {
		if (this.rightToLeft()) {
			this.goToPrev();
		} else {
			this.goToNext();
		}
	};
	
	this.pageLeft = function() {
		if (this.rightToLeft()) {
			this.goToNext();
		} else {
			this.goToPrev();
		}
	};
	
	this.updatePage = function() {
		var self = this;
		$.post(
			SCRIPT_ROOT + '/book/update/page',
			{
				relpath: this.relpath,
				page: this.pageNumber(),
				finished: this.pageCount() == this.pageNumber(),
				fitmode: this.fitMode(),
				rtl: this.rightToLeft()
			},
			function(data){
				if (! data.success) {
					self.showAlert('Error updating last page: ' + data.error, 'danger', 5);
				}
			}
		);
	};
	
	this.getFitHeight = function() {
		return this.fitMode() == 'height' ?
		       ($(window).height() - this.imageContainerOffset.top + 'px') :
			   'none';
	};
	
	this.showAlert = function(text, type, delay) {
		var alert_type = type ? ('alert-'+type) : '',
		    self = this;
		if (this.alert_timeout) {
			clearTimeout(this.alert_timeout);
			delete this.alert_timeout;
		}
		this.$alert.addClass('show ' + alert_type);
		this.$alert.find('.alert-text').text(text);
		if (delay) {
			self.alert_timeout = setTimeout(function(){
				self.$alert.removeClass('show '+alert_type);
			}, delay * 1000);
		}
	};
	
	this.getDataFromDom = function() {
		var self = this;
		this.name(this.getBaseNode().find(this.selectors.book_name).text());
		this.relpath = this.getBaseNode().find(this.selectors.book_path).text();
		this.rightToLeft(this.getBaseNode().find('input[name=rtol]').prop('checked'));
		this.fitMode(this.getBaseNode().find('select[name=fitmode]>option:checked').val());
		
		this.$links.each(function() {
			var $this = $(this),
			    index = parseInt($this.attr("data-index"), 10);
			self.pages.push(new ComicPage($this.attr('href'), $this.text(), index));
		});
	};
	
	this.setPageInDom = function() {
		var $curr_link = this.$links.eq(this.pageNumber() - 1);
		if (this.$image.attr('src') != $curr_link.attr('href')) {
			this.$image.closest(this.selectors.image_container).addClass('loading');
			this.$image.attr('src', $curr_link.attr('href'));
			this.$links.removeClass('current-img')
			$curr_link.addClass('current-img');
		}
	};
	
	this.getBaseNode = function() {
		return this.base_node ? $(this.base_node): $(document);
	};
	
	this.setDomNodes = function() {
		var $base = this.getBaseNode();
		this.$links = $base.find(this.selectors.page_link);
		this.$image = $base.find(this.selectors.main_image);
		this.$image_container = $base.find(this.selectors.image_container);
		this.imageContainerOffset = this.$image_container.offset();
		this.$alert = $base.find(this.selectors.alert);
	};
	
	this.initEvents = function() {
		var self = this,
		    $base = this.getBaseNode();
		
		$(window).resize(function() {
			if (self.fitMode() == 'height') {
				self.$image.css('max-height', self.getFitHeight());
			}
		});
		
		$base.find(this.selectors.next_link).off('click').on('click', function() {
			self.pageRight();
			return false;
		});
		$base.find(this.selectors.prev_link).off('click').on('click', function() {
			self.pageLeft();
			return false;
		});
		$base.find(this.selectors.curr_page).off('change').on('change', function() {
			self.goToPage(parseInt($(this).val(), 10));
		});
		$base.off('click').on('click', function() {
			$base.find('.show-hover').removeClass('show-hover');
		});
		
		this.$links.off('click').on('click', function() {
			var index = parseInt($(this).attr('data-index'), 10);
			self.goToPage(index);
			return false;
		});
		this.$image.off('load').on('load', function() {
			$(this).closest(self.selectors.image_container).removeClass('loading');
			$(window).scrollTop(0);
		});
		this.$image.off('click').on('click', function() {
			$(this).closest(self.selectors.image_container).toggleClass('show-hover');
			return false;
		});
		this.$image.off('dragstart').on('dragstart', function(e) {
			e.preventDefault();
		});
		
		if (this.$image_container.swipe) {
			this.$image_container.swipe({
				swipeLeft: function(event, direction, distance, duration, fingerCount, fingerData) {
					self.pageRight();
				},
				swipeRight: function(event, direction, distance, duration, fingerCount, fingerData) {
					self.pageLeft();
				}
			});
		}
	};
	
}


$(document).ready(function() {
	var page = new ComicViewModel();
	window.p=page;
	page.setDomNodes()
	page.getDataFromDom();
	ko.applyBindings(page);
	page.initEvents();
	var last_page = parseInt(page.getBaseNode().find(page.selectors.book_page).text(), 10);
	page.goToPage(last_page, true);
});
