////
//// Some unit testing for package bbop-rest-manager.
////

var chai = require('chai');
chai.config.includeStack = true;
var assert = chai.assert;
var managers = require('..');

var manager_base = managers.base;
var manager_node = managers.node;
var manager_sync_request = managers.sync_request;
var manager_jquery = managers.jquery;

// Correct environment, ready testing.
var bbop = require('bbop-core');
var response_base = require('bbop-rest-response').base;
var response_json = require('bbop-rest-response').json;

///
/// Start unit testing.
///

describe('bbop-rest-manager#base + bbop-rest-response#base', function(){

    it('basic sync (watch callback)', function(){

	// 
	var str = '';
	var m = new manager_base(response_base);
	//m.debug(true);
	m.register('success', function(resp, man){
	    str = str + 'A';
	});
	m.resource('foo');

	m.fetch();
	assert.equal(str, 'A', 'simple: round trip: A');
	m.fetch();
	assert.equal(str, 'AA', 'simple: another round trip: AA');
    });

    it('basic sync (watch response)', function(){

	// 
	var str = '';
	var m = new manager_base(response_base);
	m.resource('foo');

	var r = m.fetch();
	assert.equal(r.okay(), true, 'resp okay');
	assert.equal(r.message_type(), 'success', 'resp message type');
	assert.equal(r.message(), 'empty', 'resp message');
    });

    it('basic async (watch callback)', function(){

	// 
	var str = '';
	var m = new manager_base(response_base);
	//m.debug(true);
	m.register('success', function(resp, man){
	    str = str + 'A';
	});
	m.resource('foo');

	m.start();
	assert.equal(str, 'A', 'simple: round trip: A');
	m.start();
	assert.equal(str, 'AA', 'simple: another round trip: AA');
    });

    it('basic async (watch promise)', function(){

	// 
	var str = '';
	var m = new manager_base(response_base);
	m.resource('foo');

	var d = m.start();
	d.then(function(r){
	    assert.equal(r.okay(), true, 'resp okay');
	    assert.equal(r.message_type(), 'success', 'resp message type');
	    assert.equal(r.message(), 'empty', 'resp message');
	}).done();
    });
});

describe('bbop-rest-manager#base + bbop-rest-response#json', function(){
    
    it('mostly just testing the response here, tested manager above', function(){
	
	// 
	var total = 0;
	var m = new manager_base(response_json);
	//m.debug(true);
	m.register('success', function(resp, man){
	    //console.log('rr', resp.raw());
	    total += resp.raw()['foo']['bar'];
	});

	m.start('foo', {"foo": {"bar": 1}});
	assert.equal(total, 1, 'json round trip: 1');
	m.start();
	assert.equal(total, 2, 'json another trip: 2');
	m.start('bar', {"foo": {"bar": 2}});
	assert.equal(total, 4, 'json another trip: 4');
	
    });
});

describe('bbop-rest-manager#node + bbop-rest-response#json', function(){
    
    it('basic successful async (callbacks)', function(){
	
	var target = 'http://amigo.geneontology.org/amigo/term/GO:0022008/json';
     
	var m = new manager_node(response_json);
	m.register('success', function(resp, man){
	    var type = resp.raw()['type'];
	    assert.equal(type, 'term', 'success callback');
	});
	m.register('error', function(resp, man){
	    assert.equal(true, false, 'error callback is not expected');
	});	    
	m.start(target);
    });

    it('basic successful async (promise)', function(){
	
	var target = 'http://amigo.geneontology.org/amigo/term/GO:0022008/json';
	
	var m = new manager_node(response_json);
	var d = m.start(target);
	d.then(function(resp){
	    //console.log('resp', resp);
	    var type = resp.raw()['type'];
	    assert.equal(type, 'term', 'success callback');
	}).done();
	
    });

    it('basic error async (callback)', function(){
	
	// Remote 500 error.
	var target = 'http://amigo.geneontology.org/amigo/term/GO:0022008/jso';
     
	var m = new manager_node(response_json);
	m.register('error', function(resp, man){
	    assert.equal(true, true, 'successful failure');
	});	    
	m.start(target);
	
    });

    it('basic error async (promise)', function(){
	
	var target = 'http://amigo.geneontology.org/amigo/term/GO:0022008/jso';
	
	var m = new manager_node(response_json);
	var d = m.start(target);
	d.then(function(resp){
	    //console.log('resp', resp);
	    //var type = resp.raw()['type'];
	    assert.equal(resp.okay(), false, 'bad response promise');
	}).done();
	
    });

});

