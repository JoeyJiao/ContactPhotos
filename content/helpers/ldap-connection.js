function pLDAPConnection () {
	// PARAMETERS
	this.url = null;
	this.bindDn = null;
	this.bindPassword = null;
	// STATE VARIABLES
	this.isConnected = false;
	this.bindFailed = false;
	this.bindInProgress = false;
	this.connection = Components.classes["@mozilla.org/network/ldap-connection;1"].createInstance()
						        .QueryInterface(Components.interfaces.nsILDAPConnection);
	this.connectionListener = null;
	this.init = function(callback) {
		//jsdump('------------- BEGIN Init ---------------------------');
		// I have to create local variables, otherwise setTimeout won't see them.
		
		var me = this;
		var cbk = callback;
		
		if(this.bindInProgress) {
			jsdump('------------- Init: Bind in progress... ---------------------------');
			setTimeout( function() {
							me.init(cbk);
						}, 1000);
			return;
		}
		if(this.isConnected) {
			if(this.bindFailed) {
				callback.onBindResult(false, -1); 
			} else {
				callback.onBindResult(true, -1); 
			}
			return;
		}		
		jsdump('------------- Init: NOT connected ... ---------------------------');
		var sURI = this.url;
		var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);  
		var url = ioService.newURI(sURI, null, null).QueryInterface(Components.interfaces.nsILDAPURL);
		jsdump("Initializing LDAP connection on " + this.url + " as DN: " + this.bindDn + ".");
		this.connectionListener = new pLDAPMessageListener(this);		
		this.connection.init(url, this.bindDn, this.connectionListener, null, this.connection.VERSION3);
		this.bindInProgress = true;
		jsdump('------------- END Init ---------------------------');
		setTimeout( function() {
							me.init(cbk);
						}, 1000);
	};
	
	this.bind = function(callback) {
		jsdump('------------- BEGIN Bind ---------------------------');
		var ldapOp = Components.classes["@mozilla.org/network/ldap-operation;1"].createInstance()
							   .QueryInterface(Components.interfaces.nsILDAPOperation);
		ldapOp.init(this.connection, this.connectionListener, null);
		ldapOp.simpleBind(this.bindPassword);
		jsdump('------------- END Bind ---------------------------');
	};
	
	this.close = function() {
		jsdump('------------- BEGIN Close ---------------------------');
		this.connectionListener = null;
		this.connection = null;
		jsdump('------------- END Close ---------------------------');
	};
	
	this.search = function(dn, scope, filter, attributes, callbackHandler) {
		var me = this;
		var cbk = callbackHandler;
		var searchCallBack = {
			onBindResult: function(success) {
				if(!success) {
					cbk.onBindResult(false);
					jsdump('------------- Bind Failed ---------------------------');
					return;
				}
				//jsdump('------------- BEGIN Search ---------------------------');
				var length = null;
				if(attributes) {
					length = attributes.length
				} else {
					attributes = null;
				};
				var proxy = new pLDAPMessageListener(me, cbk);
				var ldapOp = Components.classes["@mozilla.org/network/ldap-operation;1"].createInstance()
						   .QueryInterface(Components.interfaces.nsILDAPOperation);
				ldapOp.init(me.connection, proxy, null);
				ldapOp.searchExt(dn, scope, filter, length, attributes, 0, 0);
			}
		};
		me.init(searchCallBack);
	}
}
