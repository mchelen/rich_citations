// Copyright (c) 2014 Public Library of Science

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

/** @jsx React.DOM */
//= require jquery
//= require react
var paper_doi = "10.12345/09876";

var TestUtils = React.addons.TestUtils;
var testRef = {
      "sections": {
        "Introduction": 1
      },
      "mentions": 1,
      "median_co_citations": 0.0,
      "citation_groups": [
        {
          "word_position": 21,
          "section": "Introduction",
          "context": {
              text_before: "Bacon ipsum dolor sit amet jerky pork loin pariatur pork chop, salami do aliqua fatback. ",
              citation: "[1]",
              text_after: " Venison filet mignon exercitation adipisicing meatloaf veniam. ",
              ellipses_after: "\u2026"
          },
          "references": [
            "pone.0000000-Doe1"
          ],
          "count": 1
        },
      ],
      "bibliographic": {
        "author": [
          {
            "given": "J",
            "family": "Doe"
          }
        ],
        "page": "79-95",
        "issued": {
          "date-parts": [
            [
              2007
            ]
          ]
        },
        "volume": "2",
        "title": "The best ever",
        "container-title": "Journal of Silly Studies",
        "container-type": "journal",
        "text": "Doe J ( 2007 ) The best ever. Journal of Silly Studies 2: 79\u201395."
      },
      "number": 1,
      "id": "pone.0000000-Doe1"
    };

var testRefWithDoi = $.extend(true, {}, testRef, {"bibliographic": {"uri": "10.12345/67890", "uri_type": "doi"}});

var spinnerPath = '/assets/loader.gif';

test("jquery quote id", function() {
    equal(jq("hello.world"), "#hello\\.world");
    equal(jq("hello:world"), "#hello\\:world");
    equal(jq("hello_world"), "#hello_world");
});

test("arraySorter", function () {
    equal(0, arraySorter({sort: ["a"]}, {sort: ["a"]}));
    equal(0, arraySorter({sort: [null]}, {sort: ["a"]}));
    equal(0, arraySorter({sort: ["a"]}, {sort: [null]}));
    equal(-1, arraySorter({sort: ["a"]}, {sort: ["b"]}));
    equal(0, arraySorter({sort: ["a", 1]}, {sort: ["a", 1]}));
    equal(-1, arraySorter({sort: ["a", 1]}, {sort: ["a", 2]}));
    equal(1, arraySorter({sort: ["a", 1]}, {sort: ["a", 0]}));
    var alpha = {sort: ["a", 0, 2, 3]};
    var beta =  {sort: ["a", 1, 1, 1]};
    equal([beta, alpha].sort(arraySorter)[0], alpha);
});

test("mkSortString", function () {
    strictEqual(mkSortString("Hello, world"), "hello world");
    strictEqual(mkSortString("the standard hello world of computing"), "standard hello world of computing");
});

test("mkSortField", function () {
    stop();
    $.getJSON("/papers/10.1371/journal.pone.0067380?format=json").
        done(function (fixture) {
            var ref = fixture.references[54];
            strictEqual(1, mkSortField(ref, "mentions"));
            strictEqual(55, mkSortField(ref, "appearance"));
            strictEqual("lowry d", mkSortField(ref, "author"));
            strictEqual(2008, mkSortField(ref, "year"));
            strictEqual(55, mkSortField(ref, "number"));
            strictEqual("journal of royal society interface", mkSortField(ref, "journal"));

            /* reference with no bibliographic info */
            var refNoInfo = {id: "pone.0067380-Wahnbaeck1",
                             bibliographic: {}};
            strictEqual(null, mkSortField(refNoInfo, "author"));
            strictEqual(null, mkSortField(refNoInfo, "year"));
            strictEqual(null, mkSortField(refNoInfo, "journal"));
            
            /* anything else should return null */
            strictEqual(null, mkSortField(ref, "foobar"));
            start();
        });
});

test("mkSearchResultsFilter", function () {
    stop();
    $.getJSON("/papers/10.1371/journal.pone.0067380?format=json").
        done(function (fixture) {
            var filter = mkSearchResultsFilter(buildIndex(buildReferenceData(fixture, true)), "odontodactylus");
            var results = _.filter(fixture.references, filter);
            strictEqual(results.length, 1);
            strictEqual(results[0].id, "pone.0067380-Patek1");
            start();
        });
});

