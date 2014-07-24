function ComicPage(url, name, index) {
	this.url = url;
	this.name = name;
	this.index = index;
}

function ComicViewModel() {
	this.pages = [];
	this.current_page = 0;
	this.page_link_selector = '.page-link';
	this.main_image_selector = '.main-image';
	this.image_container_selector = '.image-content';
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
	
	this.currentPage = function() {
		return this.pages[this.current_page];
	};
	
	this.goToPage = function(index) {
		this.current_page = index - 1;
		this.setPageInDom();
	};
	
	this.goToNext = function() {
		this.current_page++;
		this.setPageInDom();
	};
	
	this.goToPrev = function() {
		this.current_page--;
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
		var $curr_link = this.$links.eq(this.current_page);
		this.$image.closest(this.image_container_selector).addClass('loading');
		this.$image.attr('src', $curr_link.attr('href'));
		this.$links.removeClass('current-img')
		$curr_link.addClass('current-img');
	};
	
	this.setDomNodes = function() {
		var self = this,
		    $base = this.base_node ? $(this.base_node): $(document);
		this.$links = $base.find(this.page_link_selector),
		this.$image = $base.find(this.main_image_selector);
		this.$links.off('click').on('click', function() {
			var index = parseInt($(this).attr('data-index'), 10);
			self.goToPage(index);
			return false;
		});
		this.$image.off('load').on('load', function() {
			$(this).closest(self.image_container_selector).removeClass('loading');
		});
	};
	
}

$(document).ready(function() {
	var page = new ComicViewModel();
	page.setDomNodes()
	page.addPagesFromDom();
});
