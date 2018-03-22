describe("A comic book", function() {
	beforeEach(function() {
		this.test_pages = [
            {url: 'link1', thumb_url: 'thumb1', name: 'page1', index: 1},
            {url: 'link2', thumb_url: 'thumb2', name: 'page2', index: 2},
            {url: 'link3', thumb_url: 'thumb3', name: 'page3', index: 3},
		];
        this.pageData = {
            bookName: 'some book',
            path: '/path/to/book',
            pages: [],
            lastPage: 1,
            rToL: false,
            dualPage: false,
            fitMode: 'full'
        };
		this.book = new ComicViewModel();
        //this.book.populateData(this.pageData);
	});
	
	it("should start at first page", function() {
		expect(this.book.pageNumber()).toEqual(1);
	});
	
	it("should allow adding multiple pages", function() {
		this.book.addPages(this.test_pages);
		
		expect(this.book.pages()[2].name).toEqual('page3');
	});
	
	it("should track page count", function() {
		expect(this.book.pageCount()).toEqual(0);
		
		this.book.addPages(this.test_pages);
		expect(this.book.pageCount()).toEqual(3);
	});
	
	it("should allow adding a single page", function() {
		this.book.addPage(this.test_pages[0]);
		
		expect(this.book.pages()[0].name).toEqual('page1');
	});
	
	it("should be able to set and fetch the current page", function() {
		this.book.addPages(this.test_pages);
		spyOn(this.book, 'setPageInDom');
		spyOn(this.book, 'updatePage')
		
		expect(this.book.currentPage()).toEqual(this.book.pages()[0]);
		
		this.book.goToPage(3);
		
		expect(this.book.currentPage()).toEqual(this.book.pages()[2]);
		expect(this.book.setPageInDom).toHaveBeenCalled();
		expect(this.book.updatePage).toHaveBeenCalled();
	});
	
	it("should track page number", function() {
		spyOn(this.book, 'updatePage');
		spyOn(this.book, 'setPageInDom');
		
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
		
		expect(this.book.currentPage()).toEqual(this.book.pages()[2]);
		
		this.book.goToPrev();
		
		expect(this.book.currentPage()).toEqual(this.book.pages()[1]);
		expect(this.book.setPageInDom.calls.count()).toEqual(3);
		expect(this.book.updatePage).toHaveBeenCalled();
	});
	
	describe("when dual-page mode is enabled", function() {
        beforeEach(function() {
            this.book.addPages(this.test_pages);
            spyOn(this.book, 'setPageInDom');
            spyOn(this.book, 'updatePage');
        });
	});
	
	it("should report all page numbers starting from one", function() {
		this.book.addPages(this.test_pages);
		
		expect(this.book.allPageNumbers()[0]).toEqual(1);
		expect(this.book.allPageNumbers().length).toEqual(3);
	});
	
	it("should ignore navigation to before first page", function() {
		spyOn(this.book, 'updatePage');
        spyOn(this.book, 'setPageInDom');
		
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
        spyOn(this.book, 'setPageInDom');
		
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
        spyOn(this.book, 'setPageInDom');
		this.book.addPages(this.test_pages);
		
		this.book.goToPage(2);
		this.book.pageRight();
		
		expect(this.book.pageNumber()).toBe(3);
	});
	
	it("should go to previous page on left navigation", function() {
		spyOn(this.book, 'updatePage');
        spyOn(this.book, 'setPageInDom');
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
            spyOn(this.book, 'setPageInDom');
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
	
	xit("should ignore DOM change if image is already the one requested", function() {
		spyOn(this.book, 'updatePage');
		this.book.addPages(this.test_pages);
		this.book.$image.attr('src', '#bar');
		spyOn(this.book.$image, 'closest');
		
		this.book.goToPage(2);
		
		expect(this.book.$image.closest).not.toHaveBeenCalled();
	});
	
});
