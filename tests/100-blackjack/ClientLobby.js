var ClientLobby = {
	loadLobby: function () {
		// Load all our game textures
		this.gameTexture.tableBackground = new IgeTexture(ige.basePath + 'assets/textures/backgrounds/tableExtended.png');
		this.gameTexture.cardSheet = new IgeCellSheet(ige.basePath + 'assets/textures/objects/cardSheet_1950.png', 13, 4);
		this.gameTexture.chipSheet = new IgeCellSheet(ige.basePath + 'assets/textures/objects/chipsSheet.png', 5, 2);
	},

	createLobby: function () {
		// Create the lobby scene
		this.lobbyScene = new IgeScene2d()
			.mount(this.mainScene);

		// Load the lobby login screen
		ige.showWebView('views/lobby.html');
	},

	lobbyLogin: function (username, password) {
		// Connect to the server and ask for authentication
		//ws://localhost:8000/socket.io/websocket
		ige.network.start('ws://localhost:2000/socket.io/1/websocket/handshake', function () {
			console.log('Connected!');
		});
	}
};