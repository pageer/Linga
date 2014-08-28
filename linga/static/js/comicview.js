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
	this.fitHeight = ko.observable(false);
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
		page_cnt: '.total-pages'
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
	
	this.goToPage = function(index) {
		if (0 < index && index <= this.pageCount()) {
			this.pageNumber(index);
			localStorage.setItem('page:' + this.name(), index);
			this.setPageInDom();
			this.updatePage();
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
	
	this.updatePage = function() {
		$.post(
			SCRIPT_ROOT + '/book/update/page',
			{
				relpath: this.relpath,
				page: this.pageNumber(),
				finished: this.pageCount() == this.pageNumber()
			},
			function(){}
		);
	};
	
	this.getFitHeight = function() {
		return this.fitHeight() ?
		       ($(window).height() - this.imageContainerOffset.top + 'px') :
			   'none';
	};
	
	this.getDataFromDom = function() {
		var self = this;
		this.name(this.getBaseNode().find(this.selectors.book_name).text());
		this.relpath = this.getBaseNode().find(this.selectors.book_path).text();
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
		var self = this,
		    $base = this.getBaseNode();
		this.$links = $base.find(this.selectors.page_link);
		this.$image = $base.find(this.selectors.main_image);
		this.$image_container = $base.find(this.selectors.image_container);
		this.imageContainerOffset = this.$image_container.offset();
		
		$(window).resize(function() {
			if (self.fitHeight()) {
				self.$image.css('max-height', self.getFitHeight());
			}
		});
		
		$base.find(this.selectors.next_link).off('click').on('click', function() {
			self.goToNext();
			return false;
		});
		$base.find(this.selectors.prev_link).off('click').on('click', function() {
			self.goToPrev();
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
		
		this.$image_container.swipe({
			swipeLeft: function(event, direction, distance, duration, fingerCount, fingerData) {
				self.goToNext();
			},
			swipeRight: function(event, direction, distance, duration, fingerCount, fingerData) {
				self.goToPrev();
			}
		});
	};
	
}


$(document).ready(function() {
	var page = new ComicViewModel();
	window.p=page;
	ko.applyBindings(page);
	page.setDomNodes()
	page.getDataFromDom();
	var last_page = parseInt(page.getBaseNode().find(page.selectors.book_page).text(), 10);
	page.goToPage(last_page);
});
