(function($) {

	$.fn.vuwRestWidget = function(options) {

if (!Array.prototype.forEach) {
    Array.prototype.forEach = function (fn, scope) {
        'use strict';
        var i, len;
        for (i = 0, len = this.length; i < len; ++i) {
            if (i in this) {
                fn.call(scope, this[i], i, this);
            }
        }
    };
}
            //kill legacy cookie
	    $.cookie('sessionID',null,{path:'/'});
	    $.cookie('sessionId',null,{path:'/'});

		var $_widget = this;

		/*le IE <3 <3 <3*/
		$.support.cors = true;

		$_widget.settings = $.extend({
			/*remember cross-domain (including cross-subdomain) requests require a correct Access-Control-Allow-Origin response header
		  NB: failed cross-domain ajax requests DO NOT trigger an error! the wheel just keeps spinning...*/
			/*Yet another NB:*/
			urlBase: 'http://www.victoria.ac.nz/webstruxure/DotNet2/1.0/fees',
			/*overridable, the widget can be initialized using a different template*/
			htmlTemplate: $('#detailed-template').html()
		}, options);

		/*keep a most recent json response dump*/
		$_widget._data = {};

		/*api actions*/
		$_widget.loadCart = function(_email) {
			/*_email (optional) is a valid email address
		  if _email is not being passed, load cart by sessionID*/
			$_widget.addClass('is-loading');
			!_email || ($_widget._data.email = _email);
			/*$.ajax implements the Promise interface, allowing chained callbacks
		  return the deferred object that can get callbacks added to*/
			return $.ajax({
				type: 'GET',
				url: $_widget.settings.urlBase + '/',
				data: _email ? {
					email: _email
				} : {
					sessionID: $_widget._data.sessionID
				}
			}).done(responseHandler).fail(errorHandler);
		};
		$_widget.newCart = function() {
					$.cookie('vuw-feescalc-sessionID', null, {
						path: '/'
					});
			$_widget.addClass('is-loading');
			return $.ajax({
				type: 'POST',
				url: $_widget.settings.urlBase + '/'
			}).done(responseHandler).fail(errorHandler);
		};
		$_widget.addToCart = function(_courselist) {
			$_widget.addClass('is-loading');
			return $.ajax({
				type: 'POST',
				url: $_widget.settings.urlBase + '/add/',
				data: {
					sessionID: $_widget._data.sessionID,
					courselist: _courselist
				}
			}).done(responseHandler).fail(errorHandler);
		};
		$_widget.removeFromCart = function(_itemID) {
			$_widget.addClass('is-loading');
			return $.ajax({
				type: 'POST',
				url: $_widget.settings.urlBase + '/remove/',
				data: {
					sessionID: $_widget._data.sessionID,
					itemID: _itemID
				}
			}).done(responseHandler).fail(errorHandler);
		};
		$_widget.saveCart = function(_email) {
			$_widget.addClass('is-loading');
			return $.ajax({
				type: 'POST',
				url: $_widget.settings.urlBase + '/save/',
				data: {
					sessionID: $_widget._data.sessionID,
					email: _email
				}
			}).done(responseHandler).fail(errorHandler);
		};
		$_widget.sendEmail = function(_email) {
			/*_email values can be either 'self' or 'advice'*/
			return $.ajax({
				type: 'POST',
				url: $_widget.settings.urlBase + '/send/',
				data: {
					sessionID: $_widget._data.sessionID,
					to: _email,
					feetype: $_widget._data.domestic ? 'd' : 'i',
					neworreturning: true ? 'new' : 'returning',
					comments: (_email === 'advice') ? $('#email_message').val() : ''
				}
			}).done(responseHandler).fail(errorHandler);
		};
		/*/api actions*/



		this.render = function() {
			if ($_widget._data.carts) {
				$_widget._data.carts.forEach(function(_cart) {

					if (_cart.items) {
						_cart.items.forEach(function(_item) {

							if (_item.code && _item.code.subject) {
								_item.code.linksubject = _item.code.subject.toLowerCase();
							}
						});
					}

				});
			}


			$_widget.html(Mustache.render($_widget.settings.htmlTemplate, $_widget._data));

			$_widget.removeClass('is-loading');

			$('#content .feescalc-course-btn-placeholder').each(function() {
				var $this = $(this);

				/*forget the heartbreaking loop;
			  just check the widget html for already having a button to remove the course!*/
				(function rerenderButton(_isRemoveButton, $_this) {
					$_this
						.toggleClass('add-courses', !_isRemoveButton)
						.toggleClass('primary', !_isRemoveButton)
						.toggleClass('a-delete', _isRemoveButton)
						.toggleClass('secondary', _isRemoveButton)
						.toggleClass('button', true)
						.toggleClass('is-loading', false)
						.text(_isRemoveButton ? 'Remove from Fees Calculator' : 'Add to Fees Calculator');
				})( !! ($('a.a-delete[data-item-id=' + $this.attr('data-item-id').toUpperCase() + ']', $_widget).length), $this);

			});
		};

		/*this is what you get for declining the glory of knockoutjs bindings*/
		$_widget.on('click change keypress', function(event) {

			var $this = $(this);
			var $target = $(event.target);
			//console.log($target);
			//console.log(event.type + '@' + event.target.id);
			switch (event.type + '@' + event.target.id) {
				case 'keypress@feescalc-login-email':
					if (event.which !== 13) {
						return;
					}
					event.preventDefault();
				case 'click@feescalc-login-btn':
					event.preventDefault();
					$_widget.loadCart($('#feescalc-login-email').val());
					break;
				case 'click@feescalc-logout-btn':
					event.preventDefault();
					$_widget.newCart();
					break;
				case 'keypress@feescalc-save-email':
					if (event.which !== 13) {
						return;
					}
					event.preventDefault();
				case 'click@feescalc-save-btn':
					event.preventDefault();
					$_widget.saveCart($('#feescalc-save-email').val());
					break;
				case 'click@feescalc-send-self-btn':
					if ($target.hasClass('disabled')) {
						break;
					}
					event.preventDefault();
					$target.addClass('is-loading disabled');
					$_widget.sendEmail('self').done(function() {
						$target.text('Added to My Courses').removeClass('is-loading');
					});
					break;
				case 'click@feescalc-send-advice-btn':
					if ($target.hasClass('disabled')) {
						break;
					}
					event.preventDefault();
					$target.addClass('is-loading disabled');
					$_widget.sendEmail('advice').done(function() {
						$target.text('Added to My Courses').removeClass('is-loading');
					});
					break;
				case 'click@feescalc-add-more-courses':
					event.preventDefault();
					$target.addClass('is-loading disabled');
					$target.load($target.attr('href') + '?SQ_DESIGN_NAME=blank', function() {
						$target.children(':first').unwrap();
					});
					break;
				case 'change@fees-type':
					event.preventDefault();
					$.cookie('vuw-feescalc-fees-type', $target.val(), {
						path: '/'
					});
					$_widget._data.domestic = ($target.val() !== 'international');
					$_widget.render();
					break;
				default:
					return;

			}
			//event.preventDefault();
			//return false;

		});
		/*.on('click', '#feescalc-login-btn', function(e){
		$_widget.loadCart($('#feescalc-login-email').val());
		return false;
	})
	.on('click', '#feescalc-logout-btn', function(e){
		$_widget.newCart();
		return false;
	})
	.on('click', '#feescalc-save-btn', function(e){
		$_widget.saveCart($('#feescalc-save-email').val());
		return false;
	})
	.on('click', '#feescalc-send-self-btn', function(e){
		var $this = $(this);
		if ($this.hasClass('disabled')){
			return false;
		}
		$this.addClass('is-loading disabled');
		$_widget.sendEmail('self').done(function(){
			$this.text('Added to My Courses').removeClass('is-loading');
		});
		return false;
	})
	.on('click', '#feescalc-send-advice-btn', function(e){
		var $this = $(this);
		if ($this.hasClass('disabled')){
			return false;
		}
		$this.addClass('is-loading disabled');
		$_widget.sendEmail('advice').done(function(){
			$this.text('Added to My Courses').removeClass('is-loading');
		});
		return false;
	})
	.on('click', '#feescalc-add-more-courses', function(e){
		var $this = $(this);
		$this.addClass('is-loading disabled');
		$this.load($this.attr('href')+'?SQ_DESIGN_NAME=blank', function() {
		    $this.children(':first').unwrap();
		});
		return false;
	})
	.on('change', '#fees-type', function(e){
		var $this = $(this);
		$.cookie('vuw-feescalc-fees-type', $this.val(), {path: '/'});
		$_widget._data.domestic = ($this.val()!=='international');
		$_widget.render();
	});*/


		$('body')
			.on('click', '.add-courses', function(e) {
				var $this = $(this);
				$this.addClass('is-loading');
				/*$this.data('courselist') value would be retrieved as proper JSON, which the api doesn't understand. String value instead:*/
				$_widget.addToCart($this.attr('data-courselist'));
				return false;
			})
			.on('click', '.a-delete', function(e) {
				var $this = $(this);
				$this.addClass('is-loading');
				$_widget.removeFromCart($(this).data('item-id'));
				return false;
			});

		function responseHandler(data, textStatus, jqXHR) {
			$_widget.removeClass('is-loading');

			//Firefox herpity derp: data is json string -_-
			if (typeof data !== 'object') {
				data = $.parseJSON(data);
			}

			if (data.request_status.success === true) {
				if (data.sessionID) {
					$.cookie('vuw-feescalc-sessionID', data.sessionID, {
						path: '/'
					});
				}
				$_widget._data = data;
				$.each($_widget._data.carts, function(index, cart) {
					$_widget._data.carts[index].domestic_total = parseFloat(cart.domestic_tuition);
					$_widget._data.carts[index].international_total = parseFloat(cart.international_tuition);
					$.each(cart.other_charges, function() {
						$_widget._data.carts[index].domestic_total += parseFloat(this.cost);
						$_widget._data.carts[index].international_total += parseFloat(this.cost);
					});
				});

				if ($.cookie('vuw-feescalc-fees-type', {
					path: '/'
				}) !== 'international') {
					$_widget._data.domestic = true;
				}
				$_widget.render();
			} else {
				switch (data.request_status.err) {
					case '821':
						/*'XXXX' is not a valid session ID*/
					case '822':
						/*'EEEEE' is not a valid email address*/
					case '702':
						/*Session not found*/
						if ($_widget._data.email) {
							/*no cart associated with this email address, error out*/
							$_widget._data.error = data.request_status.message;
							$_widget._data.email = undefined;
							//delete $_widget._data.email;
							$_widget.render();
						} else {
							/*it was just an expired/invalid sessionID; just create new session*/
							$_widget.newCart();
						}
						break;
					case '703':
						/*Cart already exists for this email*/
						$_widget._data.error = data.request_status.message;
						/*merge carts prompt here?*/
						$_widget.render();
						break;
					default:
						$_widget._data.error = data.request_status.message;
						$_widget.render();
				}
			}

		}

		function errorHandler(jqXHR, textStatus, errorThrown) {
			var data;
			/*non-200 responses are interpreted as errors; make sure they still get processed!*/
			try {
				data = $.parseJSON(jqXHR.responseText);
			} catch (e) {
				/*nope, not a valid non-200 response, error out*/
				$_widget.removeClass('is-loading');
				$_widget._data.error = 'An error has occurred';
				$_widget.render();
				return;
			}
			if (data) {
				/*keeping this outside of try*/
				//responseHandler(data);
				responseHandler(jqXHR.responseText);
			}
		}

		/*initialize widget
	  get sessionID from cookie*/
		var _seedSessionID = $.cookie('vuw-feescalc-sessionID', {
			path: '/'
		});
		if (_seedSessionID) {
			/*if there is a sessionID cookie, use its value to resume the session*/
			$_widget._data.sessionID = _seedSessionID;
			$_widget.loadCart();
		} else {
			/*if there is no sessionID cookie, start a new session*/
			$_widget.newCart();
		}

		return this;
	};

}(jQuery));