test("buildReferenceData", function () {
    stop();
    $.getJSON("/papers/10.1371/journal.pone.0067380?format=json").
        done(function (fixture) {
            var data = buildReferenceData(fixture, true);
            strictEqual(data["pone.0067380-Aalbers1"].uri, "http://dx.doi.org/10.1111/j.1095-8649.2010.02616.x");
            start();
        });
});

test("buildIndex", function () {
    stop();
    $.getJSON("/papers/10.1371/journal.pone.0067380?format=json").
        done(function (fixture) {
            var idx = buildIndex(buildReferenceData(fixture, true));
            var results = idx.search("odontodactylus");
            strictEqual(results.length, 1);
            strictEqual(results[0].ref, "pone.0067380-Patek1");
            start();
        });
});

test("sortReferences", function () {
    stop();
    $.getJSON("/papers/10.1371/journal.pone.0067380?format=json").
        done(function (fixture) {
            
            var refs = buildReferenceData(fixture, true);
            _.each([{by: "appearance",
                     first: "pone.0067380-Clua1",
                     last: "pone.0067380-Lowry1",
                     sortableCount: 55,
                     unsortableCount: 0},
                     {by: "repeated",
                      first: "pone.0067380-Clua1",
                      last: "pone.0067380-Deecke1",
                      sortableCount: 89,
                      unsortableCount: 0}],
                   function (d) {
                       var results = sortReferences(refs, d.by);
                       strictEqual(results.unsortable.length, d.unsortableCount);
                       strictEqual(results.sorted.length, d.sortableCount);
                       strictEqual(results.sorted[0].data.id, d.first);
                       strictEqual(results.sorted[results.sorted.length-1].data.id, d.last);
                   });
            start();
        });
});

test("guid generator", function() {
    var guid1 = guid();
    var guid2 = guid();
    notEqual(guid1, guid2);

    ok(guid2.match("^[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}$"));
});

test("extract and generated citation reference ids", function() {
    var id = "pone.0067380-Sperone2";
    strictEqual(extractCitationReferenceInfo("pone.0067380-Sperone2"), null);
    strictEqual(extractCitationReferenceInfo(generateCitationReferenceId(id, 0)).id, id);
    strictEqual(extractCitationReferenceInfo(generateCitationReferenceId(id, 0)).count, 0);
    strictEqual(generateCitationReferenceId("pone.0067380-Sperone2", 0), "ref_" + id + "_0");
});

test("formatAuthorNameInvertedInitials", function() {
    strictEqual(formatAuthorNameInvertedInitials({given: "Jane", family: "Roe"}), "Roe J");
    strictEqual(formatAuthorNameInvertedInitials({given: "Mary Jane", family: "Roe"}), "Roe MJ");
    strictEqual(formatAuthorNameInvertedInitials({given: "Jane", family: "Roe Doe"}), "Roe Doe J");
    strictEqual(formatAuthorNameInvertedInitials({given: "Jane", family: "Roe-Doe"}), "Roe-Doe J");
    strictEqual(formatAuthorNameInvertedInitials({family: "Doe"}), "Doe");
});

test("formatAuthorNameInverted", function() {
    strictEqual(formatAuthorNameInverted({given: "Jane", family: "Roe"}), "Roe, Jane");
    strictEqual(formatAuthorNameInverted({given: "Mary Jane", family: "Roe"}), "Roe, Mary Jane");
    strictEqual(formatAuthorNameInverted({given: "Jane", family: "Roe Doe"}), "Roe Doe, Jane");
    strictEqual(formatAuthorNameInverted({given: "Jane", family: "Roe-Doe"}), "Roe-Doe, Jane");
    strictEqual(formatAuthorNameInverted({family: "Doe"}), "Doe");
});

test("ordinalStr", function() {
    strictEqual(ordinalStr(1), "1st");
    strictEqual(ordinalStr(2), "2nd");
    strictEqual(ordinalStr(3), "3rd");
    strictEqual(ordinalStr(1000), "1000th");
    strictEqual(ordinalStr(1011), "1011th");
    strictEqual(ordinalStr(1021), "1021st");
});

