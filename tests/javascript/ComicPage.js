describe("A comic book", function() {
	beforeEach(function() {
		this.book = new ComicViewModel();
		this.book.base_node = '<div></div>';
		this.book.setDomNodes();
		this.test_pages = [
			new ComicPage('#foo', 'Link1', 0),
			new ComicPage('#bar', 'Link2', 1),
			new ComicPage('#baz', 'Link3', 2)
		];
	});
	
	it("should start at first page", function() {
		expect(this.book.pageNumber()).toEqual(1);
	});
	
	it("should allow adding multiple pages", function() {
		this.book.addPages([{name: 'foo'}]);
		
		expect(this.book.pages()[0]).toEqual({name: 'foo'});
	});
	
	it("should track page count", function() {
		expect(this.book.pageCount()).toEqual(0);
		
		this.book.addPages(this.test_pages);
		expect(this.book.pageCount()).toEqual(3);
	});
	
	it("should allow adding a single page", function() {
		this.book.addPage({name: 'foo'});
		
		expect(this.book.pages()[0]).toEqual({name: 'foo'});
	});
	
	describe("when extracing book metadata", function() {
		
		beforeEach(function() {
			this.initMarkup = function(rtol_checked, full_checked, height_checked, width_checked, dual_checked) {
				rtol_checked = rtol_checked ? 'checked' : '';
				dual_checked = dual_checked ? 'checked' : '';
				full_checked = full_checked ? 'selected' : '';
				width_checked = width_checked ? 'selected' : '';
				height_checked = height_checked ? 'selected' : '';
				return '<div>'+
					'<span class="book-name">foo</span>' +
					'<span class="book-filepath">fizz/buzz</span>' +
					'<select name="fitmode">' +
					'<option value="full" '+full_checked+'>Baz</option>' +
					'<option value="height" '+height_checked+'>Foo</option>' +
					'<option value="width" '+width_checked+'>Bar</option></select>' +
					'<input name="rtol" '+rtol_checked+' value=1"/>' +
					'<input name="dualpage" '+dual_checked+' value=1"/>' +
					'<div>'+
					'<a class="page-link" data-index="0" href="#foo">Link1</a>' +
					'<a class="page-link" data-index="1" href="#bar">Link2</a>' +
					'<a class="page-link" data-index="2" href="#baz">Link3</a>' +
					'</div>' +
					'</div>';
			};
		});
	
		it("should get page list from DOM", function() {
			this.book.base_node = this.initMarkup();
			this.book.setDomNodes();
			
			this.book.getDataFromDom();
			
			expect(this.book.pages()[0]).toEqual(new ComicPage('#foo', 'Link1', 0));
			expect(this.book.pages()[1]).toEqual(new ComicPage('#bar', 'Link2', 1));
			expect(this.book.pages()[2]).toEqual(new ComicPage('#baz', 'Link3', 2));
		});
		
		it("should get book name from DOM", function() {
			this.book.base_node = this.initMarkup();
			this.book.setDomNodes();
			
			this.book.getDataFromDom();
			
			expect(this.book.name()).toEqual('foo');
		});
	
		it("should get book relpath from DOM", function() {
			this.book.base_node = this.initMarkup();
			this.book.setDomNodes();
			
			this.book.getDataFromDom();
			
			expect(this.book.relpath).toEqual('fizz/buzz');
		});
	
		it("should get disabled right-to-left from the DOM", function() {
			this.book.base_node = this.initMarkup(false);
			this.book.setDomNodes();
			
			this.book.getDataFromDom();
			
			expect(this.book.rightToLeft()).toBe(false);
		});

		it("should get enabled dual-page from the DOM", function() {
			this.book.base_node = this.initMarkup(false);
			this.book.setDomNodes();
			
			this.book.getDataFromDom();
			
			expect(this.book.rightToLeft()).toBe(false);
		});

		it("should get disabled dual-page from the DOM", function() {
			this.book.base_node = this.initMarkup();
			this.book.setDomNodes();
			
			this.book.getDataFromDom();
			
			expect(this.book.dualPage()).toBe(false);
		});
				
		it("should get enabled right-to-left from the DOM", function() {
			this.book.base_node = this.initMarkup(false, false, false, false, true);
			this.book.setDomNodes();
			
			this.book.getDataFromDom();
			
			expect(this.book.dualPage()).toBe(true);
		});
		
		it("should get full size enabled from the DOM", function() {
			this.book.base_node = this.initMarkup(false, true);
			this.book.setDomNodes();
			
			this.book.getDataFromDom();
			
			expect(this.book.fitMode()).toEqual('full');
		});
		
		it("should get fit height enable from the DOM", function() {
			this.book.base_node = this.initMarkup(false, false, true);
			this.book.setDomNodes();
			
			this.book.getDataFromDom();
			
			expect(this.book.fitMode()).toEqual('height');
		});
		
		it("should get fit width enabled from the DOM", function() {
			this.book.base_node = this.initMarkup(false, false, false, true);
			this.book.setDomNodes();
			
			this.book.getDataFromDom();
			
			expect(this.book.fitMode()).toEqual('width');
		});
		
		it("should default to full size when nothing is set in the DOM", function() {
			this.book.base_node = this.initMarkup();
			this.book.setDomNodes();
			
			this.book.getDataFromDom();
			
			expect(this.book.fitMode()).toEqual('full');
		});
	});
	
	it("should be able to set and fetch the current page", function() {
		this.book.addPages(this.test_pages);
		spyOn(this.book, 'setPageInDom');
		spyOn(this.book, 'updatePage')
		
		expect(this.book.currentPage()).toEqual(this.test_pages[0]);
		
		this.book.goToPage(3);
		
		expect(this.book.currentPage()).toEqual(this.test_pages[2]);
		expect(this.book.setPageInDom).toHaveBeenCalled();
		expect(this.book.updatePage).toHaveBeenCalled();
	});
	
	it("should track page number", function() {
		spyOn(this.book, 'updatePage');
		
		this.book.addPages(this.test_pages);
		
		this.book.goToNext();
		expect(this.book.pageNumber()).toEqual(2);
		
		this.book.goToNext();
		expect(this.book.pageNumber()).toEqual(3);
		
		this.book.goToPrev();
		expect(this.book.pageNumber()).toEqual(2);
		expect(this.book.updatePage).toHaveBeenCalled();
	});
	
	it("should be able to go to navigate back and forth", function() {
		this.book.addPages(this.test_pages);
		spyOn(this.book, 'setPageInDom');
		spyOn(this.book, 'updatePage');
		
		this.book.goToPage(2);
		this.book.goToNext();
		
		expect(this.book.currentPage()).toEqual(this.test_pages[2]);
		
		this.book.goToPrev();
		
		expect(this.book.currentPage()).toEqual(this.test_pages[1]);
		expect(this.book.setPageInDom.calls.count()).toEqual(3);
		expect(this.book.updatePage).toHaveBeenCalled();
	});
	
	describe("when dual-page mode is enabled", function() {
		this.book.addPages(this.test_pages);
		spyOn(this.book, 'setPageInDom');
		spyOn(this.book, 'updatePage');
	});
	
	it("should report all page numbers starting from one", function() {
		this.book.addPages(this.test_pages);
		
		expect(this.book.allPageNumbers()[0]).toEqual(1);
		expect(this.book.allPageNumbers().length).toEqual(3);
	});
	
	it("should ignore navigation to before first page", function() {
		spyOn(this.book, 'updatePage');
		
		this.book.addPages(this.test_pages);
		
		expect(this.book.pageNumber()).toEqual(1);
		
		this.book.goToPrev();
		
		expect(this.book.pageNumber()).toEqual(1);
		
		this.book.goToPage(2)
		this.book.goToPage(0);
		
		expect(this.book.pageNumber()).toEqual(2);
		expect(this.book.updatePage).toHaveBeenCalled();
	});
	
	it("should ignore navigation to after last page", function() {
		spyOn(this.book, 'updatePage');
		
		this.book.addPages(this.test_pages);
		this.book.goToPage(3);
		
		expect(this.book.pageNumber()).toEqual(3);
		
		this.book.goToNext();
		
		expect(this.book.pageNumber()).toEqual(3);
		
		this.book.goToPage(2);
		this.book.goToPage(4);
		
		expect(this.book.pageNumber()).toEqual(2);
		expect(this.book.updatePage).toHaveBeenCalled();
	});
	
	it("should skip server update on goToPage when requested", function() {
		spyOn(this.book, 'updatePage');
		this.book.addPage(this.test_pages);
		
		this.book.goToPage(2, true);
		
		expect(this.book.updatePage).not.toHaveBeenCalled();
	});
	
	it("should start in full image mode by default", function() {
		expect(this.book.fitMode()).toEqual('full');
	});
	
	it("should go to next page on right navigation", function() {
		spyOn(this.book, 'updatePage');
		this.book.addPages(this.test_pages);
		
		this.book.goToPage(2);
		this.book.pageRight();
		
		expect(this.book.pageNumber()).toBe(3);
	});
	
	it("should go to previous page on left navigation", function() {
		spyOn(this.book, 'updatePage');
		this.book.addPages(this.test_pages);
		
		this.book.goToPage(2);
		this.book.pageLeft();
		
		expect(this.book.pageNumber()).toBe(1);
	});
	
	it("should navigate left-to-right by default", function() {
		expect(this.book.rightToLeft()).toBe(false);
	});
	
	describe("when right-to-left navigation is enabled", function() {
		beforeEach(function() {
			spyOn(this.book, 'updatePage');
			this.book.rightToLeft(true);
			this.book.addPages(this.test_pages);
			this.book.goToPage(2);
		});
		
		it("should go to next page on left navigation", function() {
			this.book.pageLeft();
			
			expect(this.book.pageNumber()).toBe(3);
		});
		
		it("should go to previous page on right navigation", function() {
			this.book.pageRight();
			
			expect(this.book.pageNumber()).toBe(1);
		});
	});
	
	it("should ignore DOM change if image is already the one requested", function() {
		spyOn(this.book, 'updatePage');
		this.book.addPages(this.test_pages);
		this.book.$image.attr('src', '#bar');
		spyOn(this.book.$image, 'closest');
		
		this.book.goToPage(2);
		
		expect(this.book.$image.closest).not.toHaveBeenCalled();
	});
	
});