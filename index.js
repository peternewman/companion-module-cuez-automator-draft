// Sony-Bravia

var instance_skel = require('../../instance_skel');
var debug;
var log;

function instance(system, id, config) {
	var self = this;

	// super-constructor
	instance_skel.apply(this, arguments);

	self.actions(); // export actions
	
	return self;
}

instance.prototype.init = function () {
	var self = this;

	debug = self.debug;
	log = self.log;

	self.status(self.STATUS_OK);

	self.initModule();
};

instance.prototype.updateConfig = function (config) {
	var self = this;
	self.config = config;

	self.status(self.STATUS_OK);

	self.initModule();
};

instance.prototype.initModule = function () {
	var self = this;
	
	self.actions(); // export actions
};

// Return config fields for web config
instance.prototype.config_fields = function () {
	var self = this;

	return [
		{
			type: 'text',
			id: 'info',
			width: 12,
			label: 'Information',
			value: 'The TV will need to be configured with a Pre Shared Key (PSK).'
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'Target IP',
			width: 6,
			regex: self.REGEX_IP
		},
		{
			type: 'textinput',
			id: 'psk',
			label: 'Pre Shared Key (PSK)',
			width: 6
		}
	]
}

// When module gets deleted
instance.prototype.destroy = function () {
	var self = this;

	debug('destroy', self.id);
}

instance.prototype.actions = function (system) {
	var self = this;

	self.system.emit('instance_actions', self.id, {
		'power_on': {
			label: 'Power On'
		},
		'power_off': {
			label: 'Power Off'
		},
		'volume_up': {
			label: 'Volume Up'
		},
		'volume_down': {
			label: 'Volume Down'
		},
		'volume_mute': {
			label: 'Volume Mute'
		},
		'volume_unmute': {
			label: 'Volume Unmute'
		},
		'change_external_input': {
			label: 'Change External Input',
			options: [
				{
					type: 'dropdown',
					label: 'Kind',
					id: 'kind',
					choices: [ {id: 'hdmi', label: 'HDMI'}, {id: 'composite', label: 'Composite'}, {id: 'scart', label: 'SCART'}]
				},
				{
					type: 'dropdown',
					label: 'Port',
					id: 'port',
					choices: [ {id: '1', label: '1'}, {id: '2', label: '2'}, {id: '3', label: '3'}, {id: '4', label: '4'} ]
				}
			]
		}
	});
};

instance.prototype.action = function (action) {
	let self = this;
	let options = action.options;
	
	let host = self.config.host;
	let port = 80;
	let psk = self.config.psk;

	let service = null;
	let method = null;
	let params = null;

	switch (action.action) {
		case 'power_on':
			service = 'system';
			method = 'setPowerStatus';
			params = {status: true};
			break;
		case 'power_off':
			service = 'system';
			method = 'setPowerStatus';
			params = {status: false};
			break;
		case 'volume_up':
			service = 'audio';
			method = 'setAudioVolume';
			params = {target: 'speaker', volume: '+1'};
			break;
		case 'volume_down':
			service = 'audio';
			method = 'setAudioVolume';
			params = {target: 'speaker', volume: '-1'};
			break;
		case 'volume_mute':
			service = 'audio';
			method = 'setAudioMute';
			params = {status: true};
			break;
		case 'volume_unmute':
			service = 'audio';
			method = 'setAudioMute';
			params = {status: false};
			break;
		case 'change_external_input':
			service = 'avContent';
			method = 'setPlayContent';
			let uri = 'extInput:' + options.kind + '?port=' + options.port;
			params = {uri: uri};
			break;
		default:
			break;
	}

	let cmdObj = {};
	cmdObj.method = method;
	cmdObj.version = '1.0';
	cmdObj.id = 1;
	cmdObj.params = [params];

	self.postRest('/sony/' + service, host, port, cmdObj)
	.then(function(arrResult) {
		if (arrResult[2].error) {
			//throw an error to the log
			self.log('error', arrResult[2].error[1]);
		}
	})
	.catch(function(arrResult) {
		self.status(self.STATUS_ERROR, arrResult);
	 });
};

instance.prototype.getRest = function(cmd, host, port) {
	var self = this;
	return self.doRest('GET', cmd, host, port, {});
};

instance.prototype.postRest = function(cmd, host, port, body) {
	var self = this;
	return self.doRest('POST', cmd, host, port, body);
};

instance.prototype.doRest = function(method, cmd, host, port, body) {
	var self = this;
	var url = 'http://' + self.config.host + cmd;

	let extra_headers = {};
	extra_headers['X-Auth-PSK'] = self.config.psk;

	return new Promise(function(resolve, reject) {

		function handleResponse(err, result) {
			if (err === null && typeof result === 'object' && result.response.statusCode === 200) {
				// A successful response

				var objJson = result.data;
				
				resolve([ host, port, objJson ]);
			} else {
				// Failure. Reject the promise.
				var message = 'Unknown error';

				if (result !== undefined) {
					if (result.response !== undefined) {
						message = result.response.statusCode + ': ' + result.response.statusMessage;
					} else if (result.error !== undefined) {
						// Get the error message from the object if present.
						message = result.error;
					}
				}

				reject([ host, port, message ]);
			}
		}

		switch(method) {
			case 'POST':
				self.system.emit('rest', url, body, function(err, result) {
					handleResponse(err, result);
				}, extra_headers);
				break;
			case 'GET':
				self.system.emit('rest_get', url, function(err, result) {
					handleResponse(err, result);
				}, extra_headers);
				break;
			default:
				throw new Error('Invalid method');
				break;
		}
	});
};

instance_skel.extendedBy(instance);
exports = module.exports = instance;