test("author list", function() {
    var updateHighlightingCalled = false;
    var a = {given: "Jane", family: "Roe"};
    var b = {given: "Joan", family: "Roe"};
    var c = {given: "John", family: "Doe"};
    var d = {given: "James", family: "Doe"};
    var e = {given: "Jennifer", family: "Roe"};
    /* can't make JSX transform work at the moment */
    var authorList4 = ReferenceAuthorList({authors: [a, b, c, d], authorMax: 3, updateHighlighting: function(){}});
    var authorList5 = ReferenceAuthorList({authors: [a, b, c, d, e],
                                           authorMax: 3, 
                                           updateHighlighting: function(){
                                               updateHighlightingCalled=true;
                                           }});
    var authorList6 = ReferenceAuthorList({authors: [a, a, a, a, a, a, a, a],
                                           authorMax: 5,
                                           updateHighlighting: function(){}});
    TestUtils.renderIntoDocument(authorList4);
    TestUtils.renderIntoDocument(authorList5);
    TestUtils.renderIntoDocument(authorList6);
    var span4 = TestUtils.findRenderedDOMComponentWithClass(authorList4, 'reference-authors');
    var span5 = TestUtils.findRenderedDOMComponentWithClass(authorList5, 'reference-authors');
    var span6 = TestUtils.findRenderedDOMComponentWithClass(authorList6, 'reference-authors');
    /* all four names should display */
    strictEqual(span4.getDOMNode().textContent, "Roe J, Roe J, Doe J, Doe J");
    /* 2 refs of 5 should be hidden */
    strictEqual(span5.getDOMNode().textContent, "Roe J, Roe J, Doe J, (and 2 more)");
    /* should expand on click */
    var input = TestUtils.findRenderedDOMComponentWithTag(span5, 'a');
    strictEqual(false, updateHighlightingCalled);
    TestUtils.Simulate.click(input);
    strictEqual(span5.getDOMNode().textContent, "Roe J, Roe J, Doe J, Doe J, Roe J");

    /* using 5 as authorMax should display 5 authors (and 3 more) */
    strictEqual(span6.getDOMNode().textContent, "Roe J, Roe J, Roe J, Roe J, Roe J, (and 3 more)");

    /* ensure that updateHighlighting was called */
    strictEqual(true, updateHighlightingCalled);
});

test("abstract display", function() {
    var abs = ReferenceAbstract({ text: "foo bar baz" });
    TestUtils.renderIntoDocument(abs);
    var div = TestUtils.findRenderedDOMComponentWithTag(abs, "div");
    strictEqual(div.getDOMNode().textContent, "▸ Show abstract");
    var input = TestUtils.findRenderedDOMComponentWithTag(abs, 'button');
    TestUtils.Simulate.click(input);
    strictEqual(div.getDOMNode().textContent, "▾ Show abstractfoo bar baz");
});

test("search bar", function() {
    /* test that updating search text will call function with changed text */
    var text = "";
    var f = function(foo) { text = foo; };
    var sb = SearchBar({ filterText: text, onSearchUpdate: f});
    TestUtils.renderIntoDocument(sb);
    var input = TestUtils.findRenderedDOMComponentWithTag(sb, "input");
    TestUtils.Simulate.change(input, {target : { value: "foo" }});
    strictEqual(text, "foo");
});

test("reference with DOI has link", function() {
    var r = ReferenceCore({reference: testRefWithDoi});
    TestUtils.renderIntoDocument(r);
    var title = TestUtils.findRenderedDOMComponentWithClass(r, "reference-link");
    strictEqual(title.getDOMNode().getAttribute("href"), "/interstitial?from=10.12345%2F09876&to=1");
});

test("reference without DOI has no link", function() {
    var r = ReferenceCore({reference: testRef});
    TestUtils.renderIntoDocument(r);
    throws(
        function() {
            TestUtils.findRenderedDOMComponentWithClass(r, "reference-link");
        });
});

