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
	
	it("should be able to extract pages from the DOM", function() {
		var markup = '<div>'+
			'<a class="page-link" data-index="0" href="#foo">Link1</a>'+
			'<a class="page-link" data-index="1" href="#bar">Link2</a>'+
			'<a class="page-link" data-index="2" href="#baz">Link3</a>'+
			'</div>';
		this.book.base_node = markup;
		this.book.setDomNodes();
		
		this.book.getDataFromDom(markup);
		
		expect(this.book.pages()[0]).toEqual(new ComicPage('#foo', 'Link1', 0));
		expect(this.book.pages()[1]).toEqual(new ComicPage('#bar', 'Link2', 1));
		expect(this.book.pages()[2]).toEqual(new ComicPage('#baz', 'Link3', 2));
	});
	
	it("should be able to extract book info from the DOM", function() {
		var markup = '<div>'+
			'<span class="book-name">foo</span>' +
			'<span class="book-filepath">fizz/buzz</span>'
			'</div>';
		this.book.base_node = markup;
		this.book.setDomNodes();
		
		this.book.getDataFromDom(markup);
		
		expect(this.book.name()).toEqual('foo');
		expect(this.book.relpath).toEqual('fizz/buzz');
	});
	
	it("should be able to set and fetch the current page", function() {
		this.book.addPages(this.test_pages);
		spyOn(this.book, 'setPageInDom');
		
		expect(this.book.currentPage()).toEqual(this.test_pages[0]);
		
		this.book.goToPage(3);
		
		expect(this.book.currentPage()).toEqual(this.test_pages[2]);
		expect(this.book.setPageInDom).toHaveBeenCalled();
	});
	
	it("should track page number", function() {
		this.book.addPages(this.test_pages);
		
		this.book.goToNext();
		expect(this.book.pageNumber()).toEqual(2);
		
		this.book.goToNext();
		expect(this.book.pageNumber()).toEqual(3);
		
		this.book.goToPrev();
		expect(this.book.pageNumber()).toEqual(2);
	});
	
	it("should be able to go to navigate back and forth", function() {
		this.book.addPages(this.test_pages);
		spyOn(this.book, 'setPageInDom');
		
		this.book.goToPage(2);
		this.book.goToNext();
		
		expect(this.book.currentPage()).toEqual(this.test_pages[2]);
		
		this.book.goToPrev();
		
		expect(this.book.currentPage()).toEqual(this.test_pages[1]);
		expect(this.book.setPageInDom.calls.count()).toEqual(3);
	});
	
	it("should report all page numbers starting from one", function() {
		this.book.addPages(this.test_pages);
		
		expect(this.book.allPageNumbers()[0]).toEqual(1);
		expect(this.book.allPageNumbers().length).toEqual(3);
	});
	
	it("should ignore navigation to before first page", function() {
		this.book.addPages(this.test_pages);
		
		expect(this.book.pageNumber()).toEqual(1);
		
		this.book.goToPrev();
		
		expect(this.book.pageNumber()).toEqual(1);
		
		this.book.goToPage(2)
		this.book.goToPage(0);
		
		expect(this.book.pageNumber()).toEqual(2);
	});
	
	it("should ignore navigation to after last page", function() {
		this.book.addPages(this.test_pages);
		this.book.goToPage(3);
		
		expect(this.book.pageNumber()).toEqual(3);
		
		this.book.goToNext();
		
		expect(this.book.pageNumber()).toEqual(3);
		
		this.book.goToPage(2);
		this.book.goToPage(4);
		
		expect(this.book.pageNumber()).toEqual(2);
	});
	
});