describe('bbop-rest-manager#sync_request + bbop-rest-response#json', function(){
    
    it('basic successful sync (direct reponse)', function(){
	
    	var target = 'http://amigo.geneontology.org/amigo/term/GO:0022008/json';
     
    	var m = new manager_sync_request(response_json);
    	var resp = m.fetch(target);
    	var type = resp.raw()['type'];
    	assert.equal(type, 'term', 'success callback');
	
    });

    it('basic successful sync (callback)', function(){
	
    	var target = 'http://amigo.geneontology.org/amigo/term/GO:0022008/json';
     
    	var m = new manager_sync_request(response_json);
    	m.register('success', function(resp, man){
    	    var type = resp.raw()['type'];
    	    assert.equal(type, 'term', 'success callback');
    	});
    	m.register('error', function(resp, man){
    	    assert.equal(true, false, 'error callback is not expected');
    	});	    
    	var qurl = m.fetch(target);
	
    });

    it('basic error sync (callback)', function(){
	
    	// Remote 500 error.
    	var target = 'http://amigo.geneontology.org/amigo/term/GO:0022008/jso';
     
    	var m = new manager_sync_request(response_json);
    	m.register('success', function(resp, man){
    	    var type = resp.raw()['type'];
    	    assert.equal(true, false, 'success callback is not expected');
    	});
    	m.register('error', function(resp, man){
    	    assert.equal(true, true, 'successful failure');
    	});	    
    	m.fetch(target);
    });

    it('basic success sync (instant deferred)', function(){
	
    	var target = 'http://amigo.geneontology.org/amigo/term/GO:0022008/json';
     
    	var m = new manager_sync_request(response_json);
    	m.start(target).then(function(resp){
    	    var type = resp.raw()['type'];
    	    assert.equal(true, false, 'success callback is not expected');
	}).done();
    });

});

describe('bbop-rest-manager#jquery + bbop-rest-response#json', function(){
    

    var mock_jQuery = null;
    before(function(){
	// Modify the manager into functioning--will need this to get
	// tests working for jQuery in this environment.
	var domino = require('domino');
	mock_jQuery = require('jquery')(domino.createWindow());
	var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
	mock_jQuery.support.cors = true;
	mock_jQuery.ajaxSettings.xhr = function() {
	    return new XMLHttpRequest();
	};
    });

    it('test out mock jquery call with callback', function(){
	
    	var target = 'http://amigo.geneontology.org/amigo/term/GO:0022008/json';
     
	// Goose jQuery into functioning here.
    	var m = new manager_jquery(response_json);
	m.JQ = mock_jQuery;

    	m.register('success', function(resp, man){
    	    var type = resp.raw()['type'];
    	    assert.equal(true, true, 'successful failure');
    	});
    	m.register('error', function(resp, man){
    	    assert.equal(true, false, 'success callback is not expected');
    	});	    
    	m.start(target);

    });

    it('test out mock jquery call with promise', function(){
	
    	var target = 'http://amigo.geneontology.org/amigo/term/GO:0022008/json';
     
	// Goose jQuery into functioning here.
    	var m = new manager_jquery(response_json);
	m.JQ = mock_jQuery;

	// Try it out.
    	m.start(target).then(function(resp){
	    //console.log('resp', resp);
    	    var type = resp.raw()['type'];
    	    assert.equal(type, 'term', 'success callback is not expected');
	}).done();

    });

});