test("full reference", function() {
    var r = Reference({reference: testRefWithDoi});
    TestUtils.renderIntoDocument(r);
    equal(r.getDOMNode().textContent, "Doe J (2007)The best everJournal of Silly StudiesDownload reference (BibTeX) (RIS)▸ 1 appearance in this article.");
});

test("withReferenceData", function() {
    stop();
    withReferenceData("10.1371/journal.pone.0097164", function (data) {
        strictEqual(data.references[65].bibliographic.author[0].family, "Pütz");
        start();
    });
});

test("CrossmarkBadge", function() {
    var r = CrossmarkBadge({reference: {bibliographic: {}, updated_by: [{"type": "retraction"}]}});
    TestUtils.renderIntoDocument(r);
    strictEqual(r.getDOMNode().textContent, "RETRACTED");

    var u = CrossmarkBadge({reference: {bibliographic: {}, updated_by: [{"type": "updated"}]}});
    TestUtils.renderIntoDocument(u);
    strictEqual(u.getDOMNode().textContent, "UPDATED");

    var n = CrossmarkBadge({reference: {bibliographic: {}}});
    TestUtils.renderIntoDocument(n);
    strictEqual(n.getDOMNode().textContent, "");
});

test("ReferenceAppearanceListRevealable with 1 mention in reference list", function() {
    var l = ReferenceAppearanceListRevealable({ reference: testRef });
    var x = TestUtils.renderIntoDocument(l);
    strictEqual(x.getDOMNode().textContent, "▸ 1 appearance in this article.");
});

test("ReferenceAppearanceListRevealable with 1 mention in popover", function() {
    var l = ReferenceAppearanceListRevealable({ reference: testRef, currentMention: 0 });
    var x = TestUtils.renderIntoDocument(l);
    strictEqual(x.getDOMNode().textContent, "Appears once in this article.");
});

test("ReferenceAppearanceList", function() {
    var l = ReferenceAppearanceList({ reference: testRef, currentMention: 0 });
    var x = TestUtils.renderIntoDocument(l);
    strictEqual(x.getDOMNode().textContent, "IntroductionBacon ipsum dolor sit amet jerky pork loin pariatur pork chop, salami do aliqua fatback. [1] Venison filet mignon exercitation adipisicing meatloaf veniam. …");
});

test("Revealable", function() {
    var r = Revealable({revealText: "foo", children: ["baz"]});
    TestUtils.renderIntoDocument(r);
    strictEqual(r.getDOMNode().textContent, "▸ foo");
    var input = TestUtils.findRenderedDOMComponentWithTag(r, 'button');
    TestUtils.Simulate.click(input);
    strictEqual(r.getDOMNode().textContent, "▾ foobaz");
});

test("Maybe", function() {
    var t = Maybe({test: true, children: ["foo"]});
    TestUtils.renderIntoDocument(t);
    strictEqual(t.getDOMNode().textContent, "foo");

    var f = Maybe({test: false, children: ["foo"]});
    TestUtils.renderIntoDocument(f);
    strictEqual(f.getDOMNode().textContent, "");
});

var groups = [
    {"count": 1,
     "references": [
        "pone.0000000-Doe1"
     ],
     "section": "Introduction",
     "context": {
         text_before: "Bacon ipsum dolor sit amet jerky pork loin pariatur pork chop, salami do aliqua fatback. ",
         citation: "[1]",
         text_after: " Venison filet mignon exercitation adipisicing meatloaf veniam. ",
         ellipses_after: "\u2026"
     },
     "word_position": 50
    },
    {"count": 2,
     "references": [
         "pone.0000000-Doe1",
         "pone.0000000-Doe2"
     ],
     "section": "Introduction",
     "context": {
         text_before: "Bacon ipsum dolor sit amet jerky pork loin pariatur pork chop, salami do aliqua fatback. ",
         citation: "[1], [2]",
         text_after: " Venison filet mignon exercitation adipisicing meatloaf veniam. ",
         ellipses_after: "\u2026"
     },
     "word_position": 100
    },
    {"count": 3,
     "references": [
         "pone.0000000-Doe1",
         "pone.0000000-Doe2",
         "pone.0000000-Doe3"
     ],
     "section": "Introduction",
     "context": {
         text_before: "Bacon ipsum dolor sit amet jerky pork loin pariatur pork chop, salami do aliqua fatback. ",
         citation: "[1]-[3]",
         text_after: " Venison filet mignon exercitation adipisicing meatloaf veniam. ",
         ellipses_after: "\u2026"
     },
     "word_position": 150
    }
];

