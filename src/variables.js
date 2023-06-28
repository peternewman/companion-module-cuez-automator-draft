module.exports = {
	initVariables: function () {
		let self = this;

		let variables = [];

		variables.push({variableId: 'powerState', label: 'Power State'});
		variables.push({variableId: 'muteState', label: 'Mute State'});
		variables.push({variableId: 'volumeLevel', label: 'Current Volume Level'});
		variables.push({variableId: 'input', label: 'Current Input'});

		self.setVariableDefinitions(variables);
	},

	checkVariables: function () {
		let self = this;

		try {
			self.setVariableValues({
				'powerState': self.DATA.powerState,
				'muteState': self.DATA.muteState,
				'volumeLevel': self.DATA.volumeLevel,
				'input': self.DATA.input
			});
		}
		catch(error) {
			self.log('error', 'Error setting variables: ' + error);
		}
	}
}
