/*globals ko, SCRIPT_ROOT */

function ComicPage(page, parent) {
    this.url = page.url;
    this.page_url = page.page_url;
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
    this.showAllUi = ko.observable(false);
    
    this.selectors = {
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
        page.index = this.pageCount() + 1;
        this.pages.push(new ComicPage(page, this));
    };
    
    this.addPages = function(pages) {
        for (var i = 0; i < pages.length; i++) {
            this.addPage(pages[i]);
        }
    };
    
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

    this.nextPageLeft = ko.computed(function() {
        var curr_index = this.pageNumber() - 1;
        var offset = this.dualPage() ? 2 : 1;
        var next_index = Math.max(0, curr_index - offset);
        if (this.rightToLeft()) {
            next_index = Math.min(this.pageCount() - 1, curr_index + offset);
            if (this.dualPage() && this.pageCount() - 1 < curr_index + offset) {
                next_index = curr_index;
            }
        }
        return this.pages()[next_index];
    }, this);
    
    this.nextPageRight = ko.computed(function() {
        var curr_index = this.pageNumber() - 1;
        var offset = this.dualPage() ? 2 : 1;
        var next_index = Math.min(this.pageCount() - 1, curr_index + offset);
        if (this.dualPage() && this.pageCount() - 1 < curr_index + offset) {
            next_index = curr_index;
        }
        if (this.rightToLeft()) {
            next_index = Math.max(0, curr_index - offset);
        }
        return this.pages()[next_index];
    }, this);

    this.goToNext = function () {
        var curr_page = this.pageNumber();
        this.goToPage(curr_page + (this.dualPage() ? 2 : 1));
    };
    
    this.goToPrev = function () {
        var curr_page = this.pageNumber();
        this.goToPage(curr_page - (this.dualPage() ? 2 : 1));
    };

    this.pageRight = function () {
        var page = this.nextPageRight();
        page.goToPage();
    };
    
    this.pageLeft = function () {
        var page = this.nextPageLeft();
        page.goToPage();
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
                rtl: this.rightToLeft(),
                dual: this.dualPage()
            },
            function (data) {
                if (! data.success) {
                    self.showAlert('Error updating last page: ' + data.error, 'danger', 5);
                }
            }
        );
    };
    
    this.getFitHeight = function () {
        var height = $(window).height();
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
    
    this.populateData = function(pageData) {
        this.name(pageData.bookName);
        this.relpath(pageData.path);
        this.rightToLeft(pageData.rToL);
        this.dualPage(pageData.dualPage);
        this.fitMode(pageData.fitMode);
        this.lastPageRead(pageData.lastPage);
        
        this.addPages(pageData.pages);
    };
    
    this.setPageInDom = function () {
        if (this.$image.attr('src') !== this.currentPage().url) {
            this.$image.closest(this.selectors.image_container).addClass('loading');
            this.$image.attr('src', this.currentPage().url);
            
            var next_page = this.pages()[this.pageNumber()];
            if (next_page) {
                this.$sec_image.attr('src', next_page.url);
            } else {
                this.$sec_image.attr('src', '');
            }
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
        
        this.$image.off('load').on('load', function () {
            var $img = $(this).closest(self.selectors.image_container);
            $(window).scrollTop($img.offset().top);
            $img.removeClass('loading');
        });

        this.$sec_image.off('load').on('load', function () {
            $(this).closest(self.selectors.image_container).removeClass('sec-loading');
        });
        
        var img_click = function () {
            var show_state = self.showAllUi();
            self.showAllUi(!show_state);
            return false;
        };
        this.$image.off('click.uitoggle').on('click.uitoggle', img_click);
        this.$sec_image.off('click.uitoggle').on('click.uitoggle', img_click);
        
        var drag_start = function (e) {
            e.preventDefault();
        };
        this.$image.off('dragstart').on('dragstart', drag_start);
        this.$sec_image.off('dragstart').on('dragstart', drag_start);
        
        // Remove keyboard focus from select controls
        $('select').off('change.focus').on('change.focus', function() {
            $(this).blur();
            return true;
        });

        $(window).off('keypress').on('keypress', function(data) {
            var at_bottom = $(window).height() + Math.ceil($(window).scrollTop()) >= $(document).height();
            var key_code = data.charCode;
            if (key_code == 32 && at_bottom) {
                self.goToNext();
            } else if (key_code == 46 || key_code == 62) {
                self.pageRight();
            } else if (key_code == 44 || key_code == 60) {
                self.pageLeft();
            }
            return true;
        });

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