var citationFixtureHTML = "Bacon ipsum dolor sit amet jerky pork loin pariatur pork chop, salami do aliqua fatback. [<a href='#pone.0000000-Doe1'>1</a>] Venison filet mignon exercitation adipisicing meatloaf veniam. Bacon ipsum dolor sit amet jerky pork loin pariatur pork chop, salami do aliqua fatback. [<a href='#pone.0000000-Doe1'>1</a>], [<a href='#pone.0000000-Doe2'>2</a>] Venison filet mignon exercitation adipisicing meatloaf veniam Bacon ipsum dolor sit amet jerky pork loin pariatur pork chop, salami do aliqua fatback. [<a href='#pone.0000000-Doe1'>1</a>]-[<a href='#pone.0000000-Doe3'>3</a>] Venison filet mignon exercitation adipisicing meatloaf veniam <ol class='references'><li><a id='pone.0000000-Doe1'/>Doe1</a></li><li><a id='pone.0000000-Doe2'/>Doe2</a></li><li><a id='pone.0000000-Doe3'/>Doe3</a></li></ol>";

test("citationIterator", function() {
    citationSelector = "a[href^='#pone.0000000']";
    var $fixture = $("#qunit-fixture");
    $fixture.append(citationFixtureHTML);
    var handleSingle = sinon.spy();
    var handleElided = sinon.spy();
    var handleBeginElissionGroup = sinon.spy();
    var handleEndElissionGroup = sinon.spy();
    citationIterator(groups, handleSingle, handleBeginElissionGroup, handleElided, handleEndElissionGroup);
    strictEqual(handleSingle.callCount, 3);
    strictEqual($(handleSingle.getCall(0).args[0]).attr('href'), "#pone.0000000-Doe1");
    strictEqual(handleSingle.getCall(0).args[1], "pone.0000000-Doe1");
    strictEqual(handleSingle.getCall(0).args[2], 0);
    strictEqual($(handleSingle.getCall(1).args[0]).attr('href'), "#pone.0000000-Doe1");
    strictEqual(handleSingle.getCall(1).args[1], "pone.0000000-Doe1");
    strictEqual(handleSingle.getCall(1).args[2], 1);
    strictEqual($(handleSingle.getCall(2).args[0]).attr('href'), "#pone.0000000-Doe2");
    strictEqual(handleSingle.getCall(2).args[1], "pone.0000000-Doe2");
    strictEqual(handleSingle.getCall(2).args[2], 0);

    strictEqual(handleBeginElissionGroup.callCount, 1);
    strictEqual($(handleBeginElissionGroup.getCall(0).args[0]).attr('href'), "#pone.0000000-Doe1");
    strictEqual(handleBeginElissionGroup.getCall(0).args[1], "pone.0000000-Doe1");
    strictEqual(handleBeginElissionGroup.getCall(0).args[2], 2);

    strictEqual(handleElided.callCount, 1);
    strictEqual($(handleElided.getCall(0).args[0]).attr('href'), "#pone.0000000-Doe3");
    strictEqual(handleElided.getCall(0).args[1], "pone.0000000-Doe2");
    strictEqual(handleElided.getCall(0).args[2], 1);

    strictEqual(handleEndElissionGroup.callCount, 1);
    strictEqual($(handleEndElissionGroup.getCall(0).args[0]).attr('href'), "#pone.0000000-Doe1");
    strictEqual($(handleEndElissionGroup.getCall(0).args[1]).attr('href'), "#pone.0000000-Doe3");
    deepEqual(handleEndElissionGroup.getCall(0).args[2], ["pone.0000000-Doe1","pone.0000000-Doe2","pone.0000000-Doe3"]);
    deepEqual(handleEndElissionGroup.getCall(0).args[3], [2, 1, 0]);
});

