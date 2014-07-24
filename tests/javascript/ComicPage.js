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
		expect(this.book.current_page).toEqual(0);
	});
	
	it("should allow adding multiple pages", function() {
		this.book.addPages([{name: 'foo'}]);
		
		expect(this.book.pages[0]).toEqual({name: 'foo'});
	});
	
	it("should allow adding a single page", function() {
		this.book.addPage({name: 'foo'});
		
		expect(this.book.pages[0]).toEqual({name: 'foo'});
	});
	
	it("should be able to extract pages from the DOM", function() {
		var markup = '<div>'+
			'<a class="page-link" data-index="0" href="#foo">Link1</a>'+
			'<a class="page-link" data-index="1" href="#bar">Link2</a>'+
			'<a class="page-link" data-index="2" href="#baz">Link3</a>'+
			'</div>';
		this.book.base_node = markup;
		this.book.setDomNodes();
		
		this.book.addPagesFromDom(markup);
		
		expect(this.book.pages[0]).toEqual(new ComicPage('#foo', 'Link1', 0));
		expect(this.book.pages[1]).toEqual(new ComicPage('#bar', 'Link2', 1));
		expect(this.book.pages[2]).toEqual(new ComicPage('#baz', 'Link3', 2));
	});
	
	it("should be able to set and fetch the current page", function() {
		this.book.addPages(this.test_pages);
		
		expect(this.book.currentPage()).toEqual(this.test_pages[0]);
		
		this.book.goToPage(3);
		
		expect(this.book.currentPage()).toEqual(this.test_pages[2]);
	});
	
	it("should be able to go to navigate back and forth", function() {
		this.book.addPages(this.test_pages);
		
		this.book.goToPage(2);
		this.book.goToNext();
		
		expect(this.book.currentPage()).toEqual(this.test_pages[2]);
		
		this.book.goToPrev();
		
		expect(this.book.currentPage()).toEqual(this.test_pages[1]);
	});
});