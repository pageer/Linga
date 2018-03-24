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
	
	it("should navigate left-to-right by default", function() {
		expect(this.book.rightToLeft()).toBe(false);
	});

    describe("when getting page to left", function() {
        beforeEach(function() {
            this.test_pages = [
                {url: 'link1', thumb_url: 'thumb1', name: 'page1', index: 1},
                {url: 'link2', thumb_url: 'thumb2', name: 'page2', index: 2},
                {url: 'link3', thumb_url: 'thumb3', name: 'page3', index: 3},
                {url: 'link4', thumb_url: 'thumb4', name: 'page4', index: 4},
                {url: 'link5', thumb_url: 'thumb5', name: 'page5', index: 5},
                {url: 'link6', thumb_url: 'thumb6', name: 'page6', index: 6},
                {url: 'link7', thumb_url: 'thumb7', name: 'page7', index: 7},
            ];
            this.book.addPages(this.test_pages);
        });

        it("should get page 2 when starting at page 3", function () {
            this.book.pageNumber(3);

            var page = this.book.nextPageLeft();

            expect(page.name).toEqual('page2');
        });

        it("should get page 1 when starting at page 1", function () {
            this.book.pageNumber(1);

            var page = this.book.nextPageLeft();

            expect(page.name).toEqual('page1');
        });

        it("should get page 1 when starting at page 3 and dual page enabled", function () {
            this.book.pageNumber(3);
            this.book.dualPage(true);

            var page = this.book.nextPageLeft();

            expect(page.name).toEqual('page1');
        });

        it("should get page 1 when starting at page 2 and dual page enabled", function () {
            this.book.pageNumber(2);
            this.book.dualPage(true);

            var page = this.book.nextPageLeft();

            expect(page.name).toEqual('page1');
        });

        it("should get page 4 when starting at page 3 and right-to-left enabled", function () {
            this.book.pageNumber(3);
            this.book.rightToLeft(true);

            var page = this.book.nextPageLeft();

            expect(page.name).toEqual('page4');
        });

        it("should get page 7 when starting at page 7 and right-to-left enabled", function () {
            this.book.pageNumber(7);
            this.book.rightToLeft(true);

            var page = this.book.nextPageLeft();

            expect(page.name).toEqual('page7');
        });

        it("should get page 5 when starting at page 3 and dual-page and right-to-left enabled", function () {
            this.book.pageNumber(3);
            this.book.rightToLeft(true);
            this.book.dualPage(true);

            var page = this.book.nextPageLeft();

            expect(page.name).toEqual('page5');
        });

        it("should get page 6 when starting at page 7 and dual-page and right-to-left enabled", function () {
            this.book.pageNumber(6);
            this.book.rightToLeft(true);
            this.book.dualPage(true);

            var page = this.book.nextPageLeft();

            expect(page.name).toEqual('page7');
        });
    });

    describe("when getting page to right", function() {
        beforeEach(function() {
            this.test_pages = [
                {url: 'link1', thumb_url: 'thumb1', name: 'page1', index: 1},
                {url: 'link2', thumb_url: 'thumb2', name: 'page2', index: 2},
                {url: 'link3', thumb_url: 'thumb3', name: 'page3', index: 3},
                {url: 'link4', thumb_url: 'thumb4', name: 'page4', index: 4},
                {url: 'link5', thumb_url: 'thumb5', name: 'page5', index: 5},
                {url: 'link6', thumb_url: 'thumb6', name: 'page6', index: 6},
                {url: 'link7', thumb_url: 'thumb7', name: 'page7', index: 7},
            ];
            this.book.addPages(this.test_pages);
        });

        it("should get page 4 when on page 3", function() {
            this.book.pageNumber(3);

            var page = this.book.nextPageRight();

            expect(page.name).toEqual('page4');
        });

        it("should get page 7 when on page 7", function() {
            this.book.pageNumber(7);

            var page = this.book.nextPageRight();

            expect(page.name).toEqual('page7');
        });

        it("should get page 5 when on page 3 and dual-page enabled", function() {
            this.book.pageNumber(3);
            this.book.dualPage(true);

            var page = this.book.nextPageRight();

            expect(page.name).toEqual('page5');
        });

        it("should get page 7 when on page 6 and dual-page enabled", function() {
            this.book.pageNumber(6);
            this.book.dualPage(true);

            var page = this.book.nextPageRight();

            expect(page.name).toEqual('page7');
        });

        it("should get page 2 when on page 3 and right-to-left enabled", function() {
            this.book.pageNumber(3);
            this.book.rightToLeft(true);

            var page = this.book.nextPageRight();

            expect(page.name).toEqual('page2');
        });

        it("should get page 1 when on page 1 and right-to-left enabled", function() {
            this.book.pageNumber(1);
            this.book.rightToLeft(true);

            var page = this.book.nextPageRight();

            expect(page.name).toEqual('page1');
        });

        it("should get page 2 when on page 4 and dual-page and right-to-left enabled", function() {
            this.book.pageNumber(4);
            this.book.rightToLeft(true);
            this.book.dualPage(true);

            var page = this.book.nextPageRight();

            expect(page.name).toEqual('page2');
        });

        it("should get page 1 when on page 2 and dualpage and right-to-left enabled", function() {
            this.book.pageNumber(2);
            this.book.rightToLeft(true);

            var page = this.book.nextPageRight();

            expect(page.name).toEqual('page1');
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
