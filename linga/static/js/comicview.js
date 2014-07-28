function ComicPage(url, name, index) {
	this.url = url;
	this.name = name;
	this.index = index;
}

function ComicViewModel() {
	this.pages = ko.observableArray([]);
	this.pageNumber = ko.observable(1);
	
	this.selectors = {
		page_link: '.page-link',
		main_image: '.main-image',
		image_container: '.image-content',
		next_link: '.next-link',
		prev_link: '.prev-link',
		curr_page: '.curr-page',
		page_cnt: '.total-pages'
	};
	
	this.$links = [];
	this.$image = [];
	
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
		this.pageNumber(index);
		this.setPageInDom();
	};
	
	this.goToNext = function() {
		var curr_page = this.pageNumber();
		this.pageNumber(curr_page + 1);
		this.setPageInDom();
	};
	
	this.goToPrev = function() {
		var curr_page = this.pageNumber();
		this.pageNumber(curr_page - 1);
		this.setPageInDom();
	};
	
	this.addPagesFromDom = function() {
		var self = this;
		this.$links.each(function() {
			var $this = $(this),
			    index = parseInt($this.attr("data-index"), 10);
			self.pages.push(new ComicPage($this.attr('href'), $this.text(), index));
		});
	};
	
	this.setPageInDom = function() {
		var $curr_link = this.$links.eq(this.pageNumber() - 1);
		this.$image.closest(this.selectors.image_container).addClass('loading');
		this.$image.attr('src', $curr_link.attr('href'));
		this.$links.removeClass('current-img')
		$curr_link.addClass('current-img');
	};
	
	this.setDomNodes = function() {
		var self = this,
		    $base = this.base_node ? $(this.base_node): $(document);
		this.$links = $base.find(this.selectors.page_link);
		this.$image = $base.find(this.selectors.main_image);
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
		this.$links.off('click').on('click', function() {
			var index = parseInt($(this).attr('data-index'), 10);
			self.goToPage(index);
			return false;
		});
		this.$image.off('load').on('load', function() {
			$(this).closest(self.selectors.image_container).removeClass('loading');
		});
	};
	
}


$(document).ready(function() {
	var page = new ComicViewModel();
	ko.applyBindings(page);
	page.setDomNodes()
	page.addPagesFromDom();
	page.goToPage(1);
});
