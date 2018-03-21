/*globals ko, SCRIPT_ROOT */
function ComicPage(page, parent) {
	this.url = page.url;
    this.thumb_url = page.thumb_url;
	this.name = page.name;
	this.index = page.index;

    this.isCurrentPage = ko.computed(function() {
        return this == parent.currentPage();
    }, this);

    this.goToPage = function() {
        parent.goToPage(this.index);
    };
}

function ComicViewModel() {
	this.pages = ko.observableArray([]);
	// Current page number, starting from 1
	this.pageNumber = ko.observable(1);
	this.metadataVisible = ko.observable(false);
	this.name = ko.observable('');
	this.fitMode = ko.observable('full');
	this.rightToLeft = ko.observable(false);
	this.dualPage = ko.observable(false);
    this.lastPageRead = ko.observable(1);
	this.relpath = ko.observable('');
	
	this.selectors = {
		page_link: '.page-link',
		main_image: '.page-image.main',
		sec_image: '.page-image.secondary',
		image_container: '.image-content',
		curr_page: '.curr-page',
		pager: '.page-list',
		pager_curr: '.page-list .currentPage',
		alert: '.dynamic-alert'
	};
	
	this.$image = [];
	
    this.leftLinkText = ko.computed(function() {
        return this.rightToLeft() ? 'Next' : 'Prev';
    }, this);

    this.rightLinkText = ko.computed(function() {
        return this.rightToLeft() ? 'Prev' : 'Next';
    }, this);

	this.toggleMetadata = function () {
		var visible = this.metadataVisible();
		this.metadataVisible(! visible);
		$(this.selectors.pager).scrollLeft(this.getPagerScroll());
	};
	
	this.addPage = function(page) {
		this.pages.push(new ComicPage(page, this));
	};
	
	this.addPages = function(pages) {
		for (var i = 0; i < pages.length; i++) {
			this.addPage(pages[i]);
		}
	};
	
	this.allPageNumbers = ko.computed(function () {
		var ret = [];
		for (var i = 0; i < this.pages().length; i++) {
			ret.push(i + 1);
		}
		return ret;
	}, this);
	
	this.pageCount = ko.computed(function () {
		return this.pages().length;
	}, this);
	
	this.currentPage = ko.computed(function () {
		return this.pages()[this.pageNumber() - 1];
	}, this);
	
	this.goToPage = function (index, skip_update) {
		if (0 < index && index <= this.pageCount()) {
			this.pageNumber(index);
			localStorage.setItem('page:' + this.name(), index);
			this.setPageInDom();
			if (! skip_update) {
				this.updatePage();
			}
		}
	};
	
	this.goToNext = function () {
		var curr_page = this.pageNumber();
		this.goToPage(curr_page + (this.dualPage() ? 2 : 1));
	};
	
	this.goToPrev = function () {
		var curr_page = this.pageNumber();
		this.goToPage(curr_page - (this.dualPage() ? 2 : 1));
	};
	
	this.pageRight = function () {
		if (this.rightToLeft()) {
			this.goToPrev();
		} else {
			this.goToNext();
		}
	};
	
	this.pageLeft = function () {
		if (this.rightToLeft()) {
			this.goToNext();
		} else {
			this.goToPrev();
		}
	};
	
	this.updatePage = function () {
		var self = this;
		$.post(
			SCRIPT_ROOT + '/book/update/page',
			{
				relpath: this.relpath(),
				page: this.pageNumber(),
				finished: this.pageCount() >= this.pageNumber(),
				fitmode: this.fitMode(),
				rtl: this.rightToLeft()
			},
			function (data) {
				if (! data.success) {
					self.showAlert('Error updating last page: ' + data.error, 'danger', 5);
				}
			}
		);
	};
	
	this.getFitHeight = function () {
		var pad = parseInt(this.$image_container.css('padding-top'), 10) +
		          parseInt(this.$image_container.css('margin-top'), 10);
		var height = $(window).height() - this.imageContainerOffset.top - pad;
		return this.fitMode() === 'height' ? (height + 'px') : 'none';
	};
	
	this.getPagerScroll = function () {
		var $pager = $(this.selectors.pager),
			pager_width = $(this.selectors.pager_curr).position().left,
			curr_scroll = $pager.scrollLeft();
		return curr_scroll + pager_width - $pager.offset().left;
	};
	
	this.showAlert = function (text, type, delay) {
		var alert_type = type ? ('alert-' + type) : '',
			self = this;
		if (this.alert_timeout) {
			clearTimeout(this.alert_timeout);
			delete this.alert_timeout;
		}
		this.$alert.addClass('show ' + alert_type);
		this.$alert.find('.alert-text').text(text);
		if (delay) {
			self.alert_timeout = setTimeout(function () {
				self.$alert.removeClass('show ' + alert_type);
			}, delay * 1000);
		}
	};
	
	this.getDataFromDom = function () {
		var self = this;
        this.name(window.pageData.bookName);
        this.relpath(window.pageData.path);
		this.rightToLeft(this.getBaseNode().find('input[name=rtol]').prop('checked'));
		this.dualPage(this.getBaseNode().find('input[name=dualpage]').prop('checked'));
		this.fitMode(this.getBaseNode().find('select[name=fitmode]>option:checked').val());
        this.lastPageRead(window.pageData.lastPage);
		
        self.addPages(window.pageData.pages);
	};
	
	this.setPageInDom = function () {
		if (this.$image.attr('src') !== this.currentPage().url) {
			this.$image.closest(this.selectors.image_container).addClass('loading');
			this.$image.attr('src', this.currentPage().url);
			
            var next_page = this.pages()[this.pageNumber()];
			this.$sec_image.attr('src', next_page.url);
			if (this.dualPage()) {
				this.$sec_image.closest(this.selectors.image_container).addClass('sec-loading');
			}
		}
	};
	
	this.getBaseNode = function () {
		return this.base_node ? $(this.base_node): $(document);
	};
	
	this.setDomNodes = function () {
		var $base = this.getBaseNode();
		this.$image = $base.find(this.selectors.main_image);
		this.$sec_image = $base.find(this.selectors.sec_image);
		this.$image_container = $base.find(this.selectors.image_container);
		this.imageContainerOffset = this.$image_container.offset();
		this.$alert = $base.find(this.selectors.alert);
	};
	
	this.initEvents = function () {
		var self = this,
			$base = this.getBaseNode();
		
		$(window).resize(function () {
			if (self.fitMode() === 'height') {
				self.$image.css('max-height', self.getFitHeight());
				self.$sec_image.css('max-height', self.getFitHeight());
			}
		});
		
		$base.find(this.selectors.curr_page).off('change').on('change', function () {
			self.goToPage(parseInt($(this).val(), 10));
		});
		$base.off('click').on('click', function () {
			$base.find('.show-hover').removeClass('show-hover');
		});
		
		this.$image.off('load').on('load', function () {
			var $img = $(this).closest(self.selectors.image_container);
			$(window).scrollTop($img.offset().top);
			$img.removeClass('loading');
		});

		this.$sec_image.off('load').on('load', function () {
			$(this).closest(self.selectors.image_container).removeClass('sec-loading');
		});
		
		var img_click = function () {
			$(this).closest(self.selectors.image_container).toggleClass('show-hover');
			return false;
		};
		this.$image.off('click').on('click', img_click);
		this.$sec_image.off('click').on('click', img_click);
		
		var drag_start = function (e) {
			e.preventDefault();
		};
		this.$image.off('dragstart').on('dragstart', drag_start);
		this.$sec_image.off('dragstart').on('dragstart', drag_start);
		
		if (this.$image_container.swipe) {
			this.$image_container.swipe({
				swipeLeft: function (event, direction, distance, duration, fingerCount, fingerData) {
					self.pageRight();
				},
				swipeRight: function (event, direction, distance, duration, fingerCount, fingerData) {
					self.pageLeft();
				}
			});
		}
	};
	
}


$(document).ready(function () {
	var page = new ComicViewModel();
    window.comicView = page;
	page.setDomNodes();
	page.getDataFromDom();
	ko.applyBindings(page);
	page.initEvents();
	page.goToPage(page.lastPageRead(), true);
});