test("addCitationIds", function() {
    citationSelector = "a[href^='#pone.0000000']";
    var $fixture = $("#qunit-fixture");
    $fixture.append(citationFixtureHTML);
    addCitationIds(groups);
    var cites1 = $("a[href='#pone.0000000-Doe1']");
    strictEqual($(cites1).first().attr('id'), 'ref_pone.0000000-Doe1_0');
    strictEqual($(cites1).slice(1).first().attr('id'), 'ref_pone.0000000-Doe1_1');
    strictEqual($(cites1).slice(2).first().attr('id'), 'ref_pone.0000000-Doe1_2');

    var cites2 = $("a[id^='ref_pone.0000000-Doe2_']");
    strictEqual($(cites2).first().attr('id'), 'ref_pone.0000000-Doe2_0');
    strictEqual($(cites2).slice(1).first().attr('id'), 'ref_pone.0000000-Doe2_1');

    var cites3 = $("a[href='#pone.0000000-Doe3']");
    strictEqual($(cites3).first().attr('id'), 'ref_pone.0000000-Doe3_0');
});
    
test("render mention", function() {
    var mention = MentionContext({context: {
        "ellipses_before": "…",
        "text_before": "schooling fishes [37]. To overcome the confusing defense mechanism of fish schooling, predators have had to adopt different hunting strategies ",
        "citation": "[38], [39]",
        "text_after": ".",
        "quote": "…schooling fishes [37]. To overcome the confusing defense mechanism of fish schooling, predators have had to adopt different hunting strategies [38], [39]."
    }});
    var span = TestUtils.renderIntoDocument(mention);
    var bold = TestUtils.findRenderedDOMComponentWithTag(mention, 'b');
    strictEqual(span.getDOMNode().textContent, "…schooling fishes [37]. To overcome the confusing defense mechanism of fish schooling, predators have had to adopt different hunting strategies [38], [39].");
    strictEqual(bold.getDOMNode().textContent, "[38], [39]");
});

test("get license shorthand", function() {
    strictEqual(getLicenseShorthand({}), "paywall");
    strictEqual(getLicenseShorthand({bibliographic: {}}), "paywall");
    strictEqual(getLicenseShorthand({bibliographic: {license: "CC-BY"}}), "read-and-reuse");
    strictEqual(getLicenseShorthand({bibliographic: {license: 'cc-by'}}), 'read-and-reuse');
    strictEqual(getLicenseShorthand({bibliographic: {license: 'cc-by-nc-nd'}}), 'read');
    strictEqual(getLicenseShorthand({bibliographic: {license: 'cc-by-nc-sa'}}), 'read-and-reuse');
    strictEqual(getLicenseShorthand({bibliographic: {license: 'cc-nc'}}), 'read-and-reuse');
    strictEqual(getLicenseShorthand({bibliographic: {license: 'cc-nc-nd'}}), 'read');
    strictEqual(getLicenseShorthand({bibliographic: {license: 'cc-nc-sa'}}), 'read-and-reuse');
    strictEqual(getLicenseShorthand({bibliographic: {license: 'cc-zero'}}), 'read-and-reuse');
    strictEqual(getLicenseShorthand({bibliographic: {license: 'failed-to-obtain-license'}}), 'paywall');
    strictEqual(getLicenseShorthand({bibliographic: {license: 'free-to-read'}}), 'read');
    strictEqual(getLicenseShorthand({bibliographic: {license: 'other-closed'}}), 'paywall');
    strictEqual(getLicenseShorthand({bibliographic: {license: 'other-pd'}}), 'read-and-reuse');
    strictEqual(getLicenseShorthand({bibliographic: {license: 'plos-who'}}), 'read-and-reuse');
    strictEqual(getLicenseShorthand({bibliographic: {license: 'uk-ogl'}}), 'read-and-reuse');
});

test("mkHeadingGrouper", function() {
    var licenseGrouper = mkHeadingGrouper("license");
    strictEqual(licenseGrouper({data: {}}), "paywall");
    strictEqual(licenseGrouper({data: {bibliographic:{}}}), "paywall");
    strictEqual(licenseGrouper({data: {bibliographic:{license: "cc-by"}}}), "read-and-reuse");
});
