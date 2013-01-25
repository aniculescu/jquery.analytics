(function($) {
  // plugin options
	var options = {};
	var defaultOptions = {
		handlers: {
			anchorClick: {
				getLabel: function(domEl, h2) {
					if(h2.label) return h2.label;
					var thisEl = $(domEl),
							href = thisEl.attr("href"),
							newLabel = href,
							dataTag = options.dataTrack.toLowerCase();

					//get event label from the data- attribute
					if(typeof thisEl.attr("data-"+dataTag)!=='undefined' && typeof thisEl.data(dataTag).label!=='undefined'){
						newLabel = thisEl.data(dataTag).label;
					} else if(typeof href==="undefined" || href==="" || href==="#" || href.indexOf('javascript')>-1){
						//if no url or data- attribute, use the text of the "a" tag
						newLabel = $(domEl).text().replace(/^\s\s*/, '').replace(/\s\s*$/, '') + " - " + domEl.href;
					}
					h2.label = newLabel;
					return h2.label;
				},
				getAction: function(domEl, h2){
					if(h2.action) return h2.action;
					var newAction = options.handlers.anchorClick.evtName,  // click default action
							thisEl = $(domEl);
							dataTag = options.dataTrack.toLowerCase(),
							elHref = thisEl.attr("href");
					//get event action from data- attribute
					if(typeof thisEl.attr("data-"+dataTag)!=='undefined' && typeof thisEl.data(dataTag).action!=='undefined'){
						newAction = thisEl.data(dataTag).action;
					}
					h2.action = newAction;
					return h2.action;
				},
				getCategory: function(domEl, h2){
					if(h2.category)
						return h2.category;
					var thisEl = $(domEl),
							dataTag = options.dataTrack.toLowerCase();
					if(thisEl.attr("data-"+dataTag)){
						var newCategory = thisEl.data(dataTag).category;
						if(typeof newCategory!=='undefined'){
							h2.category = newCategory;
							return h2.category;
						}
					}
				},
				_isPageView: function(domEl, h2){
					return h2.vPageview;
				},	//the tracking rules match against various elements
				matcher: function(domEl, h2) {
					var elAttr;
					//pattern matching - against the href value
					var pattern = h2.pattern;
					if(pattern){
						var el_href = $(domEl).attr("href");
						if(typeof el_href !=="undefined"){
							return el_href.match(pattern);
						}
					}
					//pattern matching agains a specific attribute
					if(h2.attrPattern){
						var eAttr = h2.attrPattern.myAttr; //specified attribute to match against
						var ePattern = h2.attrPattern.aPattern; //specified pattern to match
						elAttr = (typeof eAttr!= "undefined") ? $(domEl).attr(eAttr) : null; //the dom element's attribute
						if(elAttr != null && typeof elAttr!="undefined"){
							return (elAttr.match(ePattern)!== null) ? true : false;
						}
					}
					// class matching
					if(h2.hasClass)
						return $(domEl).hasClass(h2.hasClass);
					// match element based on a given parent id or class
					if(h2.hasParent){
						var findParent = h2.hasParent;
						var myParent = $(domEl).closest(findParent);
						if(typeof myParent !== "undefined" && myParent.length>0){
							return true;
						}
					}
					//match a specific attribute
					if(h2.hasAttr){
						elAttr = $(domEl).attr(h2.hasAttr);
						if(typeof elAttr!=="undefined")
							return h2.hasAttr;
					}
					return false;
				}
			}
		}
	};

	function setupPageTracker() {
		$.extend(true, options, defaultOptions);

		// loading google analytics' ga.js
		var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
		ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
		var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);

		//check the set domain and prepend the . for cross domain/best practices
		var domainName = (options.domainName.substr(0, 1) != ".") ? "." + options.domainName : options.domainName;

		//For a Dev Env. use the full dev environment url to fully test tracking.
		if(typeof options.devConfigPath != "undefined" && options.devConfigPath != ""){
			domainName += document.domain.split(options.domainName)[1];
		}
		//setup the site-specific analytics tracker with cross domain support.
		_gaq.push(
			['gameSite._setAccount', options.accountId],
			['gameSite._setDomainName', domainName]
		);

		if(options.isCrossDomainTracking){
			_gaq.push(['gameSite._setAllowLinker', true]);
		}

		//set tracking beacon for site-specific tracker.
		_gaq.push(['gameSite._trackPageview']);


		//generate a virtual pageview for testing purposes
		if(typeof options.debugPageView!="undefined" && options.debugPageView != ""){
			_gaq.push(['gameSite._trackPageview', options.debugPageView]);
		}

		// check for the Roll Up account
		if(options.rollupAccountId!="" && options.isCrossDomainTracking!=false) {
			_gaq.push(
				['rollup._setAccount', options.rollupAccountId],
				['rollup._setDomainName', domainName],
				['rollup._setAllowLinker',true],  //assume cross-domain tracking
				['rollup._trackPageview'] //set tracking beacon for Roll Up tracker
			);

			//generate a virtual pageview in the Roll Up account
			if(typeof options.debugPageView!="undefined" && options.debugPageView != ""){
				_gaq.push(['rollup._trackPageview', options.debugPageView]);
			}
		}
	}
	

	// /-- Event Tracking method ---
	function trackEvent(category, action, label, value) {
		if(typeof _gat !== 'undefined') {
			_gaq.push(['gameSite._trackEvent', category, action, label, value]);
			/** todo: track events in the roll up account as well
			*   //prepend the label with an identifier for the site the events originates.
			*	label = "( " + options.pageProfile + " ) " + label;
			*	_gaq.push(['rollup._trackEvent', category, action, label, value]);
			**/
		}else {
			debug('Not able to track event without page tracker','error');
		}
	}

	// Cross-domain method
	function crossDomain(extUrl, blankPage){
		if (typeof _gat != 'undefined') {
			/* for links with target attribute set to _blank,
			append cross-domain query strings and open in new window. */
			if(blankPage){
				_gaq.push(function(){
					var rTracker = _gat._getTrackerByName("rollup");
					var linkerUrl = rTracker._getLinkerUrl(extUrl);
					window.open(linkerUrl);
				});
			}
			else {
				_gaq.push(['rollup._link', extUrl]);  //the _link method automatically appends the query strings
			}

		} else if(options.debug) {
			debug("Unable to do cross domain pageTracker is: ", "error");
		}
	}
	
	// /-- Track pageview method
	function trackPage(page_url){
		if(typeof _gaq !== 'undefined') {
			_gaq.push(['gameSite._trackPageview', page_url]);

			// check for Roll Up account to record the same virtual pageview there
			if (options.rollupAccountId) {
				var siteHostName = document.location.hostname;

				//prepend the virtualPageview with the hostname for identification.
				_gaq.push(['rollup._trackPageview', "/" + siteHostName + "/" + page_url]);
			}
		} else {
			debug("Not able to track page view - page tracker undefined", "error");
		}
	}
	
	function setupEventHandlers() {
		//get the page profile; if not set, attempt to set the profile based on the URL
		var pp =  (options.pageProfile !== "") ? options.pageProfile : document.URL.split(".com")[0].split(".")[1].replace("-", "");
		var eventsMap = [];
		if(options.handlers){
			for (hname in options.handlers) {
				var h = options.handlers[hname];
				if(typeof h.selector!="undefined"){
					$(h.selector).each(function(index, value) {
						$(this).bind(h.evtName, {
							h: h
						}, function(e) {
							var h = e.data.h,
								linkEl = $(this),
								eHref = linkEl.attr('href');
							//check if the page profile was setup and properly referenced.
							if(typeof h.handlers[pp]!="undefined"){
								//loop through the configuration rules for a given profile and fire the appropriate events.
								for (h2Name in h.handlers[pp].handler) {
									var h2 = h.handlers[pp].handler[h2Name],
										matcher = h2.matcher ? h2.matcher : h.matcher;

									if (matcher == null || matcher(this, h2)) {
										var category = h.getCategory(this, h2),
											action = h.getAction(this, h2),
											label = h.getLabel(this, h2);
										trackEvent(category, action, label);
									}
								}
							}
							//cross domain tracking
							if (options.isCrossDomainTracking && typeof eHref != 'undefined' && eHref.indexOf("http") > -1) {
								var thisPage = document.URL,
									blankLink = (linkEl.attr("target") == "_blank") ? true : false;
								if(isValidCrossDomainUrl(eHref)){
									e.preventDefault();
									crossDomain(eHref, blankLink);
								}
							}
						});
					});
				}
			}
		}
	}

	//check if an external link is an NCsoft site participating in cross domain tracking
	function isValidCrossDomainUrl(extUrl){
		if(typeof extUrl!="undefined" && extUrl!="" && extUrl.indexOf("://")>-1 && (extUrl.indexOf(".com")>-1 || extUrl.indexOf(".corp")>-1)){
			var destDomain = extUrl.split("://")[1].split("."),
				destDomainPrefix = destDomain[0],
				destDomainRoot = destDomain[1],
				destDomainSuffix = (destDomain[2].indexOf("/")>-1) ? destDomain[2].split("/")[0] : destDomain[2],
				currentDomain = options.domainName.substring(1);
			if (typeof destDomainRoot != "undefined" && destDomainRoot != "") {
				if (destDomainPrefix == "secure" && destDomainRoot == "ncsoft") {
					destDomainRoot = "secureNcsoft";
				}
				var destURI = destDomainRoot + "." + destDomainSuffix,
					destURL = destDomainPrefix + "." + destURI;

				/* check that the destination domain is:
					- different from current,
					- not in the excludes list (options.crossDomainExcludes)
					- found in the list of Cross Domain Sites (options.ncSites)
				*/
				var excludeMatches = 0;
				for (var eSite in options.crossDomainExcludes){
						if(destURL == options.crossDomainExcludes[eSite]){
							excludeMatches++;
						}
				}

				if (destURI !== currentDomain && excludeMatches < 1){
					for (var iSite in options.ncSites) {
						if (options.ncSites[iSite] == destURI){
							return true;
						}
					}
				}
			}
		}
		return false;
	}

	// /-- Debugging Function ---
	function debug(msg,type) {
		if(typeof window.console == 'undefined' || typeof window.console.log == 'undefined'){
			return;
		}

		if(options.debug != true)
			return;
		if(type ==="debug")
			return console.debug(msg);
		if(type === 'info')
			return console.info(msg);
		if(type === 'warning')
			return console.warn(msg);
		if(type === 'error')
			return console.error('Custom Error: ' + msg);
	}
	
	// /-- Create an Event Tracker Method ---
	// Note that because this plugin is only to be used once on a page, there is no need to try and preserve the
	// default options.  This code merges override options directly into the "default options" because its cleaner that way.

	$.fn.ncsCustomEventTracker = function(overrideOptions){
		$.extend(true, options, overrideOptions);
		var category = options.cCategory,
				action = options.cAction,
				label = options.cLabel;
		if(typeof category!="undefined" && typeof action!="undefined" && typeof label!="undefined"){
			trackEvent(category, action, label);
		} else {
			debug('Unable to track event, not all parameters were defined','info');
		}
	};

	$.fn.ncsVirtualPageTracker = function (overrideOptions){
		$.extend(true, options, overrideOptions);
		if(typeof options.virtualPageUrl != "undefined" && options.virtualPageUrl!=""){
			trackPage(options.virtualPageUrl);
		} else {
			debug('Unable to track virtual pageview - no url set','info');
		}
	};

	$.fn.ncsEventTracker = function(overrideOptions) {
		//load the config from a dev instance/staging or production
		var configHostUrl = "",
			prodPluginPath = "globalTracker/",
			pageProtocol = document.location.protocol,
			pluginUrl = "",
			configFileName = overrideOptions.configFile || "globalTracker.config.js";
		
		//prod version
		configHostUrl = (pageProtocol == "https:") ? overrideOptions.secureDomainLocation : overrideOptions.nonSecureDomainLocation;
		pluginUrl = configHostUrl + prodPluginPath + configFileName;

		//devPath option set when initializing plugin.
		if(typeof overrideOptions.configPath != "undefined" && overrideOptions.configPath != ""){
			//dev version
			pluginUrl = pageProtocol + "//" + document.domain + overrideOptions.configPath + configFileName;
		}

		$.ajax({
			type: 'GET',
			dataType: 'script',
			url: pluginUrl,
			cache: true,
			success: function() {
				options = setOptions();
				$.extend(true, options, overrideOptions);
				if (options.isPageTracking) {
					setupPageTracker();
				}
				if (options.isEventTracking) setupEventHandlers();
			},
			error: function(jqXHR, textStatus){
				debug("Unable to load config file", "info");
			}
		});
	};

})(jQuery);
